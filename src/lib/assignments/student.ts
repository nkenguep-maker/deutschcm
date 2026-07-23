// P4.5-B1 · services Assignment Student (Monde V2).
//
// Doctrine · même patterns que teacher.ts · tx client explicit, audits in-tx
// pour changements d'état, projections minimales, jamais de client-side
// authority (assignmentId/classroomId toujours vérifiés contre enrollment).
//
// P4.5-B est texte uniquement · aucun `storageObjectId` accepté ici, aucune
// piste audio.

import type { PrismaClient, Prisma } from "@prisma/client";
import { AssignmentError, SubmissionError } from "@/lib/assignments/errors";
import { writeAuditEvent } from "@/lib/audit/events";
import {
  assertMondeSubmissionWordLimit,
  assertSubmissionTransition,
} from "@/lib/assignments/transitions";

type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export interface StudentActor {
  userId: string;
}

// ── Assignment lecture Student ─────────────────────────────────────────

async function assertStudentCanAccessAssignment(
  tx: TxClient,
  assignmentId: string,
  studentUserId: string,
): Promise<{ classroomId: string; status: string }> {
  const asm = await tx.assignment.findFirst({
    where: {
      id: assignmentId,
      status: { in: ["PUBLISHED", "CLOSED"] },
      classroom: {
        isActive: true,
        enrollments: { some: { userId: studentUserId, isActive: true } },
      },
    },
    select: { id: true, classroomId: true, status: true },
  });
  if (!asm) {
    throw new AssignmentError(
      "assignment_not_found",
      "assignment not accessible for this student",
    );
  }
  return { classroomId: asm.classroomId, status: asm.status };
}

export async function listStudentAssignments(
  tx: TxClient,
  actor: StudentActor,
) {
  return tx.assignment.findMany({
    where: {
      status: { in: ["PUBLISHED", "CLOSED"] },
      classroom: {
        isActive: true,
        enrollments: { some: { userId: actor.userId, isActive: true } },
      },
    },
    select: {
      id: true, classroomId: true, title: true, type: true, status: true,
      publishedAt: true, closedAt: true, dueDate: true,
    },
    orderBy: [{ status: "asc" }, { publishedAt: "desc" }],
  });
}

export async function getStudentAssignment(
  tx: TxClient,
  actor: StudentActor,
  assignmentId: string,
) {
  await assertStudentCanAccessAssignment(tx, assignmentId, actor.userId);
  return tx.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true, classroomId: true, title: true, instructions: true,
      type: true, status: true, publishedAt: true, closedAt: true, dueDate: true,
    },
  });
}

// ── Submissions Student ────────────────────────────────────────────────

async function loadOwnSubmission(
  tx: TxClient,
  submissionId: string,
  studentUserId: string,
) {
  const sub = await tx.assignmentSubmission.findFirst({
    where: { id: submissionId, userId: studentUserId },
    select: {
      id: true, assignmentId: true, userId: true, status: true, version: true,
      writtenContent: true, storageObjectId: true, submittedAt: true,
      withdrawnAt: true, updatedAt: true,
    },
  });
  if (!sub) {
    throw new SubmissionError(
      "submission_not_found",
      "submission not found or not owned by this student",
    );
  }
  return sub;
}

export async function getStudentSubmission(
  tx: TxClient,
  actor: StudentActor,
  submissionId: string,
) {
  return loadOwnSubmission(tx, submissionId, actor.userId);
}

export async function createStudentSubmissionDraft(
  tx: TxClient,
  actor: StudentActor,
  input: { assignmentId: string; writtenContent: string },
) {
  const asm = await assertStudentCanAccessAssignment(tx, input.assignmentId, actor.userId);
  if (asm.status !== "PUBLISHED") {
    throw new AssignmentError(
      "assignment_closed",
      "cannot submit to a closed assignment",
    );
  }
  assertMondeSubmissionWordLimit(input.writtenContent);
  const existing = await tx.assignmentSubmission.findFirst({
    where: {
      assignmentId: input.assignmentId,
      userId: actor.userId,
      status: "DRAFT",
    },
    select: { id: true },
  });
  if (existing) {
    throw new SubmissionError(
      "submission_already_submitted",
      "an active DRAFT already exists for this assignment",
      { existingSubmissionId: existing.id },
    );
  }
  const nextVersion = await computeNextVersion(tx, input.assignmentId, actor.userId);
  const created = await tx.assignmentSubmission.create({
    data: {
      assignmentId: input.assignmentId,
      userId: actor.userId,
      writtenContent: input.writtenContent.trim(),
      status: "DRAFT",
      version: nextVersion,
    },
    select: { id: true, assignmentId: true, status: true, version: true },
  });
  await writeAuditEvent(
    {
      actorUserId: actor.userId, actorRole: "STUDENT",
      action: "SUBMISSION_CREATED",
      targetType: "AssignmentSubmission", targetId: created.id,
      scopeType: "Assignment", scopeId: input.assignmentId,
      metadata: { classroomId: asm.classroomId, version: nextVersion, routeAction: "createSubmissionDraft" },
    },
    tx,
  );
  return created;
}

export async function updateStudentSubmissionDraft(
  tx: TxClient,
  actor: StudentActor,
  submissionId: string,
  input: { writtenContent: string },
) {
  const sub = await loadOwnSubmission(tx, submissionId, actor.userId);
  if (sub.status !== "DRAFT") {
    throw new SubmissionError(
      "submission_immutable",
      "only DRAFT submissions can be updated in place",
      { currentStatus: sub.status },
    );
  }
  assertMondeSubmissionWordLimit(input.writtenContent);
  const updated = await tx.assignmentSubmission.update({
    where: { id: submissionId },
    data: { writtenContent: input.writtenContent.trim() },
    select: { id: true, status: true, version: true },
  });
  return updated;
}

