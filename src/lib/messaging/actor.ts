import "server-only";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { resolveActiveChildSession } from "@/lib/family/childResolvers";
import type { PersonaId } from "./matrix";

// P4.6-A · résolution de l'acteur Messagerie côté serveur.
//
// Le navigateur ne fournit jamais rôle/senderId/parentUserId. Tout est
// dérivé ici depuis :
//   - session enfant (cookie signé) si présente (child_monde/child_racines)
//   - session Supabase adulte sinon (via UserAppRole)
//   - contextes métier (Household, Center, Classroom) résolus par les
//     helpers dédiés (family/actor.ts, permissions/*, etc.)

export interface MessagingActor {
  actorType: "USER" | "CHILD_PROFILE";
  userId?: string;
  childProfileId?: string;
  persona: PersonaId;
  // Contexts autorisés dérivés de l'identité active. Ces IDs restent
  // strictement server-only et ne quittent jamais l'API sans projection.
  ownedHouseholdIds: string[];
  memberHouseholdIds: string[];
  centerId?: string | null;
  classroomIds?: string[]; // pour Teacher
}

export async function resolveMessagingActor(): Promise<MessagingActor | null> {
  // 1. Priorité cookie enfant (Lot 5). Le child cookie prévaut sur la
  // session Supabase adulte pour éviter tout mix de contexte.
  const childSession = await resolveActiveChildSession();
  if (childSession) {
    return {
      actorType: "CHILD_PROFILE",
      childProfileId: childSession.childProfileId,
      persona: childSession.universe === "MONDE" ? "child_monde" : "child_racines",
      ownedHouseholdIds: [],
      memberHouseholdIds: childSession.householdId ? [childSession.householdId] : [],
    };
  }

  // 2. Session Supabase adulte.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: {
      id: true,
      role: true,
      centerId: true,
      appRoles: { select: { role: true } },
      teacher: { select: { id: true, centerId: true } },
    },
  });
  if (!dbUser) return null;

  // Dérive le persona depuis la combinaison AppRole + Role. On préfère
  // AppRole quand présent, fallback sur Role legacy sinon.
  const appRoles = new Set(dbUser.appRoles.map((r) => r.role));
  const persona = derivePersonaFromRoles(dbUser.role, appRoles);
  if (!persona) return null;

  const [ownedHhs, memberHhs, teacherClassrooms] = await Promise.all([
    prisma.household.findMany({
      where: { ownerUserId: dbUser.id, status: "ACTIVE" },
      select: { id: true },
    }),
    prisma.householdMembership.findMany({
      where: { userId: dbUser.id, status: "ACTIVE" },
      select: { householdId: true },
    }),
    dbUser.teacher
      ? prisma.classroom.findMany({
          where: { teacherId: dbUser.teacher.id, isActive: true },
          select: { id: true },
        })
      : Promise.resolve([]),
  ]);

  return {
    actorType: "USER",
    userId: dbUser.id,
    persona,
    ownedHouseholdIds: ownedHhs.map((h) => h.id),
    memberHouseholdIds: memberHhs.map((m) => m.householdId),
    centerId: dbUser.teacher?.centerId ?? dbUser.centerId ?? null,
    classroomIds: teacherClassrooms.map((c) => c.id),
  };
}

type AppRole = "LEARNER" | "PARENT" | "TEACHER" | "CAREER_COACH" | "CENTER_ADMIN" | "YEMA_ADMIN" | "RACINES_COACH";
type LegacyRole = "STUDENT" | "TEACHER" | "ADMIN" | "CENTER";

function derivePersonaFromRoles(legacy: LegacyRole, appRoles: Set<AppRole>): PersonaId | null {
  if (appRoles.has("YEMA_ADMIN") || legacy === "ADMIN") return "super_admin";
  if (appRoles.has("CENTER_ADMIN") || legacy === "CENTER") return "center_admin";
  if (appRoles.has("TEACHER") || legacy === "TEACHER") return "teacher";
  if (appRoles.has("RACINES_COACH")) return "coach";
  if (appRoles.has("PARENT")) return "family";
  if (legacy === "STUDENT") {
    // On n'a pas la LP ici · le service caller vérifie l'univers si
    // besoin. Par défaut on classe comme student_monde (le dispatch
    // messaging retombera sur la matrice qui refuse tout accès Racines).
    return "student_monde";
  }
  return null;
}
