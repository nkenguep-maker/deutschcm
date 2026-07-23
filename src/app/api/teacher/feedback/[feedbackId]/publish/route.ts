// P4.5-B2a · POST /api/teacher/feedback/[feedbackId]/publish

import type { NextRequest } from "next/server";
import { runTeacherRoute } from "@/lib/api/teacherRouteHelper";
import { publishAssignmentFeedback } from "@/lib/assignments/teacher";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ feedbackId: string }> },
) {
  const { feedbackId } = await params;
  return runTeacherRoute(
    async (tx, actor) => {
      const published = await publishAssignmentFeedback(tx, actor, feedbackId);
      return { feedback: published };
    },
    { writeTx: true, errorCode: "concurrent_feedback_update" },
  );
}
