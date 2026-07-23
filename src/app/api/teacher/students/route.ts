// P4.3b · GET /api/teacher/students · agrégé sur toutes les classes du Teacher.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isTeacherWorkspaceActive } from "@/lib/flags";
import { resolveTeacherActor } from "@/lib/permissions/teacher";
import { getTeacherStudents } from "@/lib/teacher/queries";
import { mapErrorToResponse } from "@/lib/api/circleErrors";

export async function GET(request: NextRequest) {
  if (!isTeacherWorkspaceActive()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const actor = await resolveTeacherActor();
    const url = new URL(request.url);
    const result = await getTeacherStudents(actor.teacherId, {
      page: Number(url.searchParams.get("page") ?? 1),
      pageSize: Number(url.searchParams.get("pageSize") ?? 25),
      query: url.searchParams.get("query") ?? undefined,
    });
    return NextResponse.json(result);
  } catch (e) {
    return mapErrorToResponse(e);
  }
}
