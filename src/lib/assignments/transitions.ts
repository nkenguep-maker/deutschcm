// P4.5-B1 · transitions Monde (Assignment, Submission, Feedback).
//
// Pure functions · aucun accès DB. Utilisées par les services Teacher/Student
// pour valider une transition avant l'écriture in-tx. Chaque throw retourne
// un code stable exposable en HTTP 409 (`invalid_assignment_transition` etc.).
//
// Doctrine · l'immutabilité contenu après PUBLISHED/SUBMITTED est déjà
// contrainte côté DB par les triggers P4.5-A. Ces helpers valident
// uniquement le graphe d'états autorisé.

import type {
  AssignmentStatus,
  SubmissionStatus,
  FeedbackStatus,
} from "@prisma/client";
import {
  AssignmentError,
  SubmissionError,
  FeedbackError,
} from "@/lib/assignments/errors";

// ── Limites Monde (§6 brief P4.5-B) ────────────────────────────────────

export const MAX_MONDE_SUBMISSION_WORDS = 1000;

/**
 * Convention déterministe · même que P4.5-A Racines (split(/\s+/) trimmed).
 * Un mot = séquence non-vide entre séparateurs Unicode.
 */
export function countMondeSubmissionWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/u).length;
}

export function assertMondeSubmissionWordLimit(
  writtenContent: string | null | undefined,
): void {
  if (!writtenContent || writtenContent.trim().length === 0) {
    throw new SubmissionError(
      "submission_content_required",
      "writtenContent is required for text submission",
    );
  }
  const words = countMondeSubmissionWords(writtenContent);
  if (words > MAX_MONDE_SUBMISSION_WORDS) {
    throw new SubmissionError(
      "submission_too_long",
      `submission exceeds ${MAX_MONDE_SUBMISSION_WORDS} words`,
      { limit: MAX_MONDE_SUBMISSION_WORDS, attemptedCount: words },
    );
  }
}

// ── Assignment transitions ─────────────────────────────────────────────

const ASSIGNMENT_TRANSITIONS: Record<AssignmentStatus, AssignmentStatus[]> = {
  DRAFT: ["DRAFT", "PUBLISHED", "ARCHIVED"],
  PUBLISHED: ["PUBLISHED", "CLOSED", "ARCHIVED"],
  CLOSED: ["CLOSED", "ARCHIVED"],
  ARCHIVED: ["ARCHIVED"],
};

export function assertAssignmentTransition(
  from: AssignmentStatus,
  to: AssignmentStatus,
): void {
  const allowed = ASSIGNMENT_TRANSITIONS[from];
  if (!allowed || !allowed.includes(to)) {
    throw new AssignmentError(
      "invalid_assignment_transition",
      `invalid assignment transition ${from} → ${to}`,
      { from, to, allowed },
    );
  }
}

// ── Submission transitions ─────────────────────────────────────────────

const SUBMISSION_TRANSITIONS: Record<SubmissionStatus, SubmissionStatus[]> = {
  DRAFT: ["DRAFT", "SUBMITTED", "WITHDRAWN"],
  SUBMITTED: ["SUBMITTED", "WITHDRAWN", "SUPERSEDED"],
  WITHDRAWN: ["WITHDRAWN"],
  SUPERSEDED: ["SUPERSEDED"],
};

export function assertSubmissionTransition(
  from: SubmissionStatus,
  to: SubmissionStatus,
): void {
  const allowed = SUBMISSION_TRANSITIONS[from];
  if (!allowed || !allowed.includes(to)) {
    throw new SubmissionError(
      "invalid_submission_transition",
      `invalid submission transition ${from} → ${to}`,
      { from, to, allowed },
    );
  }
}

// ── Feedback transitions ───────────────────────────────────────────────
//
// PUBLISHED → RETRACTED_BY_ADMIN reste réservé au workflow break-glass
// YEMA_ADMIN futur. Pas de retour arrière DRAFT.

const FEEDBACK_TRANSITIONS: Record<FeedbackStatus, FeedbackStatus[]> = {
  DRAFT: ["DRAFT", "PUBLISHED"],
  PUBLISHED: ["PUBLISHED", "RETRACTED_BY_ADMIN"],
  ADDENDUM: ["ADDENDUM", "RETRACTED_BY_ADMIN"],
  RETRACTED_BY_ADMIN: ["RETRACTED_BY_ADMIN"],
};

export function assertFeedbackTransition(
  from: FeedbackStatus,
  to: FeedbackStatus,
): void {
  const allowed = FEEDBACK_TRANSITIONS[from];
  if (!allowed || !allowed.includes(to)) {
    throw new FeedbackError(
      "invalid_feedback_transition",
      `invalid feedback transition ${from} → ${to}`,
      { from, to, allowed },
    );
  }
}

// ── Guard audio P4.5-B (texte uniquement) ──────────────────────────────

/**
 * P4.5-B est texte uniquement (§5 brief). Rejette AUDIO/MIXED en création
 * d'assignment et rejette tout `storageObjectId` sur feedback/submission.
 */
export function assertMondeTextOnlyProductionType(
  productionType: "WRITTEN" | "AUDIO" | "MIXED",
): void {
  if (productionType !== "WRITTEN") {
    throw new AssignmentError(
      "audio_feedback_disabled",
      "audio and mixed production types are disabled in P4.5-B",
      { productionType, allowed: "WRITTEN" },
    );
  }
}

export function assertMondeTextOnlyFeedback(
  storageObjectId: string | null | undefined,
): void {
  if (storageObjectId != null) {
    throw new FeedbackError(
      "feedback_invalid_transition",
      "audio feedback is disabled in P4.5-B",
      { reason: "audio_feedback_disabled" },
    );
  }
}
