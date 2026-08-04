import "server-only";
import { prisma } from "@/lib/prisma";
import type { FamilyGuardianActor } from "./actor";

// Lot 7C.4 · sièges Family PAR UNIVERS · cross-subsidy impossible.
//
// Doctrine brief §2 (figée) ·
//   - FAMILY_WORLD          → 3 sièges enfant Monde, 0 Racines, 0 adulte
//   - CHILD_WORLD_SINGLE    → 1 siège enfant Monde,  0 Racines, 0 adulte
//   - ROOTS_FAMILY          → 0 Monde, 4 sièges enfant Racines, 2 adultes Racines
//   - PASSAGE / ROOTS_SOLO  → grants USER individuels · aucun pool Family
//
// Universe stocké EXPLICITEMENT sur ChildProfile.universe · JAMAIS déduit
// depuis langue / learningGoal / entitlement / parent / nom.

export type SeatUniverse = "MONDE" | "RACINES";

/**
 * Capacité structurée par univers · un simple nombre global est insuffisant
 * (un Household FAMILY_WORLD+ROOTS_FAMILY ne doit pas devenir un pool
 * indistinct de 7 enfants · les 3 sièges Monde restent réservés aux Monde,
 * les 4 Racines aux Racines).
 */
export interface FamilySeatCapacity {
  mondeChildren: number;
  racinesChildren: number;
  rootsAdults: number;
}

const ZERO: FamilySeatCapacity = { mondeChildren: 0, racinesChildren: 0, rootsAdults: 0 };

/**
 * Mapping canonique ProductCode → capacité par univers.
 * Fail-closed sur code inconnu (default retourne ZERO). Toute évolution
 * commerciale doit ajouter un case explicite ici.
 */
export function capacityFromProduct(code: string): FamilySeatCapacity {
  switch (code) {
    case "FAMILY_WORLD":
      return { mondeChildren: 3, racinesChildren: 0, rootsAdults: 0 };
    case "CHILD_WORLD_SINGLE":
      return { mondeChildren: 1, racinesChildren: 0, rootsAdults: 0 };
    case "ROOTS_FAMILY":
      return { mondeChildren: 0, racinesChildren: 4, rootsAdults: 2 };
    default:
      return ZERO;
  }
}

// Fallback P4.1 legacy · un Household sans grant Family reçoit un pool
// Racines uniquement (4 enfants max) pour préserver le comportement
// historique. Aucun siège Monde par défaut · Monde exige un grant explicite.
const FALLBACK_MAX_RACINES_CHILDREN = 4;

export interface FamilySeatSnapshot {
  universe: SeatUniverse;
  productCode: string;
  seatsTotal: number;
  seatsUsed: number;
  seatsAvailable: number;
  grantEndsAt: Date | null;
}

interface GrantRow {
  id: string;
  endsAt: Date | null;
  productVariant: {
    product: { code: string; universe: string | null };
  };
}

function addCapacity(a: FamilySeatCapacity, b: FamilySeatCapacity): FamilySeatCapacity {
  return {
    mondeChildren: a.mondeChildren + b.mondeChildren,
    racinesChildren: a.racinesChildren + b.racinesChildren,
    rootsAdults: a.rootsAdults + b.rootsAdults,
  };
}

export interface FamilySeatSnapshotResult {
  // Ancienne API préservée pour compat UI.
  seats: FamilySeatSnapshot[];
  totalChildSeatsAvailable: number;
  totalChildrenActuallyLinked: number;
  // Lot 7C.4 · nouvelle API structurée par univers.
  capacity: FamilySeatCapacity;
  used: FamilySeatCapacity;
  remaining: FamilySeatCapacity;
}

