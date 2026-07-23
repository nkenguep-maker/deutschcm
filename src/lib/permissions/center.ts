// P4.3a · Résolution serveur "centre courant" pour l'utilisateur authentifié.
//
// Source de vérité · `User.role = "CENTER" | "ADMIN"` (rôle applicatif legacy
// V1 · voir schema.prisma enum Role) OU `UserAppRole.role = "CENTER_ADMIN"
// | "YEMA_ADMIN"` (V2). Le centre est résolu via `User.teacher.centerId`
// (relation persistée `Teacher` → `LanguageCenter`).
//
// Aucun `centerId` client (body/query/param/header) n'est jamais accepté
// comme source d'autorité. Le scope est retourné avec l'objet du centre
// nettoyé (pas de champs sensibles).

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
 * - 404 centre absent ou membership Teacher inexistante
 * - 404 centre inactif (plan = "disabled" / center supprimé)
 */
export async function resolveCenterActor(): Promise<CenterActor> {
  const actor = await resolveCircleActor(); // 401 handled here
  const dbUser = await prisma.user.findUnique({
    where: { id: actor.userId },
    select: {
      id: true,
      role: true, // legacy Role enum (CENTER | ADMIN | STUDENT | TEACHER)
      appRoles: { select: { role: true } },
      teacher: {
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
      },
    },
  });
  if (!dbUser) throw new PermissionError("NOT_FOUND", "user not found");

  const legacyOk = dbUser.role === "CENTER" || dbUser.role === "ADMIN";
  const appRoles = new Set(dbUser.appRoles.map((r) => r.role));
  const v2Ok = appRoles.has("CENTER_ADMIN") || appRoles.has("YEMA_ADMIN");
  if (!legacyOk && !v2Ok) {
    throw new PermissionError("FORBIDDEN", "center admin role required");
  }

  const teacher = dbUser.teacher;
  if (!teacher || !teacher.centerId || !teacher.center) {
    throw new PermissionError("NOT_FOUND", "no center membership resolved");
  }

  // Centre inactif · convention · plan = "disabled" ou name vide.
  if (!teacher.center.name || teacher.center.name.trim() === "") {
    throw new PermissionError("NOT_FOUND", "center inactive");
  }

  return {
    ...actor,
    centerId: teacher.centerId,
    center: teacher.center,
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
