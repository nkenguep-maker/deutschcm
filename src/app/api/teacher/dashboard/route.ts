// P4.3b · GET /api/teacher/dashboard · compteurs réels · aucune metric fictive.

import { NextResponse } from "next/server";
import { isTeacherWorkspaceActive } from "@/lib/flags";
import { resolveTeacherActor } from "@/lib/permissions/teacher";
import { getTeacherDashboard } from "@/lib/teacher/queries";
import { mapErrorToResponse } from "@/lib/api/circleErrors";

export async function GET() {
  if (!isTeacherWorkspaceActive()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const actor = await resolveTeacherActor();
    const stats = await getTeacherDashboard(actor.teacherId);
    return NextResponse.json({
      teacher: actor.teacher,
      center: actor.center,
      stats,
    });
  } catch (e) {
    return mapErrorToResponse(e);
  }
}
