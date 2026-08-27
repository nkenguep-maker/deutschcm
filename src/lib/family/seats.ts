import "server-only";
import { prisma } from "@/lib/prisma";
import type { FamilyGuardianActor } from "./actor";

export type SeatUniverse = "MONDE" | "RACINES";

export interface FamilySeatCapacity {
  mondeChildren: number;
  racinesChildren: number;
  rootsAdults: number;
}

const ZERO: FamilySeatCapacity = { mondeChildren: 0, racinesChildren: 0, rootsAdults: 0 };
const P1_REF = "kzzagbojjkivdzzcrmxn";

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

const FALLBACK_MAX_RACINES_CHILDREN = 4;

/**
 * P-1 technical beta only: allow a Family tester to create one Monde child
 * without fabricating an Order/AccessGrant. Production and non-P-1 projects
 * never receive this seat. Racines keeps the historical four-child fallback.
 */
export function hasP1TechnicalFamilySeat(): boolean {
  if (process.env.VERCEL_ENV === "production") return false;
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && url.hostname === `${P1_REF}.supabase.co`;
  } catch {
    return false;
  }
}

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
  seats: FamilySeatSnapshot[];
  totalChildSeatsAvailable: number;
  totalChildrenActuallyLinked: number;
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

  const [mondeUsed, racinesUsed, totalChildrenActuallyLinked] = await Promise.all([
    prisma.childProfile.count({ where: { parentUserId: actor.userId, universe: "MONDE" } }),
    prisma.childProfile.count({ where: { parentUserId: actor.userId, universe: "RACINES" } }),
    prisma.childProfile.count({ where: { parentUserId: actor.userId } }),
  ]);

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

  let capacity: FamilySeatCapacity = { ...ZERO };
  for (const g of activeGrants) {
    capacity = addCapacity(capacity, capacityFromProduct(g.productVariant.product.code));
  }

  if (activeGrants.length === 0) {
    capacity = {
      mondeChildren: hasP1TechnicalFamilySeat() ? 1 : 0,
      racinesChildren: FALLBACK_MAX_RACINES_CHILDREN,
      rootsAdults: 0,
    };
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

  const seats: FamilySeatSnapshot[] = [];
  if (activeGrants.length === 0) {
    if (capacity.mondeChildren > 0) {
      seats.push({
        universe: "MONDE",
        productCode: "P1_TECHNICAL_BETA_CHILD_WORLD",
        seatsTotal: capacity.mondeChildren,
        seatsUsed: mondeUsed,
        seatsAvailable: remaining.mondeChildren,
        grantEndsAt: null,
      });
    }
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
          seatsUsed: 0,
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
