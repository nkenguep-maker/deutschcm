// P4.2 · Services membership Circle · enfant, adulte leave/remove, coach.
//
// Tous les changements passent par des transactions Serializable et émettent
// un AuditEvent dans la même transaction. Le profil actif enfant est
// nettoyé côté user_metadata au niveau route quand un enfant est retiré.
//
// P4.4 · émissions Coach Racines · ROOTS_COACH_CAPACITY_REACHED sur capacité
// atteinte pendant `assignCoach` (Q15) · ROOTS_COACH_ASSIGNMENT_REVOKED sur
// `removeCoach` avant commit (Q10 · révocation immédiate). Fire-and-forget
// après commit tx pour éviter de bloquer la réponse. Metadata sanitizée en
// défense (aucun email/nom/téléphone/DOB).

import type { PrismaClient } from "@prisma/client";
import {
  CapacityError,
  assertCircleChildCapacity,
  assertCircleCoachCapacity,
  assertCoachCapacityAvailable,
  assertCoachProfileCapacityForChildAdd,
} from "@/lib/circles/capacity";
import { acquireCircleLock } from "@/lib/db/locks";
import { writeAuditEvent } from "@/lib/audit/events";

type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export class MembershipError extends Error {
  constructor(
    public readonly code:
      | "forbidden"
      | "circle_not_found"
      | "circle_archived"
      | "child_not_in_household"
      | "child_membership_removed"
      | "membership_not_found"
      | "membership_already_active"
      | "owner_cannot_leave"
      | "coach_already_assigned",
    message: string,
    public readonly detail?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "MembershipError";
  }
}

/** OWNER ajoute un ChildProfile à son Circle. Cap 4 enfants + dédup. */
export async function addChildToCircle(
  tx: TxClient,
  input: { circleId: string; ownerUserId: string; childProfileId: string },
): Promise<{ id: string }> {
  const circle = await tx.circle.findUnique({
    where: { id: input.circleId },
    select: { id: true, status: true, householdId: true },
  });
  if (!circle) throw new MembershipError("circle_not_found", "circle not found");
  if (circle.status !== "ACTIVE") {
    throw new MembershipError("circle_archived", "circle not active");
  }
  const owner = await tx.circleMembership.findFirst({
    where: {
      circleId: input.circleId,
      userId: input.ownerUserId,
      role: "OWNER",
      status: "ACTIVE",
    },
    select: { id: true },
  });
  if (!owner) throw new MembershipError("forbidden", "owner membership required");

  // Le child doit appartenir au foyer OU au parent authentifié.
  const child = await tx.childProfile.findUnique({
    where: { id: input.childProfileId },
    select: { id: true, parentUserId: true, householdId: true },
  });
  if (!child) throw new MembershipError("child_not_in_household", "child not found");
  const belongsToHousehold =
    child.householdId === circle.householdId ||
    child.parentUserId === input.ownerUserId;
  if (!belongsToHousehold) {
    throw new MembershipError("child_not_in_household", "child not in household");
  }

  await acquireCircleLock(tx, input.circleId);
  await assertCircleChildCapacity(tx, input.circleId);
  // P4.4 hardening · si le Circle a un COACH ACTIVE, garantir que ce coach
  // ne dépasse pas son budget profil (20). Sinon `coach_profile_capacity_reached`
  // → 409 mappé côté API, aucun leak de code Prisma.
  try {
    await assertCoachProfileCapacityForChildAdd(tx, input.circleId);
  } catch (e) {
    if (e instanceof CapacityError && e.code === "coach_profile_capacity_reached") {
      const limit = (e.detail?.limit as number | undefined) ?? null;
      const current = (e.detail?.current as number | undefined) ?? null;
      const coachUserId = (e.detail?.coachUserId as string | undefined) ?? "unknown";
      void writeAuditEvent({
        actorUserId: input.ownerUserId,
        actorRole: "PARENT",
        action: "ROOTS_COACH_CAPACITY_REACHED",
        targetType: "RootsCoachAssignment",
        targetId: coachUserId,
        scopeType: "Circle",
        scopeId: input.circleId,
        metadata: {
          reasonCode: "capacity_reached",
          capacityType: "children",
          limit,
          current,
          routeAction: "addChildToCircle",
        },
      }).catch((err) => {
        console.warn("[audit] ROOTS_COACH_CAPACITY_REACHED write failed:", (err as Error).message);
      });
    }
    throw e;
  }

  // Dédup · pas de duplicate ACTIVE membership pour ce child.
  const existing = await tx.circleMembership.findFirst({
    where: {
      circleId: input.circleId,
      childProfileId: input.childProfileId,
      status: "ACTIVE",
    },
    select: { id: true },
  });
  if (existing) {
    throw new MembershipError("membership_already_active", "child already in circle");
  }

  const membership = await tx.circleMembership.create({
    data: {
      circleId: input.circleId,
      role: "CHILD",
      status: "ACTIVE",
      childProfileId: input.childProfileId,
      invitedByUserId: input.ownerUserId,
      joinedAt: new Date(),
    },
    select: { id: true },
  });
  return membership;
}