export async function getFamilySeatSnapshot(actor: FamilyGuardianActor): Promise<FamilySeatSnapshotResult> {
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
            select: { product: { select: { code: true, universe: true } } },
          },
        },
      })
    : [];

  // Comptage EXPLICITE par universe · un ChildProfile.universe=null ne
  // compte dans AUCUN pool (fail-closed).
  const [mondeUsed, racinesUsed, totalChildrenActuallyLinked] = await Promise.all([
    prisma.childProfile.count({ where: { parentUserId: actor.userId, universe: "MONDE" } }),
    prisma.childProfile.count({ where: { parentUserId: actor.userId, universe: "RACINES" } }),
    prisma.childProfile.count({ where: { parentUserId: actor.userId } }),
  ]);

  // Comptage sièges adultes ROOTS_FAMILY · grants USER pointant sur un
  // household ROOTS_FAMILY (voir doctrine assignAdultRootsSeat).
  const rfHouseholds = activeGrants
    .filter((g) => g.productVariant.product.code === "ROOTS_FAMILY")
    .map((g) => g.id);
  const rootsAdultsUsed = rfHouseholds.length > 0
    ? await prisma.accessGrant.count({
        where: {
          beneficiaryType: "USER",
          status: "ACTIVE",
          productVariant: { product: { code: "ROOTS_FAMILY" } },
          sourceId: { in: householdIds },
        },
      })
    : 0;

  // Agrégation capacité par produit actif.
  let capacity: FamilySeatCapacity = { ...ZERO };
  for (const g of activeGrants) {
    capacity = addCapacity(capacity, capacityFromProduct(g.productVariant.product.code));
  }

  // Fallback legacy · aucun grant Family → 4 Racines max (préservation P4.1).
  if (activeGrants.length === 0) {
    capacity = { mondeChildren: 0, racinesChildren: FALLBACK_MAX_RACINES_CHILDREN, rootsAdults: 0 };
  }

  const used: FamilySeatCapacity = {
    mondeChildren: mondeUsed,
    racinesChildren: racinesUsed,
    rootsAdults: rootsAdultsUsed,
  };
  const remaining: FamilySeatCapacity = {
    mondeChildren: Math.max(0, capacity.mondeChildren - used.mondeChildren),
    racinesChildren: Math.max(0, capacity.racinesChildren - used.racinesChildren),
    rootsAdults: Math.max(0, capacity.rootsAdults - used.rootsAdults),
  };

  // API legacy preservée · seats[] par (productCode, universe) + total.
  const seats: FamilySeatSnapshot[] = [];
  if (activeGrants.length === 0) {
    seats.push({
      universe: "RACINES",
      productCode: "FALLBACK_HOUSEHOLD_LEGACY",
      seatsTotal: FALLBACK_MAX_RACINES_CHILDREN,
      seatsUsed: racinesUsed,
      seatsAvailable: remaining.racinesChildren,
      grantEndsAt: null,
    });
  } else {
    for (const g of activeGrants) {
      const cap = capacityFromProduct(g.productVariant.product.code);
      if (cap.mondeChildren > 0) {
        seats.push({
          universe: "MONDE",
          productCode: g.productVariant.product.code,
          seatsTotal: cap.mondeChildren,
          seatsUsed: 0, // sièges nommés non implémentés · agrégation en `used`
          seatsAvailable: cap.mondeChildren,
          grantEndsAt: g.endsAt,
        });
      }
      if (cap.racinesChildren > 0) {
        seats.push({
          universe: "RACINES",
          productCode: g.productVariant.product.code,
          seatsTotal: cap.racinesChildren,
          seatsUsed: 0,
          seatsAvailable: cap.racinesChildren,
          grantEndsAt: g.endsAt,
        });
      }
    }
  }
  const totalChildSeatsAvailable = remaining.mondeChildren + remaining.racinesChildren;

  return {
    seats,
    totalChildSeatsAvailable,
    totalChildrenActuallyLinked,
    capacity,
    used,
    remaining,
  };
}

/**
 * Lot 7C.4 · le service exige désormais l'univers demandé et vérifie
 * uniquement le pool correspondant · cross-subsidy impossible.
 *
 * Refuse également :
 *   - universe absent ou invalide (fail-closed)
 *   - pool saturé sur l'univers demandé même si l'autre pool a des places
 */
export type AssertChildOk = { ok: true };
export type AssertChildKo = {
  ok: false;
  reason: "no_seat_available" | "universe_invalid";
  universe: SeatUniverse | null;
  limit: number;
  current: number;
};

export async function assertCanAddChildProfile(
  actor: FamilyGuardianActor,
  universe: SeatUniverse,
): Promise<AssertChildOk | AssertChildKo> {
  if (universe !== "MONDE" && universe !== "RACINES") {
    return { ok: false, reason: "universe_invalid", universe: null, limit: 0, current: 0 };
  }
  const snap = await getFamilySeatSnapshot(actor);
  const limit = universe === "MONDE" ? snap.capacity.mondeChildren : snap.capacity.racinesChildren;
  const current = universe === "MONDE" ? snap.used.mondeChildren : snap.used.racinesChildren;
  const remaining = universe === "MONDE" ? snap.remaining.mondeChildren : snap.remaining.racinesChildren;
  if (remaining <= 0) {
    return { ok: false, reason: "no_seat_available", universe, limit, current };
  }
  return { ok: true };
}
