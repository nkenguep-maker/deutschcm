// P4.4 · Résolution serveur "Coach Racines courant" pour l'utilisateur
// authentifié.
//
// **Séparation stricte** (§2 spec P4.4) · un Coach Racines est UNIQUEMENT un
// `UserAppRole.role = "RACINES_COACH"`. Le rôle applicatif
// `CAREER_COACH` n'est JAMAIS accepté en fallback ni en OR. Un utilisateur
// qui n'a QUE `CAREER_COACH` reçoit 403 sur les endpoints Racines.
//
// **Règle YEMA_ADMIN** · un rôle global `YEMA_ADMIN` seul n'ouvre PAS le
// workspace Coach Racines. Il faut un `CircleMembership` `COACH` `ACTIVE`
// sur au moins un Circle actif. Cohérent avec la règle Teacher (P4.3b §7).
//
// **Aucun** `coachId` / `circleId` / `childProfileId` / `householdId` /
// `parentId` client (body/query/header/param) n'est jamais accepté comme
// source d'autorité. Toute autorité provient de `resolveRootsCoachActor` +
// des `assert*` scopés au coach courant.
//
// **Capacité** (Q15) · 10 Circles actifs max · 20 profils enfants actifs
// max par coach. Vérifiée par `assertRootsCoachCapacity` et par les gardes
// P4.1 (`assertCoachCapacityAvailable` de `src/lib/circles/capacity.ts`).

import { prisma } from "@/lib/prisma";
import { writeAuditEvent } from "@/lib/audit/events";
import {
  PermissionError,
  resolveCircleActor,
  type CircleActor,
} from "./circle";
import {
  MAX_ACTIVE_CIRCLES_PER_COACH,
  MAX_ACTIVE_CHILDREN_PER_COACH,
} from "@/lib/circles/capacity";

export interface RootsCoachActor extends CircleActor {
  /** UserId applicatif du coach. Pas de `coachId` distinct (Coach = User avec rôle). */
  actorRole: "RACINES_COACH";
  activeCircleCount: number;
  activeChildProfileCount: number;
}

/**
 * Émet un AuditEvent de refus Coach Racines. Fire-and-forget · aucun echec
 * d'audit ne bloque la réponse HTTP.
 *
 * Metadata autorisée · `actorUserId`, `actorCoachId`, `circleId`,
 * `childProfileId`, `reasonCode`, `routeAction`, `capacityType`.
 * Metadata interdite · nom enfant, email, téléphone, adresse, date de
 * naissance, body, token, cookie, contenu pédagogique (filtré en défense
 * par `sanitizeMetadata` dans `writeAuditEvent`).
 */
async function auditRootsCoachRefusal(rec: {
  action:
    | "ROOTS_COACH_ACCESS_DENIED"
    | "ROOTS_COACH_CIRCLE_ACCESS_DENIED"
    | "ROOTS_COACH_PROFILE_ACCESS_DENIED"
    | "ROOTS_COACH_CAPACITY_REACHED"
    | "ROOTS_COACH_ASSIGNMENT_REVOKED"
    | "ROOTS_COACH_SCOPE_AMBIGUOUS";
  actorUserId: string | null;
  actorRole?: string | null;
  targetType: string;
  targetId: string;
  metadata?: Record<string, string | number | boolean | null>;
}): Promise<void> {
  try {
    await writeAuditEvent({
      actorUserId: rec.actorUserId,
      actorRole: rec.actorRole ?? null,
      action: rec.action,
      targetType: rec.targetType,
      targetId: rec.targetId,
      scopeType: "RootsCoachWorkspace",
      scopeId: null,
      metadata: rec.metadata ?? null,
    });
  } catch (e) {
    console.warn(`[audit] ${rec.action} write failed:`, (e as Error).message);
  }
}

/**
 * Résout le Coach Racines courant.
 * - 401 anonyme
 * - 403 aucun rôle `RACINES_COACH` (Career Coach seul, Teacher, Center admin,
 *   Student, ou YEMA_ADMIN sans membership Coach)
 * - 200 même avec 0 Circle actif (le dashboard affiche un état "onboarding")
 *
 * Événements audit · `ROOTS_COACH_ACCESS_DENIED` sur 403.
 */
