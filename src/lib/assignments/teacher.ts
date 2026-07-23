// P4.5-B1 · services Assignment Teacher (Monde V2).
//
// Doctrine ·
//   - Chaque fonction prend un `TxClient` explicite · les mutations doivent
//     être appelées dans `prisma.$transaction({ isolationLevel: "Serializable" })`
//     enveloppée dans `withSerializableRetry(..., { errorCode: "concurrent_assignment_update" })`
//     côté route.
//   - Les AuditEvents de changement d'état sont écrits DANS la même tx
//     (`writeAuditEvent(payload, tx)` · pattern P4.4 closure).
//   - Aucune projection privée (email/phone/fullName) n'est jamais renvoyée
//     · sélections minimales explicites.
//   - Aucun `storageObjectId` accepté en P4.5-B (texte uniquement).

import type { PrismaClient, Prisma, AssignmentStatus, FeedbackStatus } from "@prisma/client";
import { AssignmentError, FeedbackError } from "@/lib/assignments/errors";
import { writeAuditEvent } from "@/lib/audit/events";
import {
  assertAssignmentTransition,
  assertFeedbackTransition,
  assertMondeTextOnlyFeedback,
  assertMondeTextOnlyProductionType,
} from "@/lib/assignments/transitions";

type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export interface TeacherActor {
  userId: string;
  teacherId: string;
}

// ── Assignment · CRUD Teacher ──────────────────────────────────────────

/**
 * Assert Teacher possède la Classroom cible. Ne charge que l'id, minimise
 * la fuite. `assignment_not_owned` si la classroom n'est pas la sienne
 * OU n'existe pas (404-like via 403).
 */
async function assertTeacherOwnsClassroom(
  tx: TxClient,
  classroomId: string,
  teacherId: string,
): Promise<void> {
  const found = await tx.classroom.findFirst({
    where: { id: classroomId, teacherId },
    select: { id: true, isActive: true },
  });
  if (!found) {
    throw new AssignmentError(
      "assignment_not_owned",
      "teacher does not own this classroom",
    );
  }
}

async function loadTeacherAssignment(
  tx: TxClient,
  assignmentId: string,
  teacherId: string,
) {
  const asm = await tx.assignment.findFirst({
    where: { id: assignmentId, classroom: { teacherId } },
    select: {
      id: true, classroomId: true, title: true, instructions: true,
      type: true, status: true, publishedAt: true, closedAt: true,
      archivedAt: true, createdByTeacherId: true, createdAt: true,
      updatedAt: true, dueDate: true,
    },
  });
  if (!asm) {
    throw new AssignmentError(
      "assignment_not_found",
      "assignment not found or not owned by this teacher",
    );
  }
  return asm;
}

export async function listTeacherAssignments(
  tx: TxClient,
  actor: TeacherActor,
  filter?: { classroomId?: string; status?: AssignmentStatus },
) {
  return tx.assignment.findMany({
    where: {
      classroom: { teacherId: actor.teacherId },
      ...(filter?.classroomId ? { classroomId: filter.classroomId } : {}),
      ...(filter?.status ? { status: filter.status } : {}),
    },
    select: {
      id: true, classroomId: true, title: true, type: true, status: true,
      publishedAt: true, closedAt: true, createdAt: true, updatedAt: true,
      dueDate: true,
    },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });
}

export async function getTeacherAssignment(
  tx: TxClient,
  actor: TeacherActor,
  assignmentId: string,
) {
  return loadTeacherAssignment(tx, assignmentId, actor.teacherId);
}

export interface CreateAssignmentInput {
  classroomId: string;
  title: string;
  instructions?: string | null;
  dueAt?: Date | null;
  productionType?: "WRITTEN" | "AUDIO" | "MIXED";
}

