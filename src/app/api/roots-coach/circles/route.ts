// P4.4 · GET /api/roots-coach/circles · pagination.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isRootsCoachWorkspaceActive } from "@/lib/flags";
import { resolveRootsCoachActor } from "@/lib/permissions/rootsCoach";
import { getRootsCoachCircles } from "@/lib/rootsCoach/queries";
import { mapErrorToResponse } from "@/lib/api/circleErrors";

export async function GET(request: NextRequest) {
  if (!isRootsCoachWorkspaceActive()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const actor = await resolveRootsCoachActor();
    const url = new URL(request.url);
    const result = await getRootsCoachCircles(actor.userId, {
      page: Number(url.searchParams.get("page") ?? 1),
      pageSize: Number(url.searchParams.get("pageSize") ?? 25),
    });
    return NextResponse.json(result);
  } catch (e) {
    return mapErrorToResponse(e);
  }
}
