// P4.4 · GET /api/roots-coach/capacity · état capacité 10/20.

import { NextResponse } from "next/server";
import { isRootsCoachWorkspaceActive } from "@/lib/flags";
import { resolveRootsCoachActor } from "@/lib/permissions/rootsCoach";
import { getRootsCoachCapacity } from "@/lib/rootsCoach/queries";
import { mapErrorToResponse } from "@/lib/api/circleErrors";

export async function GET() {
  if (!isRootsCoachWorkspaceActive()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const actor = await resolveRootsCoachActor();
    const capacity = await getRootsCoachCapacity(actor.userId);
    return NextResponse.json({ capacity });
  } catch (e) {
    return mapErrorToResponse(e);
  }
}
