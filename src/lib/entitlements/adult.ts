import "server-only";
import { ProductCode } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// P4.6 Lot 4A · droits d'apprentissage ADULTE (séparés du rôle).
//
// Brief §1 · un compte FAMILY_GUARDIAN N'obtient JAMAIS automatiquement un
// accès adulte. Il doit posséder un grant explicite (WORLD_PASSAGE_* pour
// Monde, ROOTS_SOLO ou siège adulte ROOTS_FAMILY pour Racines).
//
// Ces helpers sont server-only et ne dépendent d'aucun frontend. Ils sont
// utilisés par le sélecteur "Mon parcours" et par les gardes d'accès aux
// dashboards adultes (student-monde/student-racines).

async function activeUserGrantsForCodes(userId: string, codes: ProductCode[]) {
  return prisma.accessGrant.findMany({
    where: {
      beneficiaryType: "USER",
      beneficiaryId: userId,
      status: "ACTIVE",
      productVariant: { product: { code: { in: codes } } },
    },
    select: { id: true, endsAt: true },
  });
}

export async function hasAdultWorldAccess(userId: string): Promise<boolean> {
  // Un Passage Monde adulte quel que soit le niveau (A1..C1) débloque
  // l'accès adulte Monde. On ne matche que sur PASSAGE (product code) —
  // ROOTS_FAMILY et FAMILY_MONDE ne comptent JAMAIS (brief §2).
  const grants = await activeUserGrantsForCodes(userId, [ProductCode.PASSAGE]);
  return grants.length > 0;
}

export async function hasAdultRootsAccess(userId: string): Promise<boolean> {
  // Racines adulte accessible UNIQUEMENT via un grant USER explicite :
  //   - ROOTS_SOLO       → siège individuel
  //   - ROOTS_FAMILY     → siège adulte ATTRIBUÉ (voir assignAdultRootsSeat)
  //
  // La simple appartenance à un Household avec grant HOUSEHOLD ROOTS_FAMILY
  // NE SUFFIT PAS (patch Lot 4A → 4B) : chaque adulte doit avoir son propre
  // grant USER ROOTS_FAMILY dont le sourceId pointe vers le Household
  // acheteur. Max 2 sièges USER par Household (assigné/révoqué côté serveur).
  const grants = await activeUserGrantsForCodes(userId, [
    ProductCode.ROOTS_SOLO,
    ProductCode.ROOTS_FAMILY,
  ]);
  return grants.length > 0;
}

export interface AdultAccessSummary {
  monde: boolean;
  racines: boolean;
  hasAnyAdultAccess: boolean;
}

export async function getAdultAccessSummary(userId: string): Promise<AdultAccessSummary> {
  const [monde, racines] = await Promise.all([
    hasAdultWorldAccess(userId),
    hasAdultRootsAccess(userId),
  ]);
  return { monde, racines, hasAnyAdultAccess: monde || racines };
}
