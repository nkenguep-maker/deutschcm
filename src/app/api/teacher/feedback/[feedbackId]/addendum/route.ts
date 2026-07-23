// P4.5-B2a · POST /api/teacher/feedback/[feedbackId]/addendum

import type { NextRequest } from "next/server";
import { runTeacherRoute } from "@/lib/api/teacherRouteHelper";
import { createAssignmentFeedbackAddendum } from "@/lib/assignments/teacher";
import { validateFeedbackBody } from "@/lib/assignments/bodyValidators";
import { FeedbackError } from "@/lib/assignments/errors";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ feedbackId: string }> },
) {
  const { feedbackId } = await params;
  const raw = await req.json().catch(() => ({}));
  return runTeacherRoute(
    async (tx, actor) => {
      if (
        raw && typeof raw === "object"
        && ("supersedesFeedbackId" in raw || "version" in raw || "submissionId" in raw)
      ) {
        throw new FeedbackError(
          "feedback_invalid_transition",
          "supersedesFeedbackId/version/submissionId are computed server-side",
        );
      }
      const body = validateFeedbackBody(raw);
      const addendum = await createAssignmentFeedbackAddendum(tx, actor, {
        previousFeedbackId: feedbackId,
        writtenContent: body.writtenContent,
      });
      return { feedback: addendum };
    },
    { writeTx: true, errorCode: "concurrent_feedback_update" },
  );
}
