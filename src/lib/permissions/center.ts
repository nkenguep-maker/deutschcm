// P4.3a · Résolution serveur "centre courant" pour l'utilisateur authentifié.
//
// Source de vérité · `User.role = "CENTER" | "ADMIN"` (rôle applicatif legacy
// V1 · voir schema.prisma enum Role) OU `UserAppRole.role = "CENTER_ADMIN"
// | "YEMA_ADMIN"` (V2). Le centre est résolu via `Teacher.centerId`
// (relation persistée `Teacher` → `LanguageCenter`).
//
// P4.3a hardening · résolution défensive contre trois états distincts ·
//   1. ZERO_BINDING   → 404 `no center membership resolved`
//   2. ONE_BINDING    → 200 (cas nominal)
//   3. AMBIGUOUS      → 409 `center scope ambiguous` (2+ Teacher rows OU
//                       `User.centerId` legacy divergent de `Teacher.centerId`)
//
// Aucun `centerId` client (body/query/param/header) n'est jamais accepté
// comme source d'autorité. Le scope est retourné avec l'objet du centre
// nettoyé (pas de champs sensibles). Aucun `findFirst` arbitraire · aucun
// tri implicite · aucune projection large.

import { prisma } from "@/lib/prisma";
import {
  PermissionError,
  resolveCircleActor,
  type CircleActor,
} from "./circle";

export interface CenterActor extends CircleActor {
  centerId: string;
  center: {
    id: string;
    name: string;
    city: string;
    country: string;
    plan: string;
    isVerified: boolean;
    code: string | null;
  };
  /** Rôle applicatif du caller (informatif). */
  actorRole: "CENTER_ADMIN" | "YEMA_ADMIN";
}

/**
 * Résout le centre géré par l'utilisateur authentifié.
 * - 401 anonyme
 * - 403 rôle incorrect
 * - 404 centre absent (ZERO_BINDING) ou centre inactif
 * - 409 binding ambigu (AMBIGUOUS · 2+ Teacher rows OU legacy divergent)
 */
export async function resolveCenterActor(): Promise<CenterActor> {
  const actor = await resolveCircleActor(); // 401 handled here
  const dbUser = await prisma.user.findUnique({
    where: { id: actor.userId },
    select: {
      id: true,
      role: true, // legacy Role enum (CENTER | ADMIN | STUDENT | TEACHER)
      centerId: true, // legacy User.centerId (Student attachment column)
      appRoles: { select: { role: true } },
    },
  });
  if (!dbUser) throw new PermissionError("NOT_FOUND", "user not found");

  const legacyOk = dbUser.role === "CENTER" || dbUser.role === "ADMIN";
  const appRoles = new Set(dbUser.appRoles.map((r) => r.role));
  const v2Ok = appRoles.has("CENTER_ADMIN") || appRoles.has("YEMA_ADMIN");
  if (!legacyOk && !v2Ok) {
    throw new PermissionError("FORBIDDEN", "center admin role required");
  }

  // Requête défensive · take:2 permet de détecter explicitement toute
  // ambigüité (2+ Teacher rows attachés) au lieu de faire confiance au
  // @unique du schéma. Aucun `orderBy` · aucun `findFirst`.
  const teacherRows = await prisma.teacher.findMany({
    where: { userId: dbUser.id },
    take: 2,
    select: {
      id: true,
      centerId: true,
      center: {
        select: {
          id: true,
          name: true,
          city: true,
          country: true,
          plan: true,
          isVerified: true,
          code: true,
        },
      },
    },
  });

  if (teacherRows.length === 0 || !teacherRows[0].centerId || !teacherRows[0].center) {
    throw new PermissionError("NOT_FOUND", "no center membership resolved");
  }
  if (teacherRows.length > 1) {
    throw new PermissionError("CONFLICT", "center scope ambiguous");
  }
  const teacher = teacherRows[0];

  // Ambigüité legacy · `User.centerId` (Student attachment column) divergent
  // du `Teacher.centerId` autoritaire · refuse plutôt que picker au hasard.
  if (dbUser.centerId && dbUser.centerId !== teacher.centerId) {
    throw new PermissionError("CONFLICT", "center scope ambiguous");
  }

  // Centre inactif · convention · plan = "disabled" ou name vide.
  if (!teacher.center!.name || teacher.center!.name.trim() === "") {
    throw new PermissionError("NOT_FOUND", "center inactive");
  }

  return {
    ...actor,
    centerId: teacher.centerId!,
    center: teacher.center!,
    actorRole: appRoles.has("YEMA_ADMIN") ? "YEMA_ADMIN" : "CENTER_ADMIN",
  };
}

/**
 * Version "safe" · retourne `null` au lieu de throw · utile pour les
 * pages qui doivent tolérer l'absence de scope centre.
 */
export async function resolveCenterActorOrNull(): Promise<CenterActor | null> {
  try {
    return await resolveCenterActor();
  } catch {
    return null;
  }
}

export { PermissionError };
