// P4.5-B2a · POST /api/teacher/assignments/[assignmentId]/close

import type { NextRequest } from "next/server";
import { runTeacherRoute } from "@/lib/api/teacherRouteHelper";
import { closeTeacherAssignment } from "@/lib/assignments/teacher";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> },
) {
  const { assignmentId } = await params;
  return runTeacherRoute(
    async (tx, actor) => {
      const closed = await closeTeacherAssignment(tx, actor, assignmentId);
      return { assignment: closed };
    },
    { writeTx: true, errorCode: "concurrent_assignment_update" },
  );
}
