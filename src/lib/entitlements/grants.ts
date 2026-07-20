// Grants factory · un access_grant n'est créé QUE par le système via
// cette fonction, à la confirmation d'un paiement (webhook) ou d'une
// promo auditée. Aucune route admin ne fabrique des grants arbitraires.
//
// L'appel doit se faire dans une transaction avec l'update du paiement
// (confirmedAt) — voir /api/payments/confirm.

import { prisma } from "@/lib/prisma";
import type {
  BeneficiaryType,
  GrantSourceType,
  ProductVariant,
} from "@prisma/client";

/**
 * Crée un access_grant depuis un OrderItem confirmé.
 * ends_at = starts_at + variant.durationDays, ou null si pas de durée.
 * Pour add-ons : ends_at ≤ ends_at du package principal (contrainte
 * appliquée par le caller si connu — non enforcée ici pour rester pur).
 */
export async function grantFromOrderItem(orderItemId: string) {
  const item = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    include: { productVariant: true, order: true },
  });
  if (!item) throw new Error(`order item ${orderItemId} not found`);
  if (item.order.status !== "PAID") throw new Error(`order ${item.order.id} not paid`);

  const startsAt = new Date();
  const endsAt = item.productVariant.durationDays
    ? new Date(startsAt.getTime() + item.productVariant.durationDays * 86400_000)
    : null;

  return prisma.accessGrant.create({
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
 * Marque comme EXPIRED tous les grants dont ends_at est passé.
 * Idempotent — à appeler en cron ou en amont d'une lecture.
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

/** Bas niveau · utilisé par les tests et les promos auditées. */
export async function createGrant(seed: GrantSeed) {
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