export async function createTeacherAssignmentDraft(
  tx: TxClient,
  actor: TeacherActor,
  input: CreateAssignmentInput,
) {
  await assertTeacherOwnsClassroom(tx, input.classroomId, actor.teacherId);
  assertMondeTextOnlyProductionType(input.productionType ?? "WRITTEN");
  const title = input.title?.trim();
  if (!title || title.length === 0 || title.length > 200) {
    throw new AssignmentError(
      "assignment_invalid_transition",
      "title is required and must be 1..200 chars",
    );
  }
  const created = await tx.assignment.create({
    data: {
      classroomId: input.classroomId,
      title,
      instructions: input.instructions ?? null,
      dueDate: input.dueAt ?? null,
      type: "WRITTEN",
      status: "DRAFT",
      createdByTeacherId: actor.teacherId,
    },
    select: { id: true, classroomId: true, status: true, title: true },
  });
  await writeAuditEvent(
    {
      actorUserId: actor.userId, actorRole: "TEACHER",
      action: "ASSIGNMENT_CREATED",
      targetType: "Assignment", targetId: created.id,
      scopeType: "Classroom", scopeId: input.classroomId,
      metadata: { classroomId: input.classroomId, teacherId: actor.teacherId, routeAction: "createAssignmentDraft" },
    },
    tx,
  );
  return created;
}

export interface UpdateAssignmentDraftInput {
  title?: string;
  instructions?: string | null;
  dueAt?: Date | null;
}

export async function updateTeacherAssignmentDraft(
  tx: TxClient,
  actor: TeacherActor,
  assignmentId: string,
  input: UpdateAssignmentDraftInput,
) {
  const existing = await loadTeacherAssignment(tx, assignmentId, actor.teacherId);
  if (existing.status !== "DRAFT") {
    throw new AssignmentError(
      "assignment_immutable",
      "only DRAFT assignments can be modified in place",
      { currentStatus: existing.status },
    );
  }
  const patch: Prisma.AssignmentUpdateInput = {};
  if (typeof input.title === "string") {
    const t = input.title.trim();
    if (!t || t.length > 200) {
      throw new AssignmentError(
        "assignment_invalid_transition",
        "title must be 1..200 chars",
      );
    }
    patch.title = t;
  }
  if (input.instructions !== undefined) patch.instructions = input.instructions;
  if (input.dueAt !== undefined) patch.dueDate = input.dueAt;
  const updated = await tx.assignment.update({
    where: { id: assignmentId },
    data: patch,
    select: { id: true, classroomId: true, status: true, title: true },
  });
  return updated;
}

export async function publishTeacherAssignment(
  tx: TxClient,
  actor: TeacherActor,
  assignmentId: string,
) {
  const existing = await loadTeacherAssignment(tx, assignmentId, actor.teacherId);
  assertAssignmentTransition(existing.status, "PUBLISHED");
  if (!existing.title || existing.title.trim().length === 0) {
    throw new AssignmentError(
      "assignment_invalid_transition",
      "cannot publish without title",
    );
  }
  const now = new Date();
  const updated = await tx.assignment.update({
    where: { id: assignmentId, status: existing.status },
    data: { status: "PUBLISHED", publishedAt: now },
    select: { id: true, classroomId: true, status: true, publishedAt: true },
  });
  await writeAuditEvent(
    {
      actorUserId: actor.userId, actorRole: "TEACHER",
      action: "ASSIGNMENT_PUBLISHED",
      targetType: "Assignment", targetId: assignmentId,
      scopeType: "Classroom", scopeId: existing.classroomId,
      metadata: { teacherId: actor.teacherId, routeAction: "publishAssignment" },
    },
    tx,
  );
  return updated;
}

export async function closeTeacherAssignment(
  tx: TxClient,
  actor: TeacherActor,
  assignmentId: string,
) {
  const existing = await loadTeacherAssignment(tx, assignmentId, actor.teacherId);
  assertAssignmentTransition(existing.status, "CLOSED");
  const now = new Date();
  const updated = await tx.assignment.update({
    where: { id: assignmentId, status: existing.status },
    data: { status: "CLOSED", closedAt: now },
    select: { id: true, classroomId: true, status: true, closedAt: true },
  });
  await writeAuditEvent(
    {
      actorUserId: actor.userId, actorRole: "TEACHER",
      action: "ASSIGNMENT_CLOSED",
      targetType: "Assignment", targetId: assignmentId,
      scopeType: "Classroom", scopeId: existing.classroomId,
      metadata: { teacherId: actor.teacherId, routeAction: "closeAssignment" },
    },
    tx,
  );
  return updated;
}

