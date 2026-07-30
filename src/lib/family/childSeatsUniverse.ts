import "server-only";
import { prisma } from "@/lib/prisma";
import type { FamilyGuardianActor } from "./actor";

// P4.6 Lot 5.1 · comptage des sièges enfants PAR UNIVERS EXPLICITE.
//
// Doctrine commerciale :
//   - ROOTS_FAMILY        → 4 sièges enfants Racines max
//   - CHILD_WORLD_SINGLE  → 1 siège enfant Monde
//   - FAMILY_WORLD        → 3 sièges enfants Monde
//   - Aucun produit Famille ne débloque un Passage Monde adulte.
//
// L'univers d'un enfant est lu depuis ChildProfile.universe (colonne
// explicite ajoutée par la migration 20260731000001_p4_6_lot5_1_monde_seats_
// universe). En transition, un enfant sans universe défini est classé
// UNKNOWN et n'entre dans aucun compteur (n'occupe donc aucun siège tant
// que le backfill n'a pas été fait). Aucune liste de langues n'est utilisée
// comme autorité (patch Lot 5.1 §2).

export type ChildUniverse = "MONDE" | "RACINES";

// Barème par ProductCode. Additive · ajout futur direct dans la table.
const CHILD_SEATS_PER_PRODUCT: Record<string, { monde: number; racines: number }> = {
  ROOTS_FAMILY: { monde: 0, racines: 4 },
  CHILD_WORLD_SINGLE: { monde: 1, racines: 0 },
  FAMILY_WORLD: { monde: 3, racines: 0 },
};

export interface UniverseSeatSnapshot {
  universe: ChildUniverse;
  seatsMax: number;
  seatsUsed: number;
  seatsAvailable: number;
}

export async function getUniverseSeats(actor: FamilyGuardianActor): Promise<{
  monde: UniverseSeatSnapshot;
  racines: UniverseSeatSnapshot;
}> {
  const householdIds = Array.from(new Set([...actor.householdIdsOwned, ...actor.householdIdsMember]));

  const grants = householdIds.length
    ? await prisma.accessGrant.findMany({
        where: {
          beneficiaryType: "HOUSEHOLD",
          beneficiaryId: { in: householdIds },
          status: "ACTIVE",
        },
        select: { productVariant: { select: { product: { select: { code: true } } } } },
      })
    : [];

  let mondeMax = 0;
  let racinesMax = 0;
  for (const g of grants) {
    const code = g.productVariant.product.code as string;
    const rule = CHILD_SEATS_PER_PRODUCT[code];
    if (rule) {
      mondeMax += rule.monde;
      racinesMax += rule.racines;
    }
  }

  // Enfants existants du parent. On lit uniquement `universe` (autorité
  // canonique Lot 5.1). Les enfants sans universe (backfill en attente)
  // n'occupent aucun siège.
  const children = await prisma.childProfile.findMany({
    where: { parentUserId: actor.userId },
    select: { id: true, universe: true },
  });

  let mondeUsed = 0;
  let racinesUsed = 0;
  for (const c of children) {
    if (c.universe === "MONDE") mondeUsed += 1;
    else if (c.universe === "RACINES") racinesUsed += 1;
  }

  return {
    monde: {
      universe: "MONDE",
      seatsMax: mondeMax,
      seatsUsed: mondeUsed,
      seatsAvailable: Math.max(0, mondeMax - mondeUsed),
    },
    racines: {
      universe: "RACINES",
      seatsMax: racinesMax,
      seatsUsed: racinesUsed,
      seatsAvailable: Math.max(0, racinesMax - racinesUsed),
    },
  };
}

export type UniverseSeatDenial = "no_universe_subscription" | "universe_seats_exhausted";

export async function assertUniverseSeatAvailable(
  actor: FamilyGuardianActor,
  universe: ChildUniverse,
): Promise<{ ok: true } | { ok: false; error: UniverseSeatDenial }> {
  const seats = await getUniverseSeats(actor);
  const snap = universe === "RACINES" ? seats.racines : seats.monde;
  if (snap.seatsMax <= 0) return { ok: false, error: "no_universe_subscription" };
  if (snap.seatsAvailable <= 0) return { ok: false, error: "universe_seats_exhausted" };
  return { ok: true };
}

// Exportée pour usage direct dans le seed / QA fixtures et tests.
export function seatCapacityForProduct(code: string): { monde: number; racines: number } {
  return CHILD_SEATS_PER_PRODUCT[code] ?? { monde: 0, racines: 0 };
}
