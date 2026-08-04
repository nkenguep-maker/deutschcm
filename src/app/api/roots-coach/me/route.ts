// P4.4 · GET /api/roots-coach/me · projection minimale du Coach courant.

import { NextResponse } from "next/server";
import { isRootsCoachWorkspaceActive } from "@/lib/flags";
import { resolveRootsCoachActor } from "@/lib/permissions/rootsCoach";
import { mapErrorToResponse } from "@/lib/api/circleErrors";

export async function GET() {
  if (!isRootsCoachWorkspaceActive()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const actor = await resolveRootsCoachActor();
    return NextResponse.json({
      actorRole: actor.actorRole,
      activeCircleCount: actor.activeCircleCount,
      activeChildProfileCount: actor.activeChildProfileCount,
    });
  } catch (e) {
    return mapErrorToResponse(e);
  }
}
