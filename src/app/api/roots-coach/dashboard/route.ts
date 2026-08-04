// P4.4 · GET /api/roots-coach/dashboard · compteurs réels · aucune metric fictive.

import { NextResponse } from "next/server";
import { isRootsCoachWorkspaceActive } from "@/lib/flags";
import { resolveRootsCoachActor } from "@/lib/permissions/rootsCoach";
import { getRootsCoachDashboard } from "@/lib/rootsCoach/queries";
import { mapErrorToResponse } from "@/lib/api/circleErrors";

export async function GET() {
  if (!isRootsCoachWorkspaceActive()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const actor = await resolveRootsCoachActor();
    const stats = await getRootsCoachDashboard(actor.userId);
    return NextResponse.json({ actorRole: actor.actorRole, stats });
  } catch (e) {
    return mapErrorToResponse(e);
  }
}
