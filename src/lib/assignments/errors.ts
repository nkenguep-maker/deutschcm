// P4.5-A · erreurs métier assignments/submissions/feedback (Monde + Racines).
//
// Doctrine · chaque code retourne un HTTP stable via `mapErrorToResponse`
// (à câbler avec les routes en P4.5-B/C). Aucun code Prisma / Postgres n'est
// jamais exposé · brief §17.

export class AssignmentError extends Error {
  constructor(
    public readonly code:
      | "assignment_not_found"
      | "assignment_not_owned"
      | "assignment_not_published"
      | "assignment_closed"
      | "assignment_archived"
      | "assignment_immutable"
      | "assignment_invalid_transition"
      | "invalid_assignment_transition"
      | "audio_feedback_disabled",
    message: string,
    public readonly detail?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AssignmentError";
  }
}

export class SubmissionError extends Error {
  constructor(
    public readonly code:
      | "submission_not_found"
      | "submission_already_submitted"
      | "submission_content_required"
      | "submission_too_long"
      | "submission_not_owned"
      | "submission_immutable"
      | "invalid_submission_transition"
      | "student_access_required"
      | "student_not_enrolled"
      | "child_not_in_circle"
      | "parent_not_authorized",
    message: string,
    public readonly detail?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "SubmissionError";
  }
}

export class FeedbackError extends Error {
  constructor(
    public readonly code:
      | "feedback_not_found"
      | "feedback_already_published"
      | "feedback_immutable"
      | "feedback_addendum_required"
      | "feedback_not_owned"
      | "feedback_invalid_transition"
      | "invalid_feedback_transition",
    message: string,
    public readonly detail?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "FeedbackError";
  }
}

export class StorageOwnershipError extends Error {
  constructor(
    public readonly code:
      | "storage_object_not_owned"
      | "storage_object_invalid",
    message: string,
    public readonly detail?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "StorageOwnershipError";
  }
}

export class WorkspaceAccessError extends Error {
  constructor(
    public readonly code:
      | "teacher_access_required"
      | "roots_coach_access_required",
    message: string,
  ) {
    super(message);
    this.name = "WorkspaceAccessError";
  }
}

/**
 * Codes d'erreur stables P4.5, exposés dans les réponses HTTP 409/403/404
 * avec le status déterminé par le mapper. Ne JAMAIS retourner un code
 * Prisma (`P2002`, `P2034`, etc.) ni une chaîne Postgres (`40001`,
 * `TransactionWriteConflict`) au client.
 */
export const P4_5_STABLE_ERROR_CODES = [
  // Assignment
  "assignment_not_found",
  "assignment_not_owned",
  "assignment_not_published",
  "assignment_closed",
  "assignment_archived",
  "assignment_immutable",
  "assignment_invalid_transition",
  "invalid_assignment_transition",
  "audio_feedback_disabled",
  // Submission
  "submission_not_found",
  "submission_already_submitted",
  "submission_content_required",
  "submission_too_long",
  "submission_not_owned",
  "submission_immutable",
  "invalid_submission_transition",
  "student_access_required",
  "student_not_enrolled",
  "child_not_in_circle",
  "parent_not_authorized",
  // Feedback
  "feedback_not_found",
  "feedback_already_published",
  "feedback_immutable",
  "feedback_addendum_required",
  "feedback_not_owned",
  "feedback_invalid_transition",
  "invalid_feedback_transition",
  // Storage
  "storage_object_not_owned",
  "storage_object_invalid",
  // Workspace
  "teacher_access_required",
  "roots_coach_access_required",
  // Capacity (Racines quotas)
  "roots_weekly_production_limit_reached",
  "roots_monthly_production_limit_reached",
  "written_production_too_long",
  "audio_production_too_long",
  "invalid_production_format",
  // Concurrency (via ConcurrentUpdateError)
  "concurrent_assignment_update",
  "concurrent_submission_update",
  "concurrent_feedback_update",
] as const;

export type P4_5StableErrorCode = (typeof P4_5_STABLE_ERROR_CODES)[number];
