// AccessGrant issuance boundary.
//
// Production-grade rights are issued from a provenance-specific factory.
// ORDER grants require a paid order backed by an exactly matching confirmed
// payment. Generic grant seeding is test-only; future PROMO/SUBSCRIPTION/
// CENTER_SEAT issuance must get its own audited factory instead of calling
// prisma.accessGrant.create ad hoc.

import { prisma } from "@/lib/prisma";
import type {
  BeneficiaryType,
  GrantSourceType,
  Prisma,
  PrismaClient,
  ProductVariant,
} from "@prisma/client";

type GrantDb = PrismaClient | Prisma.TransactionClient;

/**
 * Creates (or returns) the grant for one confirmed paid OrderItem.
 *
 * Provenance contract:
 * - Order must be PAID.
 * - At least one payment must be CONFIRMED with confirmedAt set.
 * - Confirmed payment currency + amount must exactly match the order.
 * - sourceType/sourceId/orderItemId are derived from the database, never caller input.
 * - Existing grant for the same OrderItem makes this operation idempotent.
 */
export async function grantFromOrderItem(
  orderItemId: string,
  db: GrantDb = prisma,
) {
  const item = await db.orderItem.findUnique({
    where: { id: orderItemId },
    include: {
      productVariant: true,
      order: {
        include: {
          payments: {
            select: {
              status: true,
              confirmedAt: true,
              amount: true,
              currency: true,
            },
          },
        },
      },
      grants: {
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });

  if (!item) throw new Error(`order item ${orderItemId} not found`);
  if (item.order.status !== "PAID") {
    throw new Error(`order ${item.order.id} not paid`);
  }

  const confirmedPayment = item.order.payments.find(
    (payment) =>
      payment.status === "CONFIRMED" &&
      payment.confirmedAt !== null &&
      payment.currency === item.order.currency &&
      payment.amount === item.order.total,
  );
  if (!confirmedPayment) {
    throw new Error(
      `order ${item.order.id} has no exact confirmed payment provenance`,
    );
  }

  const existing = item.grants[0];
  if (existing) return existing;

  const startsAt = new Date();
  const endsAt = item.productVariant.durationDays
    ? new Date(startsAt.getTime() + item.productVariant.durationDays * 86400_000)
    : null;

  return db.accessGrant.create({
    data: {
      beneficiaryType: item.beneficiaryType,
      beneficiaryId: item.beneficiaryId,
      productVariantId: item.productVariantId,
      sourceType: "ORDER",
      sourceId: item.order.id,
      orderItemId: item.id,
      startsAt,
      endsAt,
      status: "ACTIVE",
    },
  });
}

/**
 * Marks ACTIVE grants past endsAt as EXPIRED.
 * Idempotent — safe for cron/read-side maintenance.
 */
export async function expireStaleGrants() {
  const now = new Date();
  return prisma.accessGrant.updateMany({
    where: { status: "ACTIVE", endsAt: { lte: now } },
    data: { status: "EXPIRED" },
  });
}

export type GrantSeed = {
  beneficiaryType: BeneficiaryType;
  beneficiaryId: string;
  productVariant: Pick<ProductVariant, "id" | "durationDays">;
  sourceType: GrantSourceType;
  sourceId: string;
  orderItemId?: string;
  startsAt?: Date;
  endsAt?: Date | null;
};

/**
 * Test-only low-level seed helper.
 *
 * It deliberately cannot issue runtime grants. Production PROMO,
 * SUBSCRIPTION and CENTER_SEAT grants require dedicated audited factories.
 */
export async function createGrant(seed: GrantSeed) {
  if (process.env.NODE_ENV !== "test") {
    throw new Error(
      "createGrant is test-only; use a provenance-specific grant factory",
    );
  }

  const startsAt = seed.startsAt ?? new Date();
  const endsAt =
    seed.endsAt !== undefined
      ? seed.endsAt
      : seed.productVariant.durationDays
        ? new Date(startsAt.getTime() + seed.productVariant.durationDays * 86400_000)
        : null;

  return prisma.accessGrant.create({
    data: {
      beneficiaryType: seed.beneficiaryType,
      beneficiaryId: seed.beneficiaryId,
      productVariantId: seed.productVariant.id,
      sourceType: seed.sourceType,
      sourceId: seed.sourceId,
      orderItemId: seed.orderItemId ?? null,
      startsAt,
      endsAt,
      status: "ACTIVE",
    },
  });
}
