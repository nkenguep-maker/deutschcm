// P4.5-B2a · GET/PATCH /api/teacher/assignments/[assignmentId]

import type { NextRequest } from "next/server";
import { runTeacherRoute } from "@/lib/api/teacherRouteHelper";
import {
  getTeacherAssignment,
  updateTeacherAssignmentDraft,
} from "@/lib/assignments/teacher";
import { validateUpdateAssignmentBody } from "@/lib/assignments/bodyValidators";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> },
) {
  const { assignmentId } = await params;
  return runTeacherRoute(async (tx, actor) => {
    const assignment = await getTeacherAssignment(tx, actor, assignmentId);
    return { assignment };
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> },
) {
  const { assignmentId } = await params;
  const raw = await req.json().catch(() => ({}));
  return runTeacherRoute(
    async (tx, actor) => {
      const body = validateUpdateAssignmentBody(raw);
      const updated = await updateTeacherAssignmentDraft(tx, actor, assignmentId, body);
      return { assignment: updated };
    },
    { writeTx: true, errorCode: "concurrent_assignment_update" },
  );
}

// TEACHER cannot DELETE an assignment · deny-by-default (no DELETE handler).
