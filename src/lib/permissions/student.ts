// P4.5-B1 · résolution serveur "Student courant" pour l'utilisateur authentifié.
//
// Source de vérité · un étudiant Monde est identifié par une inscription
// `ClassroomEnrollment.isActive = true`. Le rôle applicatif accepté est
// `User.role = "STUDENT"` (V1 legacy) OU
// `UserAppRole.role = "LEARNER"` (V2 additif). Les autres rôles
// (`TEACHER`, `CENTER_ADMIN`, `YEMA_ADMIN`, `RACINES_COACH`,
// `CAREER_COACH`) ne suffisent JAMAIS à ouvrir l'espace Student · un
// admin sans enrollment n'accède à aucune ressource Student (§3 brief).
//
// Aucun `studentId`, `userId` ou `classroomId` client n'est jamais
// accepté comme autorité · le scope est dérivé du JWT via
// `resolveCircleActor()` puis élargi à Student uniquement si le tuple
// (rôle, enrollment) est valide.
//
// Table de décision §3 ·
//
//   | Situation                        | Résultat                        |
//   | -------------------------------- | ------------------------------- |
//   | Anonyme                          | 401                             |
//   | Rôle non étudiant                | 403                             |
//   | Étudiant sans enrollment actif   | actor with 0 enrollments (404)  |
//   | Enrollment actif                 | actor avec liste des classIds   |
//   | Enrollment retiré                | actor sans enrollment (404)     |
//   | Classroom inactive               | actor avec classroomIds filtré  |
//   | YEMA admin sans enrollment       | 403                             |

import { prisma } from "@/lib/prisma";
import { writeAuditEvent } from "@/lib/audit/events";
import {
  PermissionError,
  resolveCircleActor,
  type CircleActor,
} from "./circle";

export interface StudentActor extends CircleActor {
  activeClassroomIds: string[];
  actorRole: "STUDENT";
}

async function auditStudentRefusal(rec: {
  action: "ASSIGNMENT_ACCESS_DENIED" | "SUBMISSION_ACCESS_DENIED";
  actorUserId: string | null;
  actorRole?: string | null;
  targetType: string;
  targetId: string;
  metadata?: Record<string, string | number | boolean | null>;
}): Promise<void> {
  try {
    await writeAuditEvent({
      actorUserId: rec.actorUserId,
      actorRole: rec.actorRole ?? null,
      action: rec.action,
      targetType: rec.targetType,
      targetId: rec.targetId,
      scopeType: "StudentWorkspace",
      scopeId: null,
      metadata: rec.metadata ?? null,
    });
  } catch (e) {
    console.warn(`[audit] ${rec.action} write failed:`, (e as Error).message);
  }
}

/**
 * Résout l'actor Student. Throws PermissionError avec code approprié ·
 *   401 UNAUTHORIZED  · anonyme (délégué à `resolveCircleActor`)
 *   403 FORBIDDEN     · rôle Student absent OU aucun enrollment actif
 *   404 NOT_FOUND     · user non trouvé en base
 *
 * Émet un audit `ASSIGNMENT_ACCESS_DENIED` fire-and-forget sur refus rôle.
 */
export async function resolveStudentActor(): Promise<StudentActor> {
  const actor = await resolveCircleActor(); // 401 handled here
  const dbUser = await prisma.user.findUnique({
    where: { id: actor.userId },
    select: {
      id: true,
      role: true,
      appRoles: { select: { role: true } },
      classroomEnrollments: {
        where: { isActive: true },
        select: {
          classroomId: true,
          classroom: { select: { isActive: true } },
        },
      },
    },
  });
  if (!dbUser) throw new PermissionError("NOT_FOUND", "user not found");

  const legacyOk = dbUser.role === "STUDENT";
  const appRoles = new Set(dbUser.appRoles.map((r) => r.role));
  const v2Ok = appRoles.has("LEARNER");
  if (!legacyOk && !v2Ok) {
    await auditStudentRefusal({
      action: "ASSIGNMENT_ACCESS_DENIED",
      actorUserId: dbUser.id, actorRole: dbUser.role,
      targetType: "StudentWorkspace", targetId: dbUser.id,
      metadata: { reasonCode: "student_role_required" },
    });
    throw new PermissionError("FORBIDDEN", "student role required");
  }

  const activeClassroomIds = dbUser.classroomEnrollments
    .filter((e) => e.classroom.isActive)
    .map((e) => e.classroomId);

  if (activeClassroomIds.length === 0) {
    // Rôle OK mais aucun enrollment ACTIVE + classroom active · l'utilisateur
    // n'accède à aucune ressource Student en pratique. Le brief §3 dit
    // "liste vide ou 404 selon route" · nous laissons l'actor avec 0 ids et
    // les services renverront `assignment_not_found`. Pas d'exception ici.
  }

  return {
    ...actor,
    activeClassroomIds,
    actorRole: "STUDENT",
  };
}

export async function resolveStudentActorOrNull(): Promise<StudentActor | null> {
  try {
    return await resolveStudentActor();
  } catch {
    return null;
  }
}

/**
 * Vérifie que le Student peut accéder à un assignment donné · assignment
 * PUBLISHED/CLOSED dans une Classroom active où il a un enrollment actif.
 * Émet `ASSIGNMENT_ACCESS_DENIED` fire-and-forget en cas de refus.
 */
export async function assertStudentCanAccessAssignment(
  actor: StudentActor,
  assignmentId: string,
): Promise<{ classroomId: string; status: string }> {
  const asm = await prisma.assignment.findFirst({
    where: {
      id: assignmentId,
      status: { in: ["PUBLISHED", "CLOSED"] },
      classroomId: { in: actor.activeClassroomIds },
    },
    select: { id: true, classroomId: true, status: true },
  });
  if (!asm) {
    await auditStudentRefusal({
      action: "ASSIGNMENT_ACCESS_DENIED",
      actorUserId: actor.userId, actorRole: "STUDENT",
      targetType: "Assignment", targetId: assignmentId,
      metadata: { reasonCode: "student_not_enrolled_or_assignment_not_published" },
    });
    throw new PermissionError("NOT_FOUND", "assignment not accessible");
  }
  return { classroomId: asm.classroomId, status: asm.status };
}

/**
 * Vérifie que le Student est propriétaire de la submission · seuls les
 * étudiants qui ont créé une submission peuvent la lire ou la modifier.
 * Émet `SUBMISSION_ACCESS_DENIED` fire-and-forget en cas de refus.
 */
export async function assertStudentOwnsSubmission(
  actor: StudentActor,
  submissionId: string,
): Promise<{ assignmentId: string; status: string }> {
  const sub = await prisma.assignmentSubmission.findFirst({
    where: { id: submissionId, userId: actor.userId },
    select: { id: true, assignmentId: true, status: true },
  });
  if (!sub) {
    await auditStudentRefusal({
      action: "SUBMISSION_ACCESS_DENIED",
      actorUserId: actor.userId, actorRole: "STUDENT",
      targetType: "AssignmentSubmission", targetId: submissionId,
      metadata: { reasonCode: "submission_not_owned" },
    });
    throw new PermissionError("NOT_FOUND", "submission not found or not owned");
  }
  return { assignmentId: sub.assignmentId, status: sub.status };
}
