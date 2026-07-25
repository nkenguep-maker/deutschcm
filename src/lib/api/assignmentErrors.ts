// P4.5-B1 · mapper HTTP centralisé pour erreurs Monde (Assignment/Submission/Feedback).
//
// Doctrine · aucun code Prisma/Postgres exposé (`P2002`, `P2034`, `40001`,
// `TransactionWriteConflict`). Toute erreur inattendue → HTTP 500
// `INTERNAL` sans détail Prisma. Pattern identique au mapper circle (P4.4).

import { NextResponse } from "next/server";
import { PermissionError } from "@/lib/permissions/circle";
import { ConcurrentUpdateError } from "@/lib/db/retry";
import {
  AssignmentError,
  SubmissionError,
  FeedbackError,
  StorageOwnershipError,
  WorkspaceAccessError,
} from "@/lib/assignments/errors";

function err(code: string, message: string, status: number, detail?: unknown) {
  return NextResponse.json(
    { error: message, code, ...(detail ? { detail } : {}) },
    { status },
  );
}

export function mapAssignmentErrorToResponse(e: unknown): NextResponse {
  // 401/403/404/409 · PermissionError commun (dérivé pour Teacher/Student/Admin).
  if (e instanceof PermissionError) {
    const status =
      e.code === "UNAUTHORIZED" ? 401 :
      e.code === "FORBIDDEN" ? 403 :
      e.code === "CONFLICT" ? 409 :
      404;
    return err(e.code, e.message, status);
  }

  // WorkspaceAccessError · rôle requis manquant.
  if (e instanceof WorkspaceAccessError) {
    return err(e.code, e.message, 403);
  }

  // AssignmentError · statut selon code.
  if (e instanceof AssignmentError) {
    const status = statusForAssignmentCode(e.code);
    return err(e.code, e.message, status, e.detail);
  }

  // SubmissionError · statut selon code.
  if (e instanceof SubmissionError) {
    const status = statusForSubmissionCode(e.code);
    return err(e.code, e.message, status, e.detail);
  }

  // FeedbackError · statut selon code.
  if (e instanceof FeedbackError) {
    const status = statusForFeedbackCode(e.code);
    return err(e.code, e.message, status, e.detail);
  }

  if (e instanceof StorageOwnershipError) {
    return err(e.code, e.message, 403, e.detail);
  }

  // Retry SSI épuisé · 409 stable, aucun leak Prisma.
  if (e instanceof ConcurrentUpdateError) {
    return err(e.code, e.message, 409);
  }

  // Trigger DB immutabilité (fallback si contourne le service) · code stable.
  const raw = e as { code?: string; message?: string };
  if (raw?.message && /submission_immutable/.test(raw.message)) {
    return err("submission_immutable", "submission is immutable after SUBMITTED", 409);
  }
  if (raw?.message && /feedback_immutable/.test(raw.message)) {
    return err("feedback_immutable", "feedback is immutable after PUBLISHED", 409);
  }

  // Postgres 40001 / Prisma P2034 non emballé · devrait TOUJOURS être
  // capturé par `withSerializableRetry` avec un `errorCode` domain-specific
  // (concurrent_assignment_update / _submission_update / _feedback_update).
  // Si on arrive ici, un chemin d'écriture ne wrappe pas correctement ·
  // c'est un bug applicatif · log warning + fallback INTERNAL 500 pour
  // éviter de masquer le problème avec un code métier trompeur (par ex.
  // exposer `concurrent_assignment_update` sur une route feedback).
  if (
    raw?.code === "40001" || raw?.code === "P2034"
    || /serialization_failure|could not serialize|TransactionWriteConflict/i.test(raw?.message ?? "")
  ) {
    console.warn(
      "[api/assignments] raw P2034/40001 escaped withSerializableRetry · missing wrap · domain code lost",
      { rawCode: raw?.code, rawMessage: (raw?.message ?? "").slice(0, 100) },
    );
    return err("INTERNAL", "internal error", 500);
  }

  console.error("[api/assignments] unhandled error", e);
  return err("INTERNAL", "internal error", 500);
}

function statusForAssignmentCode(code: AssignmentError["code"]): number {
  switch (code) {
    case "assignment_not_found":
      return 404;
    case "assignment_not_owned":
      return 403;
    case "assignment_not_published":
    case "assignment_closed":
    case "assignment_archived":
    case "assignment_immutable":
    case "assignment_invalid_transition":
    case "invalid_assignment_transition":
    case "audio_feedback_disabled":
      return 409;
    default:
      return 400;
  }
}

function statusForSubmissionCode(code: SubmissionError["code"]): number {
  switch (code) {
    case "submission_not_found":
      return 404;
    case "submission_not_owned":
    case "student_access_required":
    case "student_not_enrolled":
    case "child_not_in_circle":
    case "parent_not_authorized":
      return 403;
    case "submission_already_submitted":
    case "submission_immutable":
    case "invalid_submission_transition":
      return 409;
    case "submission_content_required":
    case "submission_too_long":
      return 400;
    default:
      return 400;
  }
}

function statusForFeedbackCode(code: FeedbackError["code"]): number {
  switch (code) {
    case "feedback_not_found":
      return 404;
    case "feedback_not_owned":
      return 403;
    case "feedback_already_published":
    case "feedback_immutable":
    case "feedback_addendum_required":
    case "feedback_invalid_transition":
    case "invalid_feedback_transition":
      return 409;
    default:
      return 400;
  }
}
