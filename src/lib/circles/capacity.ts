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
