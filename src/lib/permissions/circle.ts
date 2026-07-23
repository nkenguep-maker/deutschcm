// P4.1 · Résolution serveur des permissions Circle.
//
// Aucune fonction ci-dessous ne fait confiance à un `userId` ou un
// `membershipId` reçu du client. La séquence est toujours :
//
//   1. Session Supabase résolue via cookies (`createClient()`).
//   2. `dbUser = prisma.user.findUnique({ supabaseId })` — 401/404.
//   3. Lookup Prisma sur `CircleMembership` avec `AND status = ACTIVE`.
//   4. Retour d'un contrat stable { actor, membership } ou throw typé.
//
// Les erreurs suivent la convention `PermissionError` avec `code`
// stable · `UNAUTHORIZED` 401 · `FORBIDDEN` 403 · `NOT_FOUND` 404.

import type { CircleMembership, CircleRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export class PermissionError extends Error {
  constructor(
    public readonly code: "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND",
    message: string,
  ) {
    super(message);
    this.name = "PermissionError";
  }
}

export interface CircleActor {
  userId: string;
  supabaseId: string;
}

/**
 * Résout l'utilisateur authentifié depuis la session Supabase et map
 * vers la table `users`. Throw PermissionError si absent.
 */
export async function resolveCircleActor(): Promise<CircleActor> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new PermissionError("UNAUTHORIZED", "not signed in");
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true },
  });
  if (!dbUser) throw new PermissionError("NOT_FOUND", "user profile missing");
  return { userId: dbUser.id, supabaseId: user.id };
}

/**
 * Vérifie que l'utilisateur possède une membership ACTIVE sur le cercle.
 * Retourne le row membership complet · throw sinon.
 */
export async function assertCircleMembership(
  circleId: string,
  actor: CircleActor,
): Promise<CircleMembership> {
  const m = await prisma.circleMembership.findFirst({
    where: { circleId, userId: actor.userId, status: "ACTIVE" },
  });
  if (!m) throw new PermissionError("FORBIDDEN", "not a member of circle");
  return m;
}

/** OWNER · seul autorisé aux actions structurelles (créer/inviter/retirer). */
export async function assertCircleOwner(
  circleId: string,
  actor: CircleActor,
): Promise<CircleMembership> {
  const m = await assertCircleMembership(circleId, actor);
  if (m.role !== "OWNER") throw new PermissionError("FORBIDDEN", "owner required");
  return m;
}

/** ADULT ou OWNER · lecture élargie + accompagnement enfant (Q1). */
export async function assertCircleAdult(
  circleId: string,
  actor: CircleActor,
): Promise<CircleMembership> {
  const m = await assertCircleMembership(circleId, actor);
  if (m.role !== "OWNER" && m.role !== "ADULT") {
    throw new PermissionError("FORBIDDEN", "adult required");
  }
  return m;
}

/** COACH · lecture + feedback uniquement dans son cercle assigné. */
export async function assertCircleCoach(
  circleId: string,
  actor: CircleActor,
): Promise<CircleMembership> {
  const m = await prisma.circleMembership.findFirst({
    where: { circleId, userId: actor.userId, role: "COACH", status: "ACTIVE" },
  });
  if (!m) throw new PermissionError("FORBIDDEN", "coach not assigned to circle");
  return m;
}

/**
 * Vérifie qu'un adulte peut voir un enfant · uniquement si l'enfant est
 * dans un cercle où l'adulte est membre actif, OU si l'utilisateur est
 * le parent direct.
 */
export async function assertCircleChildAccess(
  childProfileId: string,
  actor: CircleActor,
): Promise<void> {
  const child = await prisma.childProfile.findUnique({
    where: { id: childProfileId },
    select: { id: true, parentUserId: true },
  });
  if (!child) throw new PermissionError("NOT_FOUND", "child not found");
  if (child.parentUserId === actor.userId) return;
  const shared = await prisma.circleMembership.findFirst({
    where: {
      childProfileId,
      status: "ACTIVE",
      circle: {
        memberships: {
          some: { userId: actor.userId, status: "ACTIVE" },
        },
      },
    },
  });
  if (!shared) throw new PermissionError("FORBIDDEN", "child not in shared circle");
}

/** Household ownership · owner strict (jamais adulte invité). */
export async function assertHouseholdOwnership(
  householdId: string,
  actor: CircleActor,
): Promise<void> {
  const h = await prisma.household.findUnique({
    where: { id: householdId },
    select: { ownerUserId: true },
  });
  if (!h) throw new PermissionError("NOT_FOUND", "household not found");
  if (h.ownerUserId !== actor.userId) {
    throw new PermissionError("FORBIDDEN", "household owner required");
  }
}

/** Rôle Circle courant côté client · lecture-only. */
export function circleRoleAllows(
  role: CircleRole | null,
  needed: readonly CircleRole[],
): boolean {
  return role !== null && needed.includes(role);
}
