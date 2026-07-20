// Household limits · enforcement SERVEUR (pas seulement UI).
//   · 2 adultes max par foyer
//   · 2 enfants par adulte actif
//   · 4 enfants max par foyer
//
// À appeler AVANT de créer un HouseholdMembership (role=ADULT) ou un
// DependentProfile. Le OWNER compte comme 1 des 2 adultes.

import { prisma } from "@/lib/prisma";

export const MAX_ADULTS_PER_HOUSEHOLD = 2;
export const MAX_DEPENDENTS_PER_ADULT = 2;
export const MAX_DEPENDENTS_PER_HOUSEHOLD = 4;

export type Check = { ok: true } | { ok: false; reason: string };

export async function canAddAdult(householdId: string): Promise<Check> {
  const [owner, adults] = await Promise.all([
    prisma.household.findUnique({ where: { id: householdId }, select: { ownerUserId: true, status: true } }),
    prisma.householdMembership.count({
      where: { householdId, status: "ACTIVE", role: { in: ["OWNER", "ADULT"] } },
    }),
  ]);
  if (!owner || owner.status !== "ACTIVE") return { ok: false, reason: "household not active" };
  // Le OWNER n'a pas forcément de row householdMemberships selon le flux.
  // On compte : rows memberships avec role in (OWNER, ADULT). Si owner absent
  // des memberships, on l'ajoute manuellement.
  const ownerCounted = await prisma.householdMembership.count({
    where: { householdId, userId: owner.ownerUserId, status: "ACTIVE" },
  });
  const effectiveAdults = adults + (ownerCounted === 0 ? 1 : 0);
  if (effectiveAdults >= MAX_ADULTS_PER_HOUSEHOLD) {
    return { ok: false, reason: `max ${MAX_ADULTS_PER_HOUSEHOLD} adults per household` };
  }
  return { ok: true };
}

export async function canAddDependent(householdId: string, managedByUserId: string): Promise<Check> {
  const [total, byAdult] = await Promise.all([
    prisma.dependentProfile.count({ where: { householdId, status: "ACTIVE" } }),
    prisma.dependentProfile.count({ where: { householdId, managedByUserId, status: "ACTIVE" } }),
  ]);
  if (total >= MAX_DEPENDENTS_PER_HOUSEHOLD) {
    return { ok: false, reason: `max ${MAX_DEPENDENTS_PER_HOUSEHOLD} dependents per household` };
  }
  if (byAdult >= MAX_DEPENDENTS_PER_ADULT) {
    return { ok: false, reason: `max ${MAX_DEPENDENTS_PER_ADULT} dependents per adult` };
  }
  return { ok: true };
}
