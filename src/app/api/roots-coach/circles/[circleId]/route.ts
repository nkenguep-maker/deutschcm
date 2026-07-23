// P4.4 · GET /api/roots-coach/circles/[circleId] · scope strict.

import { NextResponse } from "next/server";
import { isRootsCoachWorkspaceActive } from "@/lib/flags";
import {
  resolveRootsCoachActor,
  assertRootsCoachCircleAccess,
} from "@/lib/permissions/rootsCoach";
import { getRootsCoachCircle } from "@/lib/rootsCoach/queries";
import { mapErrorToResponse } from "@/lib/api/circleErrors";

export async function GET(
  _request: Request,
  context: { params: Promise<{ circleId: string }> },
) {
  if (!isRootsCoachWorkspaceActive()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const actor = await resolveRootsCoachActor();
    const { circleId } = await context.params;
    await assertRootsCoachCircleAccess(actor, circleId);
    const circle = await getRootsCoachCircle(actor.userId, circleId);
    if (!circle) {
      return NextResponse.json(
        { error: "circle not found", code: "roots_coach_circle_not_found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ circle });
  } catch (e) {
    return mapErrorToResponse(e);
  }
}
