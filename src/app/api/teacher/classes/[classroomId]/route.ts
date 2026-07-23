// P4.3b · GET /api/teacher/classes/[classroomId] · detail scopé teacherId.

import { NextResponse } from "next/server";
import { isTeacherWorkspaceActive } from "@/lib/flags";
import {
  resolveTeacherActor,
  assertTeacherOwnsClassroom,
} from "@/lib/permissions/teacher";
import { getTeacherClass } from "@/lib/teacher/queries";
import { mapErrorToResponse } from "@/lib/api/circleErrors";

export async function GET(
  _request: Request,
  context: { params: Promise<{ classroomId: string }> },
) {
  if (!isTeacherWorkspaceActive()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const actor = await resolveTeacherActor();
    const { classroomId } = await context.params;
    await assertTeacherOwnsClassroom(actor, classroomId);
    const classroom = await getTeacherClass(actor.teacherId, classroomId);
    if (!classroom) {
      // Cohérence · assertTeacherOwnsClassroom aurait déjà throw 404 sinon.
      return NextResponse.json({ error: "class not found", code: "class_not_found" }, { status: 404 });
    }
    return NextResponse.json({ classroom });
  } catch (e) {
    return mapErrorToResponse(e);
  }
}
