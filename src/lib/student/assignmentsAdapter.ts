// P4.5-B2b3b-b1 Student UI · adapter server-only pour les pages Student.
//
// Contrat strict (brief §3) ·
//  - server-only (jamais importable côté client)
//  - feature gate ASSIGNMENT_ENABLED exécuté EN PREMIER dans chaque fn
//  - délègue exclusivement aux services B1 (`src/lib/assignments/student.ts`)
//  - AUCUNE requête Prisma / Supabase ad hoc · toute projection sensible
//    passe par un service B1 qui a déjà appliqué le check enrollment/ownership
//  - convertit not_found/not_owned/access_denied en `null` (la page rend
//    `notFound()`)
//  - ne recrée jamais la logique d'enrollment ou d'ownership
//
// Les services B1 acceptent un TxClient · pour les server components on
// passe le client Prisma global (lecture seule côté adapter · toutes les
// mutations passent par les routes API POST/PATCH).

import "server-only";

import { prisma } from "@/lib/prisma";
import type { PrismaClient } from "@prisma/client";
import { isAssignmentsActive } from "@/lib/flags";
import type { StudentActor } from "@/lib/permissions/student";
import {
  listStudentAssignments,
  getStudentAssignment,
  getStudentSubmission,
  listStudentSubmissionsForAssignment,
  listStudentFeedback,
} from "@/lib/assignments/student";
import { AssignmentError, SubmissionError } from "@/lib/assignments/errors";
import type { AssignmentStatus, SubmissionStatus, FeedbackStatus } from "@prisma/client";

type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

function txClient(): TxClient {
  return prisma as unknown as TxClient;
}

/** brief §4.1 · liste assignments PUBLISHED/CLOSED du Student courant. */
export async function loadStudentAssignments(
  actor: StudentActor,
): Promise<StudentAssignmentListItem[] | null> {
  if (!isAssignmentsActive()) return null;
  try {
    const rows = await listStudentAssignments(txClient(), actor);
    return rows.map((r) => ({
      id: r.id,
      classroomId: r.classroomId,
      title: r.title,
      type: r.type,
      status: r.status,
      publishedAt: r.publishedAt,
      closedAt: r.closedAt,
      dueDate: r.dueDate,
    }));
  } catch (e) {
    if (e instanceof AssignmentError && e.code === "assignment_not_found") {
      return null;
    }
    throw e;
  }
}

/** brief §4.2 · détail assignment + versions du Student courant. */
export async function loadStudentAssignmentDetail(
  actor: StudentActor,
  assignmentId: string,
): Promise<StudentAssignmentDetailShape | null> {
  if (!isAssignmentsActive()) return null;
  try {
    const asm = await getStudentAssignment(txClient(), actor, assignmentId);
    if (!asm) return null;
    // B1 seam · aucun where { userId } / where { assignmentId } ad hoc ici ·
    // le service B1 applique le check enrollment actif + assignment PUBLISHED
    // /CLOSED avant de projeter les versions du Student courant.
    const submissions = await listStudentSubmissionsForAssignment(
      txClient(), actor, assignmentId,
    );
    return {
      id: asm.id,
      classroomId: asm.classroomId,
      title: asm.title,
      instructions: asm.instructions,
      type: asm.type,
      status: asm.status,
      publishedAt: asm.publishedAt,
      closedAt: asm.closedAt,
      dueDate: asm.dueDate,
      submissions: submissions.map((s) => ({
        id: s.id,
        status: s.status,
        version: s.version,
        writtenContent: s.writtenContent,
        submittedAt: s.submittedAt,
        withdrawnAt: s.withdrawnAt,
        updatedAt: s.updatedAt,
      })),
    };
  } catch (e) {
    if (e instanceof AssignmentError && e.code === "assignment_not_found") {
      return null;
    }
    throw e;
  }
}

/** brief §4.3 · détail submission + feedbacks PUBLISHED/ADDENDUM. */
export async function loadStudentSubmissionDetail(
  actor: StudentActor,
  submissionId: string,
): Promise<StudentSubmissionDetailShape | null> {
  if (!isAssignmentsActive()) return null;
  try {
    const sub = await getStudentSubmission(txClient(), actor, submissionId);
    // Feedbacks PUBLISHED+ADDENDUM uniquement · le service B1 applique le
    // filtre serveur (brief §4.3) · l'UI ne doit JAMAIS afficher un feedback
    // DRAFT.
    const feedbacks = await listStudentFeedback(txClient(), actor, submissionId);
    return {
      id: sub.id,
      assignmentId: sub.assignmentId,
      userId: sub.userId,
      status: sub.status,
      version: sub.version,
      writtenContent: sub.writtenContent,
      storageObjectId: sub.storageObjectId,
      submittedAt: sub.submittedAt,
      withdrawnAt: sub.withdrawnAt,
      updatedAt: sub.updatedAt,
      // Contexte assignment · vient de la projection B1 (loadOwnSubmission),
      // pas d'ad-hoc prisma.assignment.findUnique côté UI adapter.
      assignmentTitle: sub.assignment.title,
      assignmentStatus: sub.assignment.status,
      classroomId: sub.assignment.classroomId,
      feedbacks: feedbacks.map((f) => ({
        id: f.id,
        status: f.status as FeedbackStatus,
        version: f.version,
        writtenContent: f.writtenContent,
        supersedesFeedbackId: f.supersedesFeedbackId,
        publishedAt: f.publishedAt,
      })),
    };
  } catch (e) {
    if (
      (e instanceof AssignmentError && e.code === "assignment_not_found")
      || (e instanceof SubmissionError && e.code === "submission_not_found")
    ) {
      return null;
    }
    throw e;
  }
}

// ── Types de sortie · exposent uniquement les champs UI ────────────────

export interface StudentAssignmentListItem {
  id: string;
  classroomId: string;
  title: string;
  type: "WRITTEN" | "AUDIO" | "MIXED";
  status: AssignmentStatus;
  publishedAt: Date | null;
  closedAt: Date | null;
  dueDate: Date | null;
}

export interface StudentAssignmentVersion {
  id: string;
  status: SubmissionStatus;
  version: number;
  writtenContent: string | null;
  submittedAt: Date | null;
  withdrawnAt: Date | null;
  updatedAt: Date;
}

export interface StudentAssignmentDetailShape extends StudentAssignmentListItem {
  instructions: string | null;
  submissions: StudentAssignmentVersion[];
}

export interface StudentFeedbackItem {
  id: string;
  status: FeedbackStatus;
  version: number;
  writtenContent: string | null;
  supersedesFeedbackId: string | null;
  publishedAt: Date | null;
}

export interface StudentSubmissionDetailShape {
  id: string;
  assignmentId: string;
  userId: string;
  status: SubmissionStatus;
  version: number;
  writtenContent: string | null;
  storageObjectId: string | null;
  submittedAt: Date | null;
  withdrawnAt: Date | null;
  updatedAt: Date;
  assignmentTitle: string;
  assignmentStatus: AssignmentStatus;
  classroomId: string;
  feedbacks: StudentFeedbackItem[];
}
