import type { MondePath } from "./mondePath";
import { resolveMondePath } from "./mondePath";
import { MONDE_PATHS } from "./mondePath";

// Lot 7B · distribution des parcours · pure fonction · brief §7.
//
// Consomme une liste d'apprenants (learningGoal string ou null) et
// retourne le compteur par parcours + le compteur "à préciser".
// AUCUNE inférence depuis la ville, le niveau, la langue ou le rôle.

export interface PathwayDistributionRow {
  path: MondePath | "UNKNOWN";
  count: number;
}

export function distributePathways(
  learners: ReadonlyArray<{ learningGoal?: string | null }>,
): PathwayDistributionRow[] {
  const counts = new Map<MondePath | "UNKNOWN", number>();
  for (const p of MONDE_PATHS) counts.set(p, 0);
  counts.set("UNKNOWN", 0);

  for (const l of learners) {
    const p = resolveMondePath({ learningGoal: l.learningGoal ?? null });
    const key: MondePath | "UNKNOWN" = p ?? "UNKNOWN";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const order: readonly (MondePath | "UNKNOWN")[] = [
    "STUDIES", "WORK", "TRAVEL", "EXAM", "DAILY_LIFE", "UNKNOWN",
  ];
  return order.map((k) => ({ path: k, count: counts.get(k) ?? 0 }));
}
