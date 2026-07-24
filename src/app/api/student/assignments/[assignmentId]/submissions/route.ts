// P4.5-B2a · GET+POST /api/student/assignments/[assignmentId]/submissions
//
// GET · retourne uniquement les submissions de l'acteur Student courant
// (jamais celles d'un autre Student de la même Classroom). §2.2 brief.
// POST · crée une nouvelle DRAFT si aucune n'existe déjà pour cet
// assignment/student (le service applique l'unicité).

import type { NextRequest } from "next/server";
import { runStudentRoute } from "@/lib/api/studentRouteHelper";
import {
  createStudentSubmissionDraft,
} from "@/lib/assignments/student";
import { validateSubmissionBody } from "@/lib/assignments/bodyValidators";
import { SubmissionError } from "@/lib/assignments/errors";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> },
) {
  const { assignmentId } = await params;
  return runStudentRoute(async (tx, actor) => {
    const subs = await tx.assignmentSubmission.findMany({
      where: { assignmentId, userId: actor.userId },
      select: {
        id: true, assignmentId: true, status: true, version: true,
        submittedAt: true, withdrawnAt: true, updatedAt: true,
      },
      orderBy: [{ version: "desc" }, { updatedAt: "desc" }],
    });
    return { submissions: subs };
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> },
) {
  const { assignmentId } = await params;
  const raw = await req.json().catch(() => ({}));
  return runStudentRoute(
    async (tx, actor) => {
      if (
        raw && typeof raw === "object"
        && ("assignmentId" in raw || "userId" in raw)
      ) {
        throw new SubmissionError(
          "invalid_submission_transition",
          "assignmentId/userId must come from path/session, not body",
        );
      }
      const body = validateSubmissionBody(raw);
      const created = await createStudentSubmissionDraft(tx, actor, {
        assignmentId,
        writtenContent: body.writtenContent,
      });
      return { submission: created };
    },
    { writeTx: true, errorCode: "concurrent_submission_update" },
  );
}