export async function resolveRootsCoachActor(): Promise<RootsCoachActor> {
  const actor = await resolveCircleActor(); // 401 handled here
  const dbUser = await prisma.user.findUnique({
    where: { id: actor.userId },
    select: {
      id: true,
      role: true,
      appRoles: { select: { role: true } },
    },
  });
  if (!dbUser) throw new PermissionError("NOT_FOUND", "user not found");

  const appRoles = new Set(dbUser.appRoles.map((r) => r.role));
  // STRICT · seul `RACINES_COACH` ouvre le workspace. `CAREER_COACH` ne
  // convient PAS. `YEMA_ADMIN` seul ne convient pas non plus (voir doctrine
  // hardening Teacher §7 · rôle global ne suffit jamais).
  if (!appRoles.has("RACINES_COACH")) {
    await auditRootsCoachRefusal({
      action: "ROOTS_COACH_ACCESS_DENIED",
      actorUserId: dbUser.id,
      actorRole: dbUser.role,
      targetType: "RootsCoachWorkspace",
      targetId: "resolve",
      metadata: {
        reasonCode: "role_missing",
        appRoles: [...appRoles].sort().join(","),
      },
    });
    throw new PermissionError("FORBIDDEN", "roots coach access required");
  }

  const [activeCircleCount, activeChildProfileCount] = await Promise.all([
    prisma.circleMembership.count({
      where: {
        userId: dbUser.id,
        role: "COACH",
        status: "ACTIVE",
        circle: { status: "ACTIVE" },
      },
    }),
    // Compte les CHILD memberships actifs des circles où ce coach est actif.
    // Utilise une jointure Prisma implicite via `circleId in (...)`.
    (async () => {
      const activeCircles = await prisma.circleMembership.findMany({
        where: {
          userId: dbUser.id,
          role: "COACH",
          status: "ACTIVE",
          circle: { status: "ACTIVE" },
        },
        select: { circleId: true },
      });
      const circleIds = activeCircles.map((c) => c.circleId);
      if (circleIds.length === 0) return 0;
      return prisma.circleMembership.count({
        where: { circleId: { in: circleIds }, role: "CHILD", status: "ACTIVE" },
      });
    })(),
  ]);

  return {
    ...actor,
    actorRole: "RACINES_COACH",
    activeCircleCount,
    activeChildProfileCount,
  };
}

export async function resolveRootsCoachActorOrNull(): Promise<RootsCoachActor | null> {
  try {
    return await resolveRootsCoachActor();
  } catch {
    return null;
  }
}

/**
 * Vérifie que `circleId` correspond à un Circle sur lequel le coach a un
 * `CircleMembership` `COACH` `ACTIVE`, ET que le Circle est actif. Throw
 * 404 sans oracle si le Circle est étranger, archivé, ou que le membership
 * a été retiré (Q10 · révocation immédiate).
 *
 * Émet `ROOTS_COACH_CIRCLE_ACCESS_DENIED` (fire-and-forget) sur refus si
 * le Circle existe (évite le bruit d'audit sur des IDs bidons).
 */
export async function assertRootsCoachCircleAccess(
  actor: RootsCoachActor,
  circleId: string,
): Promise<{ id: string; language: string; status: "ACTIVE" | "ARCHIVED" | "SUSPENDED" }> {
  if (typeof circleId !== "string" || circleId.length < 4) {
    throw new PermissionError("NOT_FOUND", "circle not found");
  }
  const [membership, foreignCircle] = await Promise.all([
    prisma.circleMembership.findFirst({
      where: {
        circleId,
        userId: actor.userId,
        role: "COACH",
        status: "ACTIVE",
        circle: { status: "ACTIVE" },
      },
      select: {
        id: true,
        circle: { select: { id: true, language: true, status: true } },
      },
    }),
    // Si le Circle existe mais membership indisponible, on émet un audit
    // avec targetId=circleId réel pour trace forensique. Aucun oracle sur
    // "cette classe existe pour un autre coach" n'est renvoyé au caller.
    prisma.circle.findUnique({
      where: { id: circleId },
      select: { id: true, status: true },
    }),
  ]);
  if (!membership || !membership.circle) {
    if (foreignCircle) {
      await auditRootsCoachRefusal({
        action: "ROOTS_COACH_CIRCLE_ACCESS_DENIED",
        actorUserId: actor.userId,
        actorRole: actor.actorRole,
        targetType: "Circle",
        targetId: foreignCircle.id,
        metadata: {
          reasonCode: "not_assigned_or_archived",
          circleStatus: String(foreignCircle.status),
        },
      });
    }
    throw new PermissionError("NOT_FOUND", "circle not found");
  }
  return {
    id: membership.circle.id,
    language: String(membership.circle.language),
    status: membership.circle.status as "ACTIVE" | "ARCHIVED" | "SUSPENDED",
  };
}