// ── Submissions · Teacher lecture ──────────────────────────────────────

export async function listAssignmentSubmissions(
  tx: TxClient,
  actor: TeacherActor,
  assignmentId: string,
) {
  const asm = await loadTeacherAssignment(tx, assignmentId, actor.teacherId);
  return tx.assignmentSubmission.findMany({
    where: { assignmentId: asm.id },
    select: {
      id: true, assignmentId: true, userId: true, status: true, version: true,
      submittedAt: true, withdrawnAt: true, updatedAt: true,
      // writtenContent NON exposé côté liste (payload lourd) · à charger via getTeacherSubmission.
    },
    orderBy: [{ status: "asc" }, { version: "desc" }, { submittedAt: "desc" }],
  });
}

export async function getTeacherSubmission(
  tx: TxClient,
  actor: TeacherActor,
  submissionId: string,
) {
  const sub = await tx.assignmentSubmission.findFirst({
    where: {
      id: submissionId,
      assignment: { classroom: { teacherId: actor.teacherId } },
    },
    select: {
      id: true, assignmentId: true, userId: true, status: true, version: true,
      writtenContent: true, storageObjectId: true, submittedAt: true,
      withdrawnAt: true, updatedAt: true,
      assignment: { select: { id: true, classroomId: true, status: true, title: true } },
    },
  });
  if (!sub) {
    // Fire post-échec unique (route caller devra émettre SUBMISSION_ACCESS_DENIED).
    throw new AssignmentError(
      "assignment_not_owned",
      "submission not found or not owned by this teacher",
    );
  }
  return sub;
}

// ── Feedback · Teacher CRUD ────────────────────────────────────────────

export interface CreateFeedbackDraftInput {
  submissionId: string;
  writtenContent: string;
}

async function loadFeedbackForTeacher(
  tx: TxClient,
  feedbackId: string,
  actor: TeacherActor,
) {
  const fb = await tx.assignmentFeedback.findFirst({
    where: {
      id: feedbackId,
      authorTeacherId: actor.teacherId,
    },
    select: {
      id: true, submissionId: true, authorTeacherId: true, status: true,
      version: true, supersedesFeedbackId: true, writtenContent: true,
      storageObjectId: true, publishedAt: true, createdAt: true, updatedAt: true,
    },
  });
  if (!fb) {
    throw new FeedbackError(
      "feedback_not_found",
      "feedback not found or not owned by this teacher",
    );
  }
  return fb;
}

export async function createAssignmentFeedbackDraft(
  tx: TxClient,
  actor: TeacherActor,
  input: CreateFeedbackDraftInput,
) {
  const sub = await tx.assignmentSubmission.findFirst({
    where: {
      id: input.submissionId,
      assignment: { classroom: { teacherId: actor.teacherId } },
    },
    select: { id: true, status: true, assignmentId: true, userId: true },
  });
  if (!sub) {
    throw new AssignmentError(
      "assignment_not_owned",
      "submission not owned by this teacher",
    );
  }
  if (sub.status !== "SUBMITTED") {
    throw new FeedbackError(
      "feedback_invalid_transition",
      "feedback can only be drafted for SUBMITTED submissions",
      { submissionStatus: sub.status },
    );
  }
  const written = input.writtenContent?.trim();
  if (!written || written.length === 0) {
    throw new FeedbackError(
      "feedback_addendum_required",
      "writtenContent is required for feedback",
    );
  }
  const fb = await tx.assignmentFeedback.create({
    data: {
      submissionId: input.submissionId,
      authorTeacherId: actor.teacherId,
      status: "DRAFT",
      version: 1,
      writtenContent: written,
    },
    select: { id: true, submissionId: true, status: true, version: true },
  });
  await writeAuditEvent(
    {
      actorUserId: actor.userId, actorRole: "TEACHER",
      action: "FEEDBACK_DRAFTED",
      targetType: "AssignmentFeedback", targetId: fb.id,
      scopeType: "AssignmentSubmission", scopeId: sub.id,
      metadata: { teacherId: actor.teacherId, assignmentId: sub.assignmentId, routeAction: "createFeedbackDraft" },
    },
    tx,
  );
  return fb;
}

