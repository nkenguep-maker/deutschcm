// P4.1 · Gardes de capacité Circle · réutilisables sous transaction.
//
// Doctrine · YEMA_P4_ARCHITECTURE_AUDIT.md §6 · YEMA_P3_CIRCLE_DECISION.md §RECOMMANDÉES.
//
// Toutes les fonctions ci-dessous doivent être appelées dans une transaction
// avec verrou pour éviter les race conditions (deux `POST` simultanés qui
// insèrent le 5ᵉ enfant ou le 3ᵉ adulte). Le contrat concret P4.2 est ·
//
//   await prisma.$transaction(async (tx) => {
//     await assertCircleAdultCapacity(tx, circleId);
//     await tx.circleMembership.create({ ... });
//   }, { isolationLevel: "Serializable" });
//
// En mode Serializable, PostgreSQL sérialise les transactions concurrentes ·
// une des deux échoue avec `40001 serialization_failure` et est ré-essayée
// applicative-side (retry idempotent). Les erreurs métier restent stables ·
//
//   max_adults_reached         · 2 adultes maximum par cercle
//   max_children_reached       · 4 enfants maximum par cercle
//   coach_already_assigned     · 1 coach ACTIVE maximum par cercle
//   circle_language_already_active · 1 cercle actif par (foyer, langue)

import type { PrismaClient } from "@prisma/client";

type TxClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

export class CapacityError extends Error {
  constructor(
    public readonly code:
      | "max_adults_reached"
      | "max_children_reached"
      | "coach_already_assigned"
      | "coach_capacity_reached"
      | "circle_language_already_active",
    message: string,
    public readonly detail?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "CapacityError";
  }
}

export const MAX_ADULTS_PER_CIRCLE = 2;
export const MAX_CHILDREN_PER_CIRCLE = 4;
// P4.2 · Q15 · capacité coach initiale (20 profils enfants actifs, 10 Circles).
export const MAX_ACTIVE_CIRCLES_PER_COACH = 10;
export const MAX_ACTIVE_CHILDREN_PER_COACH = 20;

/** Vérifie qu'on peut ajouter un adulte (OWNER ou ADULT ACTIVE). */
export async function assertCircleAdultCapacity(
  tx: TxClient,
  circleId: string,
): Promise<void> {
  const count = await tx.circleMembership.count({
    where: {
      circleId,
      status: "ACTIVE",
      role: { in: ["OWNER", "ADULT"] },
    },
  });
  if (count >= MAX_ADULTS_PER_CIRCLE) {
    throw new CapacityError("max_adults_reached", "adult capacity reached", {
      limit: MAX_ADULTS_PER_CIRCLE,
      current: count,
    });
  }
}

/** Vérifie qu'on peut ajouter un enfant (CHILD ACTIVE). */
export async function assertCircleChildCapacity(
  tx: TxClient,
  circleId: string,
): Promise<void> {
  const count = await tx.circleMembership.count({
    where: { circleId, status: "ACTIVE", role: "CHILD" },
  });
  if (count >= MAX_CHILDREN_PER_CIRCLE) {
    throw new CapacityError("max_children_reached", "child capacity reached", {
      limit: MAX_CHILDREN_PER_CIRCLE,
      current: count,
    });
  }
}

/** Vérifie qu'aucun COACH ACTIVE n'est déjà assigné au cercle. */
export async function assertCircleCoachCapacity(
  tx: TxClient,
  circleId: string,
): Promise<void> {
  const existing = await tx.circleMembership.findFirst({
    where: { circleId, status: "ACTIVE", role: "COACH" },
    select: { id: true },
  });
  if (existing) {
    throw new CapacityError("coach_already_assigned", "circle already has a coach", {
      existingMembershipId: existing.id,
    });
  }
}

/** Vérifie qu'aucun Circle ACTIVE n'existe déjà pour (foyer, langue). */
export async function assertUniqueActiveHouseholdLanguageCircle(
  tx: TxClient,
  householdId: string,
  language: string,
): Promise<void> {
  const existing = await tx.circle.findFirst({
    where: {
      householdId,
      language: language as never,
      status: "ACTIVE",
    },
    select: { id: true },
  });
  if (existing) {
    throw new CapacityError(
      "circle_language_already_active",
      "an active circle already exists for this household and language",
      { existingCircleId: existing.id },
    );
  }
}

/**
 * P4.2 · Vérifie qu'assigner ce coach à un Circle supplémentaire n'excède
 * pas MAX_ACTIVE_CIRCLES_PER_COACH (10) et que le total d'enfants dans
 * ses cercles reste ≤ MAX_ACTIVE_CHILDREN_PER_COACH (20).
 * À appeler dans la même transaction que la création du membership COACH.
 */
export async function assertCoachCapacityAvailable(
  tx: TxClient,
  coachUserId: string,
  additionalCircleId: string,
): Promise<void> {
  const activeCircles = await tx.circleMembership.findMany({
    where: { userId: coachUserId, role: "COACH", status: "ACTIVE" },
    select: { circleId: true },
  });
  if (activeCircles.length >= MAX_ACTIVE_CIRCLES_PER_COACH) {
    throw new CapacityError("coach_capacity_reached", "coach circle capacity reached", {
      dimension: "circles",
      limit: MAX_ACTIVE_CIRCLES_PER_COACH,
      current: activeCircles.length,
    });
  }
  const circleIds = [...activeCircles.map((c) => c.circleId), additionalCircleId];
  const activeChildren = await tx.circleMembership.count({
    where: {
      circleId: { in: circleIds },
      role: "CHILD",
      status: "ACTIVE",
    },
  });
  if (activeChildren > MAX_ACTIVE_CHILDREN_PER_COACH) {
    throw new CapacityError("coach_capacity_reached", "coach children capacity reached", {
      dimension: "children",
      limit: MAX_ACTIVE_CHILDREN_PER_COACH,
      current: activeChildren,
    });
  }
}
