// P4.5-B2a · GET /api/teacher/submissions/[submissionId]

import type { NextRequest } from "next/server";
import { runTeacherRoute } from "@/lib/api/teacherRouteHelper";
import { getTeacherSubmission } from "@/lib/assignments/teacher";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> },
) {
  const { submissionId } = await params;
  return runTeacherRoute(async (tx, actor) => {
    const submission = await getTeacherSubmission(tx, actor, submissionId);
    return { submission };
  });
}
