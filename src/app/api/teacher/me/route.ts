// P4.3b · GET /api/teacher/me · projection minimale du Teacher courant.

import { NextResponse } from "next/server";
import { isTeacherWorkspaceActive } from "@/lib/flags";
import { resolveTeacherActor } from "@/lib/permissions/teacher";
import { mapErrorToResponse } from "@/lib/api/circleErrors";

export async function GET() {
  if (!isTeacherWorkspaceActive()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const actor = await resolveTeacherActor();
    return NextResponse.json({
      teacher: actor.teacher,
      center: actor.center,
      actorRole: actor.actorRole,
    });
  } catch (e) {
    return mapErrorToResponse(e);
  }
}
