// P4.5-B1 · émission idempotente ROOTS/ASSIGNMENT-scoped access denied audits.
//
// Contrat · à appeler UNE seule fois par requête refusée, APRÈS que
// `withSerializableRetry` a échoué ou après l'échec métier définitif.
// Pattern miroir de `emitCoachCapacityAudit` (P4.4 closure).

import { AssignmentError, SubmissionError, FeedbackError } from "@/lib/assignments/errors";
import { writeAuditEvent } from "@/lib/audit/events";
import type { AuditAction } from "@prisma/client";

type AccessDeniedAction =
  | "ASSIGNMENT_ACCESS_DENIED"
  | "SUBMISSION_ACCESS_DENIED"
  | "FEEDBACK_ACCESS_DENIED";

type ChangeStateAction =
  | "ASSIGNMENT_CREATED"
  | "ASSIGNMENT_PUBLISHED"
  | "ASSIGNMENT_CLOSED"
  | "SUBMISSION_CREATED"
  | "SUBMISSION_SUBMITTED"
  | "SUBMISSION_WITHDRAWN"
  | "FEEDBACK_DRAFTED"
  | "FEEDBACK_PUBLISHED"
  | "FEEDBACK_ADDENDUM_CREATED";

/**
 * Émet un audit de refus (ASSIGNMENT/SUBMISSION/FEEDBACK_ACCESS_DENIED)
 * après un échec de résolution ou de permission. À appeler depuis le
 * `catch` du handler, une fois par requête refusée. Retourne une promesse
 * silencieuse · un échec d'écriture d'audit n'invalide pas la réponse.
 */
export async function emitAssignmentAccessDeniedAudit(input: {
  action: AccessDeniedAction;
  actorUserId: string | null;
  actorRole: string | null;
  targetType: string;
  targetId: string;
  scopeType?: string | null;
  scopeId?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    await writeAuditEvent({
      actorUserId: input.actorUserId,
      actorRole: input.actorRole,
      action: input.action as AuditAction,
      targetType: input.targetType,
      targetId: input.targetId,
      scopeType: input.scopeType ?? null,
      scopeId: input.scopeId ?? null,
      metadata: input.metadata ?? null,
    });
  } catch (e) {
    console.warn(
      `[audit] ${input.action} write failed:`,
      (e as Error).message,
    );
  }
}

/**
 * Décide automatiquement le bon `ASSIGNMENT_ACCESS_DENIED` /
 * `SUBMISSION_ACCESS_DENIED` / `FEEDBACK_ACCESS_DENIED` en fonction du
 * type d'erreur métier remontée par les services. Noop si l'erreur n'est
 * pas une AssignmentError/SubmissionError/FeedbackError access-scope.
 */
export async function emitAssignmentAuditFromError(input: {
  error: unknown;
  actorUserId: string | null;
  actorRole: string | null;
  scopeType?: string | null;
  scopeId?: string | null;
}): Promise<void> {
  const { error, actorUserId, actorRole, scopeType, scopeId } = input;
  if (error instanceof AssignmentError) {
    if (error.code === "assignment_not_found" || error.code === "assignment_not_owned") {
      await emitAssignmentAccessDeniedAudit({
        action: "ASSIGNMENT_ACCESS_DENIED",
        actorUserId, actorRole,
        targetType: "Assignment",
        targetId: (error.detail?.assignmentId as string | undefined) ?? "unknown",
        scopeType: scopeType ?? null, scopeId: scopeId ?? null,
        metadata: { reasonCode: error.code },
      });
    }
  } else if (error instanceof SubmissionError) {
    if (
      error.code === "submission_not_found" || error.code === "submission_not_owned"
      || error.code === "student_not_enrolled" || error.code === "parent_not_authorized"
    ) {
      await emitAssignmentAccessDeniedAudit({
        action: "SUBMISSION_ACCESS_DENIED",
        actorUserId, actorRole,
        targetType: "AssignmentSubmission",
        targetId: (error.detail?.submissionId as string | undefined) ?? "unknown",
        scopeType: scopeType ?? null, scopeId: scopeId ?? null,
        metadata: { reasonCode: error.code },
      });
    }
  } else if (error instanceof FeedbackError) {
    if (error.code === "feedback_not_found" || error.code === "feedback_not_owned") {
      await emitAssignmentAccessDeniedAudit({
        action: "FEEDBACK_ACCESS_DENIED",
        actorUserId, actorRole,
        targetType: "AssignmentFeedback",
        targetId: (error.detail?.feedbackId as string | undefined) ?? "unknown",
        scopeType: scopeType ?? null, scopeId: scopeId ?? null,
        metadata: { reasonCode: error.code },
      });
    }
  }
}

// Re-export for convenience.
export type { ChangeStateAction };
