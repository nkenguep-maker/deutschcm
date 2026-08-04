// P4.5-B2a · gate feature flag pour toutes les routes P4.5 Monde.
//
// Avec `ASSIGNMENTS_ENABLED=false` (par défaut), chaque route retourne un
// 404 stable · payload identique à une ressource inexistante · aucune
// résolution de session, aucune lecture DB, aucun audit, aucune fuite
// indiquant que la fonctionnalité existe (§3 brief B2).

import { NextResponse } from "next/server";
import { isAssignmentsActive } from "@/lib/flags";

/**
 * Retourne un `NextResponse` 404 stable si le flag `ASSIGNMENTS_ENABLED`
 * est désactivé. À placer TOUT en début de handler avant tout `await` DB
 * ou session · aucun side-effect si le flag est off.
 */
export function assignmentsFlagOr404(): NextResponse | null {
  if (isAssignmentsActive()) return null;
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export const STABLE_404 = () =>
  NextResponse.json({ error: "Not found" }, { status: 404 });