/** OWNER retire un ChildProfile de son Circle · soft-delete (REMOVED). */
export async function removeChildFromCircle(
  tx: TxClient,
  input: { circleId: string; ownerUserId: string; childProfileId: string },
): Promise<{ removedMembershipId: string }> {
  const owner = await tx.circleMembership.findFirst({
    where: {
      circleId: input.circleId,
      userId: input.ownerUserId,
      role: "OWNER",
      status: "ACTIVE",
    },
    select: { id: true },
  });
  if (!owner) throw new MembershipError("forbidden", "owner membership required");
  const membership = await tx.circleMembership.findFirst({
    where: {
      circleId: input.circleId,
      childProfileId: input.childProfileId,
      status: "ACTIVE",
    },
    select: { id: true },
  });
  if (!membership) throw new MembershipError("membership_not_found", "no active child membership");
  await tx.circleMembership.update({
    where: { id: membership.id },
    data: { status: "REMOVED", removedAt: new Date() },
  });
  return { removedMembershipId: membership.id };
}

/** Un ADULT (non OWNER) quitte volontairement le cercle. */
export async function adultLeaveCircle(
  tx: TxClient,
  input: { circleId: string; actorUserId: string },
): Promise<{ removedMembershipId: string }> {
  const membership = await tx.circleMembership.findFirst({
    where: {
      circleId: input.circleId,
      userId: input.actorUserId,
      status: "ACTIVE",
    },
    select: { id: true, role: true },
  });
  if (!membership) throw new MembershipError("membership_not_found", "not a member");
  if (membership.role === "OWNER") {
    throw new MembershipError("owner_cannot_leave", "owner cannot leave own circle");
  }
  await tx.circleMembership.update({
    where: { id: membership.id },
    data: { status: "REMOVED", removedAt: new Date() },
  });
  return { removedMembershipId: membership.id };
}

/** OWNER retire un autre adulte (ADULT). Ne peut jamais retirer un OWNER. */
export async function ownerRemoveAdult(
  tx: TxClient,
  input: { circleId: string; ownerUserId: string; targetMembershipId: string },
): Promise<{ removedMembershipId: string; removedUserId: string | null }> {
  const owner = await tx.circleMembership.findFirst({
    where: {
      circleId: input.circleId,
      userId: input.ownerUserId,
      role: "OWNER",
      status: "ACTIVE",
    },
    select: { id: true },
  });
  if (!owner) throw new MembershipError("forbidden", "owner membership required");
  const target = await tx.circleMembership.findFirst({
    where: {
      id: input.targetMembershipId,
      circleId: input.circleId,
      status: "ACTIVE",
    },
    select: { id: true, role: true, userId: true },
  });
  if (!target) throw new MembershipError("membership_not_found", "target membership not found");
  if (target.role === "OWNER") {
    throw new MembershipError("forbidden", "cannot remove owner");
  }
  if (target.role !== "ADULT") {
    throw new MembershipError("forbidden", "only ADULT can be removed by owner via this route");
  }
  await tx.circleMembership.update({
    where: { id: target.id },
    data: { status: "REMOVED", removedAt: new Date() },
  });
  return { removedMembershipId: target.id, removedUserId: target.userId ?? null };
}

