// P4.5-B2a · GET/POST /api/teacher/classes/[classroomId]/assignments

import type { NextRequest } from "next/server";
import { runTeacherRoute } from "@/lib/api/teacherRouteHelper";
import {
  listTeacherAssignments,
  createTeacherAssignmentDraft,
} from "@/lib/assignments/teacher";
import { validateCreateAssignmentBody } from "@/lib/assignments/bodyValidators";
import { AssignmentError } from "@/lib/assignments/errors";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ classroomId: string }> },
) {
  const { classroomId } = await params;
  return runTeacherRoute(async (tx, actor) => {
    const items = await listTeacherAssignments(tx, actor, { classroomId });
    return { assignments: items };
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ classroomId: string }> },
) {
  const { classroomId } = await params;
  const raw = await req.json().catch(() => ({}));
  return runTeacherRoute(
    async (tx, actor) => {
      // Body allowlist stricte · rejette classroomId dans le body.
      if (
        raw && typeof raw === "object"
        && ("classroomId" in raw || "teacherId" in raw)
      ) {
        throw new AssignmentError(
          "assignment_invalid_transition",
          "classroomId/teacherId must come from path/session, not body",
        );
      }
      const body = validateCreateAssignmentBody(raw);
      const created = await createTeacherAssignmentDraft(tx, actor, {
        classroomId,
        title: body.title,
        instructions: body.instructions,
        dueAt: body.dueAt,
        productionType: body.productionType,
      });
      return { assignment: created };
    },
    { writeTx: true, errorCode: "concurrent_assignment_update" },
  );
}
