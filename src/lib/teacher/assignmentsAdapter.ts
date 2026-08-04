// P4.5-B2b3b-a Gate UI Teacher · adapter server-only pour les pages
// Teacher UI. Réutilise EXACTEMENT le feature gate et les services
// P4.5-B1 · aucun where {teacherId} ad hoc, aucune deuxième logique
// d'autorisation. Toute la vérification ownership passe par les
// services `src/lib/assignments/teacher.ts`.
//
// Contrat ·
// - Chaque fonction commence par un feature-gate check dur.
// - Sinon, appelle un service B1 avec le TeacherActor résolu.
// - Retourne null si la ressource n'appartient pas au Teacher (le
//   service B1 throw AssignmentError, on catch et retourne null pour
//   que la page rende `notFound()`).
//
// Ce module n'est pas destiné au client (server-only).

import "server-only";

import { prisma } from "@/lib/prisma";
import type { PrismaClient } from "@prisma/client";
import { isAssignmentsActive, isTeacherWorkspaceActive } from "@/lib/flags";
import type { TeacherActor } from "@/lib/permissions/teacher";
import {
  listTeacherAssignments,
  getTeacherAssignment,
  listAssignmentSubmissions,
  getTeacherSubmission,
} from "@/lib/assignments/teacher";
import { AssignmentError, FeedbackError } from "@/lib/assignments/errors";
import type { AssignmentStatus, SubmissionStatus, FeedbackStatus } from "@prisma/client";

type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

function txClient(): TxClient {
  // Les services B1 acceptent un TxClient · pour les lectures serveur
  // (server components), on passe le client Prisma global. Aucune
  // écriture n'est faite depuis cet adapter.
  return prisma as unknown as TxClient;
}

/** Class 1 · lecture assignments d'une Classroom du Teacher courant. */
export async function loadTeacherAssignmentsForClassroom(
  actor: TeacherActor,
  classroomId: string,
): Promise<TeacherAssignmentListItem[] | null> {
  if (!isTeacherWorkspaceActive() || !isAssignmentsActive()) return null;
  try {
    const rows = await listTeacherAssignments(txClient(), actor, { classroomId });
    return rows.map((r) => ({
      id: r.id,
      classroomId: r.classroomId,
      title: r.title,
      type: r.type,
      status: r.status,
      publishedAt: r.publishedAt,
      closedAt: r.closedAt,
      dueDate: r.dueDate,
      updatedAt: r.updatedAt,
    }));
  } catch (e) {
    if (e instanceof AssignmentError && e.code === "assignment_not_owned") {
      return null;
    }
    throw e;
  }
}

/** Class 2 · lecture détail assignment · null si étranger ou inexistant. */
export async function loadTeacherAssignment(
  actor: TeacherActor,
  assignmentId: string,
): Promise<TeacherAssignmentDetailShape | null> {
  if (!isTeacherWorkspaceActive() || !isAssignmentsActive()) return null;
  try {
    const asm = await getTeacherAssignment(txClient(), actor, assignmentId);
    return {
      id: asm.id,
      classroomId: asm.classroomId,
      title: asm.title,
      instructions: asm.instructions,
      type: asm.type,
      status: asm.status,
      publishedAt: asm.publishedAt,
      closedAt: asm.closedAt,
      archivedAt: asm.archivedAt,
      dueDate: asm.dueDate,
      updatedAt: asm.updatedAt,
      createdByTeacherId: asm.createdByTeacherId,
    };
  } catch (e) {
    if (
      e instanceof AssignmentError
      && (e.code === "assignment_not_found" || e.code === "assignment_not_owned")
    ) {
      return null;
    }
    throw e;
  }
}

