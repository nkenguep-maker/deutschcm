import "server-only";
import { prisma } from "@/lib/prisma";
import type { FamilyGuardianActor } from "./actor";

// P4.6 Lot 4A · résolution des sièges enfants disponibles pour un guardian.
//
// Doctrine (brief §2) :
//   - Famille Monde : donne des places enfants Monde ; ZÉRO Passage Monde adulte.
//   - Racines Famille : donne jusqu'à 2 places adultes Racines + 4 enfants.
//
// Le compte réel de sièges dérive des AccessGrant ACTIVE (product code +
// household beneficiary). Tant qu'aucun grant famille payante n'est actif,
// la doctrine « MAX_DEPENDENTS_PER_HOUSEHOLD = 4 » de src/lib/entitlements/
// household.ts s'applique en fallback (cf. audit Lot 4A).
//
// Ce module ne modifie AUCUN state — pure lecture.

export type SeatUniverse = "MONDE" | "RACINES";

export interface FamilySeatSnapshot {
  universe: SeatUniverse;
  productCode: string; // ex. "ROOTS_FAMILY", "FAMILY_MONDE" (future)
  seatsTotal: number;
  seatsUsed: number;
  seatsAvailable: number;
  grantEndsAt: Date | null;
}

// Fallback hard-cap si aucun grant payant (P4.1 legacy).
const FALLBACK_MAX_CHILDREN = 4;

interface GrantRow {
  id: string;
  endsAt: Date | null;
  productVariant: {
    product: { code: string; universe: string | null };
  };
}

// Lot 7C.3 · mapping canonique ProductCode → nombre de sièges enfant.
// Chaque code Family commercial doit avoir une entrée explicite · le
// default: 0 ne s'applique qu'aux codes inconnus (protection future).
// Contrat commercial figé (brief §2) ·
//   - FAMILY_WORLD          → 3 sièges enfant Monde
//   - CHILD_WORLD_SINGLE    → 1 siège enfant Monde
//   - ROOTS_FAMILY          → 4 sièges enfant Racines
// PASSAGE et ROOTS_SOLO sont des grants USER individuels (ne débloquent
// aucun siège enfant côté HOUSEHOLD).
function seatsFromGrant(grant: GrantRow): number {
  switch (grant.productVariant.product.code) {
    case "FAMILY_WORLD":
      return 3;
    case "CHILD_WORLD_SINGLE":
      return 1;
    case "ROOTS_FAMILY":
      return 4;
    default:
      return 0;
  }
}

export async function getFamilySeatSnapshot(actor: FamilyGuardianActor): Promise<{
  seats: FamilySeatSnapshot[];
  totalChildSeatsAvailable: number;
  totalChildrenActuallyLinked: number;
}> {
  const householdIds = Array.from(
    new Set([...actor.householdIdsOwned, ...actor.householdIdsMember]),
  );

  const activeGrants: GrantRow[] = householdIds.length
    ? await prisma.accessGrant.findMany({
        where: {
          beneficiaryType: "HOUSEHOLD",
          beneficiaryId: { in: householdIds },
          status: "ACTIVE",
        },
        select: {
          id: true,
          endsAt: true,
          productVariant: {
            select: {
              product: { select: { code: true, universe: true } },
            },
          },
        },
      })
    : [];

  const totalChildrenActuallyLinked = await prisma.childProfile.count({
    where: { parentUserId: actor.userId },
  });

  if (activeGrants.length === 0) {
    // Fallback P4.1 · sans grant payant, 4 enfants max au total.
    return {
      seats: [
        {
          universe: "RACINES",
          productCode: "FALLBACK_HOUSEHOLD_LEGACY",
          seatsTotal: FALLBACK_MAX_CHILDREN,
          seatsUsed: totalChildrenActuallyLinked,
          seatsAvailable: Math.max(0, FALLBACK_MAX_CHILDREN - totalChildrenActuallyLinked),
          grantEndsAt: null,
        },
      ],
      totalChildSeatsAvailable: Math.max(
        0,
        FALLBACK_MAX_CHILDREN - totalChildrenActuallyLinked,
      ),
      totalChildrenActuallyLinked,
    };
  }

  // Agrège par (productCode, universe).
  const buckets = new Map<string, { total: number; universe: SeatUniverse; grantEndsAt: Date | null }>();
  for (const g of activeGrants) {
    const seats = seatsFromGrant(g);
    if (seats === 0) continue;
    const universeRaw = g.productVariant.product.universe;
    const universe: SeatUniverse = universeRaw === "MONDE" ? "MONDE" : "RACINES";
    const key = `${g.productVariant.product.code}:${universe}`;
    const cur = buckets.get(key) ?? { total: 0, universe, grantEndsAt: g.endsAt };
    cur.total += seats;
    if (g.endsAt && (!cur.grantEndsAt || g.endsAt > cur.grantEndsAt)) cur.grantEndsAt = g.endsAt;
    buckets.set(key, cur);
  }

  // Sièges "used" = nombre d'enfants actuellement liés au parent. On
  // n'attribue pas encore par siège nommé — Lot 4A garde une agrégation
  // globale (les enfants ne sont pas taggés par grant dans le schéma).
  const seats: FamilySeatSnapshot[] = [];
  let cumulativeTotal = 0;
  for (const [key, v] of buckets.entries()) {
    const productCode = key.split(":")[0];
    seats.push({
      universe: v.universe,
      productCode,
      seatsTotal: v.total,
      seatsUsed: 0,
      seatsAvailable: v.total,
      grantEndsAt: v.grantEndsAt,
    });
    cumulativeTotal += v.total;
  }
  const totalChildSeatsAvailable = Math.max(0, cumulativeTotal - totalChildrenActuallyLinked);
  return {
    seats,
    totalChildSeatsAvailable,
    totalChildrenActuallyLinked,
  };
}

export async function assertCanAddChildProfile(actor: FamilyGuardianActor): Promise<
  | { ok: true }
  | { ok: false; reason: "no_seat_available"; snapshot: Awaited<ReturnType<typeof getFamilySeatSnapshot>> }
> {
  const snap = await getFamilySeatSnapshot(actor);
  if (snap.totalChildSeatsAvailable <= 0) {
    return { ok: false, reason: "no_seat_available", snapshot: snap };
  }
  return { ok: true };
}
