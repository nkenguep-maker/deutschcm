import "server-only";
import { ProductCode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { FamilyGuardianActor } from "./actor";

// P4.6 Lot 5 · comptage des sièges enfants PAR UNIVERS.
//
// Doctrine commerciale (brief §3) :
//   - ROOTS_FAMILY  → 4 sièges enfants Racines max
//   - FAMILY_MONDE  → sièges enfants Monde (produit à créer plus tard,
//                     absent pour l'instant → 0 sièges Monde par défaut)
//
// Un enfant est comptabilisé selon son univers dérivé de activeLangue
// (native → RACINES, foreign → MONDE). Les enfants sans langue active
// sont comptés comme MONDE par défaut (aligné sur inferUniverse).

const RACINES_LANGS = new Set(["wolof", "douala", "lingala", "bambara", "yoruba", "swahili"]);

export type ChildUniverse = "MONDE" | "RACINES";

function childUniverseFrom(activeLangue: string | null, langues: unknown): ChildUniverse {
  if (activeLangue && RACINES_LANGS.has(activeLangue)) return "RACINES";
  if (Array.isArray(langues)) {
    for (const l of langues) {
      const n = (l as { langue?: string } | null)?.langue;
      if (typeof n === "string" && RACINES_LANGS.has(n)) return "RACINES";
    }
  }
  return "MONDE";
}

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

  // Grants HOUSEHOLD ACTIVE (souscriptions du foyer).
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

  let racinesMax = 0;
  // FAMILY_MONDE (produit à créer ultérieurement) alimenterait mondeMax.
  // Absent du catalogue Lot 5 → toujours 0 pour l'instant.
  const mondeMax = 0;
  for (const g of grants) {
    const code = g.productVariant.product.code;
    if (code === ProductCode.ROOTS_FAMILY) racinesMax += 4;
  }

  // Enfants existants du parent (source de vérité pour "used").
  const children = await prisma.childProfile.findMany({
    where: { parentUserId: actor.userId },
    select: { id: true, activeLangue: true, langues: true },
  });

  let racinesUsed = 0;
  let mondeUsed = 0;
  for (const c of children) {
    const uni = childUniverseFrom(c.activeLangue, c.langues);
    if (uni === "RACINES") racinesUsed += 1;
    else mondeUsed += 1;
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

export type UniverseSeatDenial =
  | "no_universe_subscription"
  | "universe_seats_exhausted";

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