/** Class 3 · lecture submissions d'un assignment (projection minimale). */
export async function loadTeacherAssignmentSubmissions(
  actor: TeacherActor,
  assignmentId: string,
): Promise<TeacherSubmissionListItem[] | null> {
  if (!isTeacherWorkspaceActive() || !isAssignmentsActive()) return null;
  try {
    const rows = await listAssignmentSubmissions(txClient(), actor, assignmentId);
    // Le service B1 renvoie une projection minimale sans studentFullName.
    // Pour l'UI on complète via un select scoped par le service seam.
    if (rows.length === 0) return [];
    const ids = rows.map((r) => r.userId);
    const students = await prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, fullName: true },
    });
    const nameById = new Map(students.map((s) => [s.id, s.fullName]));
    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      status: r.status,
      version: r.version,
      submittedAt: r.submittedAt,
      withdrawnAt: r.withdrawnAt,
      updatedAt: r.updatedAt,
      studentFullName: nameById.get(r.userId) ?? "?",
    }));
  } catch (e) {
    if (
      e instanceof AssignmentError
      && (e.code === "assignment_not_found" || e.code === "assignment_not_owned")
    ) {
      return null;
    }
    throw e;
  }
}

/** Class 4 · lecture détail submission avec ses feedbacks. */
export async function loadTeacherSubmissionDetail(
  actor: TeacherActor,
  submissionId: string,
): Promise<TeacherSubmissionDetailShape | null> {
  if (!isTeacherWorkspaceActive() || !isAssignmentsActive()) return null;
  try {
    const sub = await getTeacherSubmission(txClient(), actor, submissionId);
    // Charger le student et les feedbacks via projections minimales.
    // Le service B1 ne renvoie pas déjà tout · complète ici.
    const [student, feedbacks] = await Promise.all([
      prisma.user.findUnique({
        where: { id: sub.userId },
        select: { fullName: true },
      }),
      prisma.assignmentFeedback.findMany({
        where: { submissionId: sub.id },
        select: {
          id: true, status: true, version: true, writtenContent: true,
          supersedesFeedbackId: true, publishedAt: true, createdAt: true,
        },
        orderBy: { version: "asc" },
      }),
    ]);
    return {
      id: sub.id,
      userId: sub.userId,
      assignmentId: sub.assignmentId,
      status: sub.status,
      version: sub.version,
      writtenContent: sub.writtenContent,
      storageObjectId: sub.storageObjectId,
      submittedAt: sub.submittedAt,
      withdrawnAt: sub.withdrawnAt,
      updatedAt: sub.updatedAt,
      assignmentTitle: sub.assignment.title,
      classroomId: sub.assignment.classroomId,
      studentFullName: student?.fullName ?? "?",
      feedbacks,
    };
  } catch (e) {
    if (
      (e instanceof AssignmentError
        && (e.code === "assignment_not_found" || e.code === "assignment_not_owned"))
      || (e instanceof FeedbackError && e.code === "feedback_not_found")
    ) {
      return null;
    }
    throw e;
  }
}

// ── Types de sortie · exposent uniquement les champs UI ────────────────

export interface TeacherAssignmentListItem {
  id: string;
  classroomId: string;
  title: string;
  type: "WRITTEN" | "AUDIO" | "MIXED";
  status: AssignmentStatus;
  publishedAt: Date | null;
  closedAt: Date | null;
  dueDate: Date | null;
  updatedAt: Date;
}

export interface TeacherAssignmentDetailShape extends TeacherAssignmentListItem {
  instructions: string | null;
  archivedAt: Date | null;
  createdByTeacherId: string | null;
}

export interface TeacherSubmissionListItem {
  id: string;
  userId: string;
  status: SubmissionStatus;
  version: number;
  submittedAt: Date | null;
  withdrawnAt: Date | null;
  updatedAt: Date;
  studentFullName: string;
}

export interface TeacherSubmissionDetailShape {
  id: string;
  userId: string;
  assignmentId: string;
  status: SubmissionStatus;
  version: number;
  writtenContent: string | null;
  storageObjectId: string | null;
  submittedAt: Date | null;
  withdrawnAt: Date | null;
  updatedAt: Date;
  assignmentTitle: string;
  classroomId: string;
  studentFullName: string;
  feedbacks: {
    id: string;
    status: FeedbackStatus;
    version: number;
    writtenContent: string | null;
    supersedesFeedbackId: string | null;
    publishedAt: Date | null;
    createdAt: Date;
  }[];
}
