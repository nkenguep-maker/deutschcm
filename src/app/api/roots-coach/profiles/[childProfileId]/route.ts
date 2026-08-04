// P4.4 · GET /api/roots-coach/profiles/[childProfileId] · scope strict.

import { NextResponse } from "next/server";
import { isRootsCoachWorkspaceActive } from "@/lib/flags";
import {
  resolveRootsCoachActor,
  assertRootsCoachChildAccess,
} from "@/lib/permissions/rootsCoach";
import { getRootsCoachProfile } from "@/lib/rootsCoach/queries";
import { mapErrorToResponse } from "@/lib/api/circleErrors";

export async function GET(
  _request: Request,
  context: { params: Promise<{ childProfileId: string }> },
) {
  if (!isRootsCoachWorkspaceActive()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const actor = await resolveRootsCoachActor();
    const { childProfileId } = await context.params;
    await assertRootsCoachChildAccess(actor, childProfileId);
    const profile = await getRootsCoachProfile(actor.userId, childProfileId);
    if (!profile) {
      return NextResponse.json(
        { error: "child profile not found", code: "roots_coach_profile_not_found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ profile });
  } catch (e) {
    return mapErrorToResponse(e);
  }
}
