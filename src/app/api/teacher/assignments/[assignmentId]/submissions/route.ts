// P4.5-B2a · GET /api/teacher/assignments/[assignmentId]/submissions

import type { NextRequest } from "next/server";
import { runTeacherRoute } from "@/lib/api/teacherRouteHelper";
import { listAssignmentSubmissions } from "@/lib/assignments/teacher";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> },
) {
  const { assignmentId } = await params;
  return runTeacherRoute(async (tx, actor) => {
    const submissions = await listAssignmentSubmissions(tx, actor, assignmentId);
    return { submissions };
  });
}