export async function submitStudentSubmission(
  tx: TxClient,
  actor: StudentActor,
  submissionId: string,
) {
  const sub = await loadOwnSubmission(tx, submissionId, actor.userId);
  assertSubmissionTransition(sub.status, "SUBMITTED");
  if (!sub.writtenContent || sub.writtenContent.trim().length === 0) {
    throw new SubmissionError(
      "submission_content_required",
      "writtenContent is required before submit",
    );
  }
  assertMondeSubmissionWordLimit(sub.writtenContent);
  // Assignment must still be PUBLISHED (not CLOSED between draft and submit).
  const asm = await tx.assignment.findUnique({
    where: { id: sub.assignmentId },
    select: { id: true, classroomId: true, status: true },
  });
  if (!asm || asm.status !== "PUBLISHED") {
    throw new AssignmentError(
      "assignment_closed",
      "assignment is no longer open for submissions",
      { currentStatus: asm?.status },
    );
  }
  const now = new Date();
  const updated = await tx.assignmentSubmission.update({
    where: { id: submissionId, status: sub.status },
    data: { status: "SUBMITTED", submittedAt: now },
    select: { id: true, assignmentId: true, status: true, version: true, submittedAt: true },
  });
  await writeAuditEvent(
    {
      actorUserId: actor.userId, actorRole: "STUDENT",
      action: "SUBMISSION_SUBMITTED",
      targetType: "AssignmentSubmission", targetId: submissionId,
      scopeType: "Assignment", scopeId: sub.assignmentId,
      metadata: {
        classroomId: asm.classroomId, version: sub.version,
        routeAction: "submitSubmission",
      },
    },
    tx,
  );
  return updated;
}

async function computeNextVersion(
  tx: TxClient,
  assignmentId: string,
  userId: string,
): Promise<number> {
  const latest = await tx.assignmentSubmission.findFirst({
    where: { assignmentId, userId },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  return (latest?.version ?? 0) + 1;
}

/**
 * Crée une nouvelle version après un SUBMITTED précédent. Marque
 * l'ancienne SUPERSEDED (transition non-destructive · trigger DB autorise
 * SUBMITTED→SUPERSEDED). Nouvelle ligne = DRAFT.
 */
export async function createStudentSubmissionVersion(
  tx: TxClient,
  actor: StudentActor,
  input: { assignmentId: string; writtenContent: string },
) {
  const asm = await assertStudentCanAccessAssignment(tx, input.assignmentId, actor.userId);
  if (asm.status !== "PUBLISHED") {
    throw new AssignmentError(
      "assignment_closed",
      "cannot create new version on closed assignment",
    );
  }
  assertMondeSubmissionWordLimit(input.writtenContent);
  // Fetch the latest active submission for this student · must be SUBMITTED
  // to allow a new version. If DRAFT exists, use updateStudentSubmissionDraft.
  const latest = await tx.assignmentSubmission.findFirst({
    where: { assignmentId: input.assignmentId, userId: actor.userId },
    orderBy: { version: "desc" },
    select: { id: true, status: true, version: true },
  });
  if (!latest) {
    throw new SubmissionError(
      "submission_invalid_transition",
      "no previous submission to base a new version on",
    );
  }
  if (latest.status === "DRAFT") {
    throw new SubmissionError(
      "submission_already_submitted",
      "a DRAFT already exists · update it instead of creating a new version",
      { existingSubmissionId: latest.id },
    );
  }
  if (latest.status !== "SUBMITTED") {
    throw new SubmissionError(
      "submission_invalid_transition",
      "new version can only follow a SUBMITTED submission",
      { currentStatus: latest.status },
    );
  }
  // Mark previous as SUPERSEDED first.
  await tx.assignmentSubmission.update({
    where: { id: latest.id, status: "SUBMITTED" },
    data: { status: "SUPERSEDED" },
  });
  const created = await tx.assignmentSubmission.create({
    data: {
      assignmentId: input.assignmentId,
      userId: actor.userId,
      writtenContent: input.writtenContent.trim(),
      status: "DRAFT",
      version: latest.version + 1,
    },
    select: { id: true, assignmentId: true, status: true, version: true },
  });
  await writeAuditEvent(
    {
      actorUserId: actor.userId, actorRole: "STUDENT",
      action: "SUBMISSION_CREATED",
      targetType: "AssignmentSubmission", targetId: created.id,
      scopeType: "Assignment", scopeId: input.assignmentId,
      metadata: {
        classroomId: asm.classroomId,
        version: created.version,
        supersededSubmissionId: latest.id,
        routeAction: "createSubmissionVersion",
      },
    },
    tx,
  );
  return created;
}

// ── Feedback lecture Student (PUBLISHED uniquement) ────────────────────

export async function listStudentFeedback(
  tx: TxClient,
  actor: StudentActor,
  submissionId: string,
) {
  const sub = await loadOwnSubmission(tx, submissionId, actor.userId);
  return tx.assignmentFeedback.findMany({
    where: {
      submissionId: sub.id,
      status: { in: ["PUBLISHED", "ADDENDUM"] },
    },
    select: {
      id: true, submissionId: true, status: true, version: true,
      supersedesFeedbackId: true, writtenContent: true, publishedAt: true,
    },
    orderBy: { version: "asc" },
  });
}
