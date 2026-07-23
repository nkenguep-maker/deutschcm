// P4.5-B2a · PATCH /api/student/submissions/[submissionId]

import type { NextRequest } from "next/server";
import { runStudentRoute } from "@/lib/api/studentRouteHelper";
import { updateStudentSubmissionDraft } from "@/lib/assignments/student";
import { validateSubmissionBody } from "@/lib/assignments/bodyValidators";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> },
) {
  const { submissionId } = await params;
  const raw = await req.json().catch(() => ({}));
  return runStudentRoute(
    async (tx, actor) => {
      const body = validateSubmissionBody(raw);
      const updated = await updateStudentSubmissionDraft(tx, actor, submissionId, {
        writtenContent: body.writtenContent,
      });
      return { submission: updated };
    },
    { writeTx: true, errorCode: "concurrent_submission_update" },
  );
}
