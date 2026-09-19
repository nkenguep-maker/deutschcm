import "server-only";

// AccessGrant issuance boundary.
//
// Production-grade rights are issued from a provenance-specific factory.
// ORDER grants require a paid order backed by an exactly matching confirmed
// payment. Generic grant seeding is test-only; future PROMO/SUBSCRIPTION/
// CENTER_SEAT issuance must get its own audited factory instead of calling
// prisma.accessGrant.create ad hoc.

import { prisma } from "@/lib/prisma";
import { isInternalTestEnvironment } from "@/lib/internalTestEnvironment";
import type {
  BeneficiaryType,
  GrantSourceType,
  Prisma,
  ProductVariant,
} from "@prisma/client";

type GrantDb = Prisma.TransactionClient;

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
 * Issues one explicit adult ROOTS_FAMILY seat from an already active household
 * ROOTS_FAMILY grant. The household entitlement is re-checked here so a
 * caller cannot mint a seat from only a variant id.
 */
export async function grantAdultRootsSeatFromHouseholdGrant(params: {
  householdId: string;
  userId: string;
  productVariantId: string;
}) {
  const now = new Date();
  const backingGrant = await prisma.accessGrant.findFirst({
    where: {
      beneficiaryType: "HOUSEHOLD",
      beneficiaryId: params.householdId,
      productVariantId: params.productVariantId,
      status: "ACTIVE",
      startsAt: { lte: now },
      OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      productVariant: { product: { code: "ROOTS_FAMILY" } },
    },
    select: { id: true },
  });
  if (!backingGrant) {
    throw new Error("active household ROOTS_FAMILY grant required");
  }

  return prisma.accessGrant.create({
    data: {
      beneficiaryType: "USER",
      beneficiaryId: params.userId,
      productVariantId: params.productVariantId,
      sourceType: "SUBSCRIPTION",
      sourceId: params.householdId,
      status: "ACTIVE",
      startsAt: now,
      metadata: {
        seatType: "ADULT_ROOTS",
        householdId: params.householdId,
        backingGrantId: backingGrant.id,
      },
    },
    select: { id: true },
  });
}

/**
 * P-1-only promo fixture factory. Runtime fixture provisioning must pass the
 * same canonical P-1 environment gate as the internal testing console.
 */
export async function upsertInternalTestPromoGrant(params: {
  householdId: string;
  productVariantId: string;
  sourceId: string;
}) {
  if (!isInternalTestEnvironment()) {
    throw new Error("internal test promo grants are P-1-only");
  }
  if (!params.sourceId.startsWith("internal-test:")) {
    throw new Error("internal test promo source must use internal-test: prefix");
  }

  const existing = await prisma.accessGrant.findFirst({
    where: {
      beneficiaryType: "HOUSEHOLD",
      beneficiaryId: params.householdId,
      productVariantId: params.productVariantId,
      sourceType: "PROMO",
      sourceId: params.sourceId,
    },
  });
  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + 365 * 24 * 60 * 60 * 1000);

  if (existing) {
    return prisma.accessGrant.update({
      where: { id: existing.id },
      data: { status: "ACTIVE", startsAt, endsAt },
    });
  }

  return prisma.accessGrant.create({
    data: {
      beneficiaryType: "HOUSEHOLD",
      beneficiaryId: params.householdId,
      productVariantId: params.productVariantId,
      sourceType: "PROMO",
      sourceId: params.sourceId,
      startsAt,
      endsAt,
      status: "ACTIVE",
      metadata: { internalTest: true },
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