/** ADMIN assigne un coach au Circle · vérifie capacité coach Q15. */
export async function assignCoach(
  tx: TxClient,
  input: { circleId: string; coachUserId: string; adminUserId: string },
): Promise<{ id: string }> {
  const circle = await tx.circle.findUnique({
    where: { id: input.circleId },
    select: { status: true },
  });
  if (!circle) throw new MembershipError("circle_not_found", "circle not found");
  if (circle.status !== "ACTIVE") {
    throw new MembershipError("circle_archived", "cannot assign coach to inactive circle");
  }
  // Vérifie que le coach porte le AppRole RACINES_COACH.
  const coachRole = await tx.userAppRole.findFirst({
    where: { userId: input.coachUserId, role: "RACINES_COACH" },
    select: { id: true },
  });
  if (!coachRole) {
    throw new MembershipError("forbidden", "target user is not a RACINES_COACH");
  }
  await acquireCircleLock(tx, input.circleId);
  // 1 seul coach ACTIVE par cercle.
  await assertCircleCoachCapacity(tx, input.circleId);
  // 20 profils + 10 Circles max par coach.
  // P4.4 hardening · encapsule pour émettre ROOTS_COACH_CAPACITY_REACHED sur
  // capacité atteinte (dimension = "circles" ou "children"), tout en
  // laissant remonter l'erreur pour rollback tx.
  try {
    await assertCoachCapacityAvailable(tx, input.coachUserId, input.circleId);
  } catch (e) {
    if (
      e instanceof CapacityError &&
      (e.code === "coach_circle_capacity_reached" ||
        e.code === "coach_profile_capacity_reached")
    ) {
      const dim = (e.detail?.dimension as string | undefined) ?? null;
      const limit = (e.detail?.limit as number | undefined) ?? null;
      const current = (e.detail?.current as number | undefined) ?? null;
      // Fire-and-forget · hors tx. Pattern doctrine cohérent avec Teacher.
      void writeAuditEvent({
        actorUserId: input.adminUserId,
        actorRole: "YEMA_ADMIN",
        action: "ROOTS_COACH_CAPACITY_REACHED",
        targetType: "RootsCoachAssignment",
        targetId: input.coachUserId,
        scopeType: "Circle",
        scopeId: input.circleId,
        metadata: {
          reasonCode: "capacity_reached",
          capacityType: dim,
          limit,
          current,
          routeAction: "assignCoach",
        },
      }).catch((err) => {
        console.warn("[audit] ROOTS_COACH_CAPACITY_REACHED write failed:", (err as Error).message);
      });
    }
    throw e;
  }

  const membership = await tx.circleMembership.create({
    data: {
      circleId: input.circleId,
      role: "COACH",
      status: "ACTIVE",
      userId: input.coachUserId,
      invitedByUserId: input.adminUserId,
      joinedAt: new Date(),
    },
    select: { id: true },
  });
  return { id: membership.id };
}

/** ADMIN retire le coach · ancien coach perd l'accès immédiatement (Q10). */
export async function removeCoach(
  tx: TxClient,
  input: { circleId: string; adminUserId?: string; reason?: string },
): Promise<{ removedMembershipId: string | null; previousCoachUserId: string | null }> {
  const membership = await tx.circleMembership.findFirst({
    where: { circleId: input.circleId, role: "COACH", status: "ACTIVE" },
    select: { id: true, userId: true },
  });
  if (!membership) return { removedMembershipId: null, previousCoachUserId: null };
  await tx.circleMembership.update({
    where: { id: membership.id },
    data: { status: "REMOVED", removedAt: new Date() },
  });
  // P4.4 hardening · émet ROOTS_COACH_ASSIGNMENT_REVOKED (Q10). Fire-and-forget
  // pour ne pas polluer la tx d'assignation. Doctrine · ne pas conserver
  // d'infos privées inutiles pour le nouveau coach.
  void writeAuditEvent({
    actorUserId: input.adminUserId ?? null,
    actorRole: input.adminUserId ? "YEMA_ADMIN" : null,
    action: "ROOTS_COACH_ASSIGNMENT_REVOKED",
    targetType: "CircleMembership",
    targetId: membership.id,
    scopeType: "Circle",
    scopeId: input.circleId,
    metadata: {
      previousCoachUserId: membership.userId,
      reasonCode: input.reason ?? "removed",
      routeAction: "removeCoach",
    },
  }).catch((err) => {
    console.warn("[audit] ROOTS_COACH_ASSIGNMENT_REVOKED write failed:", (err as Error).message);
  });
  return { removedMembershipId: membership.id, previousCoachUserId: membership.userId };
}

export { CapacityError };
