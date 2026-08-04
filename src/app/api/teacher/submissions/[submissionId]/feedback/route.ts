// P4.5-B2a · POST /api/teacher/submissions/[submissionId]/feedback

import type { NextRequest } from "next/server";
import { runTeacherRoute } from "@/lib/api/teacherRouteHelper";
import { createAssignmentFeedbackDraft } from "@/lib/assignments/teacher";
import { validateFeedbackBody } from "@/lib/assignments/bodyValidators";
import { FeedbackError } from "@/lib/assignments/errors";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> },
) {
  const { submissionId } = await params;
  const raw = await req.json().catch(() => ({}));
  return runTeacherRoute(
    async (tx, actor) => {
      if (
        raw && typeof raw === "object"
        && ("submissionId" in raw || "authorId" in raw || "authorTeacherId" in raw)
      ) {
        throw new FeedbackError(
          "feedback_invalid_transition",
          "submissionId/author must come from path/session, not body",
        );
      }
      const body = validateFeedbackBody(raw);
      const feedback = await createAssignmentFeedbackDraft(tx, actor, {
        submissionId,
        writtenContent: body.writtenContent,
      });
      return { feedback };
    },
    { writeTx: true, errorCode: "concurrent_feedback_update" },
  );
}
