// P4.5-B2a · POST /api/student/submissions/[submissionId]/submit

import type { NextRequest } from "next/server";
import { runStudentRoute } from "@/lib/api/studentRouteHelper";
import { submitStudentSubmission } from "@/lib/assignments/student";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> },
) {
  const { submissionId } = await params;
  return runStudentRoute(
    async (tx, actor) => {
      const submitted = await submitStudentSubmission(tx, actor, submissionId);
      return { submission: submitted };
    },
    { writeTx: true, errorCode: "concurrent_submission_update" },
  );
}
