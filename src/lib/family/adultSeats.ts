import "server-only";
import { ProductCode } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// P4.6 Lot 4A → 4B · attribution explicite des sièges adultes Racines.
//
// Doctrine (patch commercial Racines) :
//   ROOTS_FAMILY couvre commercialement 2 adultes maximum + 4 enfants.
//   La simple appartenance à un Household NE SUFFIT PAS à obtenir l'accès
//   adulte. Chaque adulte doit avoir un AccessGrant USER explicite lié à
//   la souscription ROOTS_FAMILY du foyer.
//
// Modélisation (aucune migration, réutilisation stricte du schéma AccessGrant
// existant) :
//   AccessGrant {
//     beneficiaryType: USER
//     beneficiaryId:   <userId de l'adulte>
//     productVariant:  variant de ROOTS_FAMILY
//     sourceType:      SUBSCRIPTION
//     sourceId:        <householdId>  ← lien Household → seat USER
//     status:          ACTIVE | REVOKED
//   }
//
// Compteur adultes attribués actifs pour un Household :
//   COUNT(AccessGrant WHERE productVariant.product.code = ROOTS_FAMILY
//                        AND beneficiaryType = USER
//                        AND sourceType = SUBSCRIPTION
//                        AND sourceId = <householdId>
//                        AND status = ACTIVE)

export const MAX_ADULT_ROOTS_SEATS_PER_HOUSEHOLD = 2;

export type AdultSeatAssignmentError =
  | "household_has_no_family_subscription"
  | "user_is_not_household_member"
  | "user_already_has_seat"
  | "household_seats_exhausted";

export interface AdultSeatSnapshot {
  householdId: string;
  seatsMax: number;
  seatsUsed: number;
  seatsAvailable: number;
  assignedUserIds: string[];
}

async function findHouseholdRootsFamilyVariantId(householdId: string): Promise<string | null> {
  // On récupère le grant HOUSEHOLD ROOTS_FAMILY (souscription du foyer) et
  // on renvoie son productVariantId. Sans ce grant, aucune attribution
  // possible.
  const householdGrant = await prisma.accessGrant.findFirst({
    where: {
      beneficiaryType: "HOUSEHOLD",
      beneficiaryId: householdId,
      status: "ACTIVE",
      productVariant: { product: { code: ProductCode.ROOTS_FAMILY } },
    },
    select: { productVariantId: true },
  });
  return householdGrant?.productVariantId ?? null;
}

async function isActiveHouseholdMember(userId: string, householdId: string): Promise<boolean> {
  const membership = await prisma.householdMembership.findFirst({
    where: { userId, householdId, status: "ACTIVE" },
    select: { id: true },
  });
  return Boolean(membership);
}

export async function countAssignedAdultRootsSeats(householdId: string): Promise<number> {
  return prisma.accessGrant.count({
    where: {
      beneficiaryType: "USER",
      sourceType: "SUBSCRIPTION",
      sourceId: householdId,
      status: "ACTIVE",
      productVariant: { product: { code: ProductCode.ROOTS_FAMILY } },
    },
  });
}

export async function listAssignedAdultRootsSeats(householdId: string): Promise<AdultSeatSnapshot> {
  const rows = await prisma.accessGrant.findMany({
    where: {
      beneficiaryType: "USER",
      sourceType: "SUBSCRIPTION",
      sourceId: householdId,
      status: "ACTIVE",
      productVariant: { product: { code: ProductCode.ROOTS_FAMILY } },
    },
    select: { beneficiaryId: true },
  });
  return {
    householdId,
    seatsMax: MAX_ADULT_ROOTS_SEATS_PER_HOUSEHOLD,
    seatsUsed: rows.length,
    seatsAvailable: Math.max(0, MAX_ADULT_ROOTS_SEATS_PER_HOUSEHOLD - rows.length),
    assignedUserIds: rows.map((r) => r.beneficiaryId),
  };
}

export type AdultSeatAssignmentResult =
  | { ok: true; grantId: string; snapshot: AdultSeatSnapshot }
  | { ok: false; error: AdultSeatAssignmentError; snapshot?: AdultSeatSnapshot };

export async function assignAdultRootsSeat(
  householdId: string,
  userId: string,
): Promise<AdultSeatAssignmentResult> {
  const variantId = await findHouseholdRootsFamilyVariantId(householdId);
  if (!variantId) return { ok: false, error: "household_has_no_family_subscription" };

  const isMember = await isActiveHouseholdMember(userId, householdId);
  if (!isMember) return { ok: false, error: "user_is_not_household_member" };

  const snap = await listAssignedAdultRootsSeats(householdId);
  if (snap.assignedUserIds.includes(userId)) {
    return { ok: false, error: "user_already_has_seat", snapshot: snap };
  }
  if (snap.seatsAvailable <= 0) {
    return { ok: false, error: "household_seats_exhausted", snapshot: snap };
  }

  const grant = await prisma.accessGrant.create({
    data: {
      beneficiaryType: "USER",
      beneficiaryId: userId,
      productVariantId: variantId,
      sourceType: "SUBSCRIPTION",
      sourceId: householdId,
      status: "ACTIVE",
      startsAt: new Date(),
      metadata: { seatType: "ADULT_ROOTS", householdId },
    },
    select: { id: true },
  });

  return { ok: true, grantId: grant.id, snapshot: await listAssignedAdultRootsSeats(householdId) };
}

export type AdultSeatRevocationResult =
  | { ok: true; snapshot: AdultSeatSnapshot }
  | { ok: false; error: "grant_not_found" };

export async function revokeAdultRootsSeat(
  householdId: string,
  userId: string,
): Promise<AdultSeatRevocationResult> {
  const grant = await prisma.accessGrant.findFirst({
    where: {
      beneficiaryType: "USER",
      beneficiaryId: userId,
      sourceType: "SUBSCRIPTION",
      sourceId: householdId,
      status: "ACTIVE",
      productVariant: { product: { code: ProductCode.ROOTS_FAMILY } },
    },
    select: { id: true },
  });
  if (!grant) return { ok: false, error: "grant_not_found" };

  await prisma.accessGrant.update({
    where: { id: grant.id },
    data: { status: "REVOKED" },
  });

  return { ok: true, snapshot: await listAssignedAdultRootsSeats(householdId) };
}
