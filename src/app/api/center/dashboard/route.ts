// P4.3a · GET /api/center/dashboard
// Compteurs réels · teacher/classroom/student/pending. Aucune metric fictive.

import { NextResponse } from "next/server";
import { getFlag } from "@/lib/flags";
import { resolveCenterActor } from "@/lib/permissions/center";
import { getCenterDashboard } from "@/lib/center/queries";
import { mapErrorToResponse } from "@/lib/api/circleErrors";

export async function GET() {
  if (!getFlag("CENTER_REAL_DATA_ENABLED")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const actor = await resolveCenterActor();
    const stats = await getCenterDashboard(actor.centerId);
    return NextResponse.json({ center: actor.center, stats });
  } catch (e) {
    return mapErrorToResponse(e);
  }
}