/**
 * Vérifie qu'un `childProfileId` appartient à un Circle du coach courant.
 * Throw 404 sans oracle sinon. Émet
 * `ROOTS_COACH_PROFILE_ACCESS_DENIED` si le profil existe mais hors scope.
 */
export async function assertRootsCoachChildAccess(
  actor: RootsCoachActor,
  childProfileId: string,
): Promise<{ circleId: string }> {
  if (typeof childProfileId !== "string" || childProfileId.length < 4) {
    throw new PermissionError("NOT_FOUND", "child profile not found");
  }
  const [inScope, foreign] = await Promise.all([
    prisma.circleMembership.findFirst({
      where: {
        childProfileId,
        role: "CHILD",
        status: "ACTIVE",
        circle: {
          status: "ACTIVE",
          memberships: {
            some: { userId: actor.userId, role: "COACH", status: "ACTIVE" },
          },
        },
      },
      select: { circleId: true },
    }),
    prisma.circleMembership.findFirst({
      where: { childProfileId, role: "CHILD", status: "ACTIVE" },
      select: { circleId: true },
    }),
  ]);
  if (!inScope) {
    if (foreign) {
      await auditRootsCoachRefusal({
        action: "ROOTS_COACH_PROFILE_ACCESS_DENIED",
        actorUserId: actor.userId,
        actorRole: actor.actorRole,
        targetType: "ChildProfile",
        targetId: childProfileId,
        metadata: {
          reasonCode: "profile_not_in_coach_circle",
          foreignCircleId: foreign.circleId,
        },
      });
    }
    throw new PermissionError("NOT_FOUND", "child profile not found");
  }
  return inScope;
}

/**
 * Vérifie que le membership Coach du caller sur `circleId` est encore
 * `ACTIVE`. Throw 403 sinon. Utile juste avant une opération sensible
 * (session, écriture future) pour détecter les révocations concurrentes.
 */
export async function assertActiveCoachMembership(
  actor: RootsCoachActor,
  circleId: string,
): Promise<void> {
  const m = await prisma.circleMembership.findFirst({
    where: {
      circleId,
      userId: actor.userId,
      role: "COACH",
      status: "ACTIVE",
      circle: { status: "ACTIVE" },
    },
    select: { id: true },
  });
  if (!m) {
    throw new PermissionError("FORBIDDEN", "coach membership inactive");
  }
}

/**
 * Vérifie que le coach courant a la capacité pour un profil enfant
 * supplémentaire (§8 spec P4.4 · borne 20). Purement informative en
 * lecture · l'assignation reste un workflow ADMIN qui appelle
 * `assertCoachCapacityAvailable` de `src/lib/circles/capacity.ts`.
 */
export function assertRootsCoachProfileCapacity(actor: RootsCoachActor): void {
  if (actor.activeChildProfileCount >= MAX_ACTIVE_CHILDREN_PER_COACH) {
    throw new PermissionError("CONFLICT", "coach profile capacity reached");
  }
}

/** Idem pour les Circles (borne 10). */
export function assertRootsCoachCircleCapacity(actor: RootsCoachActor): void {
  if (actor.activeCircleCount >= MAX_ACTIVE_CIRCLES_PER_COACH) {
    throw new PermissionError("CONFLICT", "coach circle capacity reached");
  }
}

export {
  PermissionError,
  MAX_ACTIVE_CIRCLES_PER_COACH,
  MAX_ACTIVE_CHILDREN_PER_COACH,
};
