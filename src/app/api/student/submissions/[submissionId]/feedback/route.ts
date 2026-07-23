// P4.5-B2a · GET /api/student/submissions/[submissionId]/feedback

import type { NextRequest } from "next/server";
import { runStudentRoute } from "@/lib/api/studentRouteHelper";
import { listStudentFeedback } from "@/lib/assignments/student";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> },
) {
  const { submissionId } = await params;
  return runStudentRoute(async (tx, actor) => {
    // Le service `listStudentFeedback` filtre serveur PUBLISHED + ADDENDUM
    // uniquement · le Student ne peut jamais voir un brouillon Teacher.
    const feedbacks = await listStudentFeedback(tx, actor, submissionId);
    return { feedbacks };
  });
}
