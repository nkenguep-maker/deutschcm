// P4.5-B2a · PATCH /api/teacher/feedback/[feedbackId]

import type { NextRequest } from "next/server";
import { runTeacherRoute } from "@/lib/api/teacherRouteHelper";
import { updateAssignmentFeedbackDraft } from "@/lib/assignments/teacher";
import { validateFeedbackBody } from "@/lib/assignments/bodyValidators";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ feedbackId: string }> },
) {
  const { feedbackId } = await params;
  const raw = await req.json().catch(() => ({}));
  return runTeacherRoute(
    async (tx, actor) => {
      const body = validateFeedbackBody(raw);
      const updated = await updateAssignmentFeedbackDraft(tx, actor, feedbackId, {
        writtenContent: body.writtenContent,
      });
      return { feedback: updated };
    },
    { writeTx: true, errorCode: "concurrent_feedback_update" },
  );
}
