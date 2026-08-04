// P4.5-B2a · GET /api/student/assignments/[assignmentId]

import type { NextRequest } from "next/server";
import { runStudentRoute } from "@/lib/api/studentRouteHelper";
import { getStudentAssignment } from "@/lib/assignments/student";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> },
) {
  const { assignmentId } = await params;
  return runStudentRoute(async (tx, actor) => {
    const assignment = await getStudentAssignment(tx, actor, assignmentId);
    return { assignment };
  });
}
