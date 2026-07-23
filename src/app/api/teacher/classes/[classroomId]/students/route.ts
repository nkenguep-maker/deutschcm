// P4.3b · GET /api/teacher/classes/[classroomId]/students · scope strict.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isTeacherWorkspaceActive } from "@/lib/flags";
import {
  resolveTeacherActor,
  assertTeacherOwnsClassroom,
} from "@/lib/permissions/teacher";
import { getTeacherClassStudents } from "@/lib/teacher/queries";
import { mapErrorToResponse } from "@/lib/api/circleErrors";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ classroomId: string }> },
) {
  if (!isTeacherWorkspaceActive()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const actor = await resolveTeacherActor();
    const { classroomId } = await context.params;
    await assertTeacherOwnsClassroom(actor, classroomId);
    const url = new URL(request.url);
    const result = await getTeacherClassStudents(actor.teacherId, classroomId, {
      page: Number(url.searchParams.get("page") ?? 1),
      pageSize: Number(url.searchParams.get("pageSize") ?? 25),
      query: url.searchParams.get("query") ?? undefined,
    });
    return NextResponse.json(result);
  } catch (e) {
    return mapErrorToResponse(e);
  }
}
