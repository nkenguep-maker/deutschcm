// P4.5-B2a · POST /api/student/submissions/[submissionId]/versions
//
// Crée une nouvelle version après un SUBMITTED précédent. Le
// `submissionId` du path identifie la version précédente. Le service
// recalcule le prochain numéro de version et marque l'ancienne SUPERSEDED.

import type { NextRequest } from "next/server";
import { runStudentRoute } from "@/lib/api/studentRouteHelper";
import { createStudentSubmissionVersion } from "@/lib/assignments/student";
import { validateSubmissionBody } from "@/lib/assignments/bodyValidators";
import { SubmissionError } from "@/lib/assignments/errors";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> },
) {
  const { submissionId } = await params;
  const raw = await req.json().catch(() => ({}));
  return runStudentRoute(
    async (tx, actor) => {
      const body = validateSubmissionBody(raw);
      // On récupère l'assignmentId depuis la submission précédente
      // (identifiée par path) plutôt que depuis le body · sécurité +
      // cohérence workflow. Le service refuse si la submission n'est pas
      // la propriété du Student.
      const prev = await tx.assignmentSubmission.findFirst({
        where: { id: submissionId, userId: actor.userId },
        select: { assignmentId: true },
      });
      if (!prev) {
        throw new SubmissionError(
          "submission_not_found",
          "previous submission not found or not owned",
        );
      }
      const created = await createStudentSubmissionVersion(tx, actor, {
        assignmentId: prev.assignmentId,
        writtenContent: body.writtenContent,
      });
      return { submission: created };
    },
    { writeTx: true, errorCode: "concurrent_submission_update" },
  );
}