export async function updateAssignmentFeedbackDraft(
  tx: TxClient,
  actor: TeacherActor,
  feedbackId: string,
  input: { writtenContent?: string },
) {
  const fb = await loadFeedbackForTeacher(tx, feedbackId, actor);
  if (fb.status !== "DRAFT") {
    throw new FeedbackError(
      "feedback_immutable",
      "only DRAFT feedback can be modified in place",
      { currentStatus: fb.status },
    );
  }
  const patch: Prisma.AssignmentFeedbackUpdateInput = {};
  if (input.writtenContent !== undefined) {
    const w = input.writtenContent.trim();
    if (!w || w.length === 0) {
      throw new FeedbackError(
        "feedback_addendum_required",
        "writtenContent cannot be empty",
      );
    }
    patch.writtenContent = w;
  }
  const updated = await tx.assignmentFeedback.update({
    where: { id: feedbackId },
    data: patch,
    select: { id: true, status: true, version: true },
  });
  return updated;
}

export async function publishAssignmentFeedback(
  tx: TxClient,
  actor: TeacherActor,
  feedbackId: string,
) {
  const fb = await loadFeedbackForTeacher(tx, feedbackId, actor);
  assertFeedbackTransition(fb.status, "PUBLISHED");
  if (!fb.writtenContent || fb.writtenContent.trim().length === 0) {
    throw new FeedbackError(
      "feedback_addendum_required",
      "cannot publish empty feedback",
    );
  }
  assertMondeTextOnlyFeedback(fb.storageObjectId);
  const now = new Date();
  const updated = await tx.assignmentFeedback.update({
    where: { id: feedbackId, status: fb.status },
    data: { status: "PUBLISHED", publishedAt: now },
    select: { id: true, submissionId: true, status: true, version: true, publishedAt: true },
  });
  await writeAuditEvent(
    {
      actorUserId: actor.userId, actorRole: "TEACHER",
      action: "FEEDBACK_PUBLISHED",
      targetType: "AssignmentFeedback", targetId: feedbackId,
      scopeType: "AssignmentSubmission", scopeId: fb.submissionId,
      metadata: { teacherId: actor.teacherId, routeAction: "publishFeedback" },
    },
    tx,
  );
  return updated;
}

export async function createAssignmentFeedbackAddendum(
  tx: TxClient,
  actor: TeacherActor,
  input: { previousFeedbackId: string; writtenContent: string },
) {
  const prev = await loadFeedbackForTeacher(tx, input.previousFeedbackId, actor);
  if (prev.status !== "PUBLISHED") {
    throw new FeedbackError(
      "feedback_addendum_required",
      "addendum can only be created on PUBLISHED feedback",
      { currentStatus: prev.status },
    );
  }
  const written = input.writtenContent?.trim();
  if (!written || written.length === 0) {
    throw new FeedbackError(
      "feedback_addendum_required",
      "writtenContent is required for addendum",
    );
  }
  const now = new Date();
  const addendum = await tx.assignmentFeedback.create({
    data: {
      submissionId: prev.submissionId,
      authorTeacherId: actor.teacherId,
      status: "ADDENDUM",
      version: prev.version + 1,
      supersedesFeedbackId: prev.id,
      writtenContent: written,
      publishedAt: now,
    },
    select: {
      id: true, submissionId: true, status: true, version: true,
      supersedesFeedbackId: true, publishedAt: true,
    },
  });
  await writeAuditEvent(
    {
      actorUserId: actor.userId, actorRole: "TEACHER",
      action: "FEEDBACK_ADDENDUM_CREATED",
      targetType: "AssignmentFeedback", targetId: addendum.id,
      scopeType: "AssignmentSubmission", scopeId: prev.submissionId,
      metadata: {
        teacherId: actor.teacherId,
        supersedesFeedbackId: prev.id,
        version: addendum.version,
        routeAction: "createFeedbackAddendum",
      },
    },
    tx,
  );
  return addendum;
}
