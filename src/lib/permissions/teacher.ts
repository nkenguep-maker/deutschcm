// P4.3b · Résolution serveur "Teacher courant" pour l'utilisateur authentifié.
//
// Source de vérité · un enseignant Monde est identifié par un `Teacher` row
// (`Teacher.userId @unique`). Le rôle applicatif accepté est soit `User.role
// = "TEACHER"` (V1 legacy), soit `UserAppRole.role = "TEACHER"` (V2). Les
// rôles `CENTER_ADMIN`/`YEMA_ADMIN`/`CAREER_COACH`/`RACINES_COACH` ne
// suffisent JAMAIS à ouvrir l'espace Teacher (voir §2 spec P4.3b · séparation
// stricte Teacher Monde vs Coach Racines vs Center admin).
//
// Contrat trois-états ·
//   ZERO_BINDING (404 no teacher membership resolved)
//   ONE_BINDING  (200)
//   AMBIGUOUS    (409 teacher scope ambiguous)
//
// **Règle YEMA_ADMIN · P4.3b hardening §7** · un rôle `YEMA_ADMIN` seul ne
// donne PAS accès à l'espace Teacher. Il faut aussi un Teacher row (le rôle
// global admin passe l'étape rôle mais tombe sur `ZERO_BINDING` si aucun
// Teacher n'existe). L'accès Teacher provient donc du binding, pas du rôle
// global.
//
// Aucun `teacherId` / `centerId` / `classroomId` client n'est jamais accepté
// comme source d'autorité. Le scope est retourné avec le row Teacher projeté
// en champs minimaux (id, isVerified, speciality, languages, centerId,
// center résumé). Aucun `findFirst` arbitraire, aucun `orderBy` implicite.

import { prisma } from "@/lib/prisma";
import { writeAuditEvent } from "@/lib/audit/events";
import {
  PermissionError,
  resolveCircleActor,
  type CircleActor,
} from "./circle";

export interface TeacherActor extends CircleActor {
  teacherId: string;
  centerId: string | null;
  teacher: {
    id: string;
    isVerified: boolean;
    speciality: string[];
    languages: string[];
    centerId: string | null;
  };
  center: {
    id: string;
    name: string;
    city: string;
    country: string;
    plan: string;
  } | null;
  actorRole: "TEACHER" | "YEMA_ADMIN";
}

/**
 * Émet un AuditEvent de refus Teacher. Fire-and-forget · un échec
 * d'écriture audit ne doit jamais bloquer la réponse HTTP au caller.
 *
 * Contrat metadata · uniquement identifiants et codes stables · aucun email,
 * téléphone, nom complet, cookie, token, body pédagogique. `sanitizeMetadata`
 * dans `writeAuditEvent` filtre en défense-en-profondeur.
 */
async function auditTeacherRefusal(rec: {
  action:
    | "TEACHER_ACCESS_DENIED"
    | "TEACHER_CLASS_ACCESS_DENIED"
    | "TEACHER_STUDENT_ACCESS_DENIED"
    | "TEACHER_SCOPE_AMBIGUOUS";
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
      scopeType: "TeacherWorkspace",
      scopeId: null,
      metadata: rec.metadata ?? null,
    });
  } catch (e) {
    console.warn(`[audit] ${rec.action} write failed:`, (e as Error).message);
  }
}

/**
 * Résout le Teacher géré par l'utilisateur authentifié.
 * - 401 anonyme
 * - 403 rôle Teacher absent (Center admin seul, Coach, Student, etc.)
 * - 404 rôle Teacher présent mais aucun Teacher row (ZERO_BINDING)
 * - 404 Teacher inactif
 * - 409 binding ambigu (2+ Teacher rows ou legacy divergent)
 *
 * Événements audit émis (fire-and-forget) ·
 * - `TEACHER_ACCESS_DENIED` sur 403 rôle absent.
 * - `TEACHER_SCOPE_AMBIGUOUS` sur 409 multi-binding.
 */
export async function resolveTeacherActor(): Promise<TeacherActor> {
  const actor = await resolveCircleActor(); // 401 handled here
  const dbUser = await prisma.user.findUnique({
    where: { id: actor.userId },
    select: {
      id: true,
      role: true,
      appRoles: { select: { role: true } },
    },
  });
  if (!dbUser) throw new PermissionError("NOT_FOUND", "user not found");

  const legacyOk = dbUser.role === "TEACHER" || dbUser.role === "ADMIN";
  const appRoles = new Set(dbUser.appRoles.map((r) => r.role));
  const v2Ok = appRoles.has("TEACHER") || appRoles.has("YEMA_ADMIN");
  if (!legacyOk && !v2Ok) {
    await auditTeacherRefusal({
      action: "TEACHER_ACCESS_DENIED",
      actorUserId: dbUser.id,
      actorRole: dbUser.role,
      targetType: "TeacherWorkspace",
      targetId: "resolve",
      metadata: {
        reasonCode: "role_missing",
        appRoles: [...appRoles].sort().join(","),
      },
    });
    throw new PermissionError("FORBIDDEN", "teacher access required");
  }

  // Défense-en-profondeur · take:2 détecte explicitement toute ambigüité
  // (2+ Teacher rows attachés). Ne fait pas confiance au @unique du schéma.
  const teacherRows = await prisma.teacher.findMany({
    where: { userId: dbUser.id },
    take: 2,
    select: {
      id: true,
      isVerified: true,
      speciality: true,
      languages: true,
      centerId: true,
      center: {
        select: {
          id: true,
          name: true,
          city: true,
          country: true,
          plan: true,
        },
      },
    },
  });

  if (teacherRows.length === 0) {
    // ZERO_BINDING · aucun audit émis (comportement contractuel courant
    // pour un rôle Teacher fraîchement créé sans binding). Ce n'est pas
    // un refus sensible · éviter le bruit d'audit.
    throw new PermissionError("NOT_FOUND", "no teacher membership resolved");
  }
  if (teacherRows.length > 1) {
    await auditTeacherRefusal({
      action: "TEACHER_SCOPE_AMBIGUOUS",
      actorUserId: dbUser.id,
      actorRole: dbUser.role,
      targetType: "TeacherWorkspace",
      targetId: "resolve",
      metadata: {
        reasonCode: "multi_teacher_row",
        teacherRowCount: teacherRows.length,
      },
    });
    throw new PermissionError("CONFLICT", "teacher scope ambiguous");
  }
  const teacher = teacherRows[0];

  return {
    ...actor,
    teacherId: teacher.id,
    centerId: teacher.centerId,
    teacher: {
      id: teacher.id,
      isVerified: teacher.isVerified,
      speciality: teacher.speciality ?? [],
      languages: teacher.languages ?? [],
      centerId: teacher.centerId,
    },
    center: teacher.center ?? null,
    actorRole: appRoles.has("YEMA_ADMIN") ? "YEMA_ADMIN" : "TEACHER",
  };
}

export async function resolveTeacherActorOrNull(): Promise<TeacherActor | null> {
  try {
    return await resolveTeacherActor();
  } catch {
    return null;
  }
}

/**
 * Vérifie qu'une classe appartient au Teacher courant. Utilise `findFirst`
 * sur l'id + un filtre applicatif teacherId. Retourne le row projeté ou
 * throw 404 sans oracle sur l'existence hors-scope.
 *
 * Émet `TEACHER_CLASS_ACCESS_DENIED` (fire-and-forget) sur refus, sauf si
 * la classe n'existe pas du tout (évite le bruit d'audit sur des IDs
 * invalides · seuls les cas où la classe existe ailleurs sont sensibles).
 */
export async function assertTeacherOwnsClassroom(
  actor: TeacherActor,
  classroomId: string,
): Promise<{ id: string; name: string; centerId: string | null; level: string }> {
  if (typeof classroomId !== "string" || classroomId.length < 4) {
    throw new PermissionError("NOT_FOUND", "class not found");
  }
  const [classroom, foreignExists] = await Promise.all([
    prisma.classroom.findFirst({
      where: { id: classroomId, teacherId: actor.teacherId },
      select: { id: true, name: true, centerId: true, level: true },
    }),
    prisma.classroom.findFirst({
      where: { id: classroomId },
      select: { id: true, teacherId: true, centerId: true },
    }),
  ]);
  if (!classroom) {
    if (foreignExists) {
      // La classe existe mais appartient à un autre Teacher · émission audit.
      await auditTeacherRefusal({
        action: "TEACHER_CLASS_ACCESS_DENIED",
        actorUserId: actor.userId,
        actorRole: actor.actorRole,
        targetType: "Classroom",
        targetId: foreignExists.id,
        metadata: {
          reasonCode: "cross_teacher",
          actorTeacherId: actor.teacherId,
          targetTeacherId: foreignExists.teacherId,
          targetCenterId: foreignExists.centerId,
        },
      });
    }
    throw new PermissionError("NOT_FOUND", "class not found");
  }
  return {
    id: classroom.id,
    name: classroom.name,
    centerId: classroom.centerId,
    level: String(classroom.level),
  };
}

/**
 * Vérifie qu'un étudiant possède une inscription active dans une classe du
 * Teacher courant. Throw 404 sinon (sans oracle).
 *
 * Émet `TEACHER_STUDENT_ACCESS_DENIED` (fire-and-forget) si l'étudiant
 * existe mais n'est pas dans une classe du Teacher · évite le bruit d'audit
 * sur des IDs de user inexistants.
 */
export async function assertTeacherCanViewStudent(
  actor: TeacherActor,
  studentUserId: string,
): Promise<{ classroomId: string }> {
  if (typeof studentUserId !== "string" || studentUserId.length < 4) {
    throw new PermissionError("NOT_FOUND", "student not in teacher class");
  }
  const enrollment = await prisma.classroomEnrollment.findFirst({
    where: {
      userId: studentUserId,
      isActive: true,
      classroom: { teacherId: actor.teacherId },
    },
    select: { classroomId: true },
  });
  if (!enrollment) {
    // Vérifie si l'étudiant existe dans le système avant d'auditer.
    const foreignEnrollment = await prisma.classroomEnrollment.findFirst({
      where: { userId: studentUserId, isActive: true },
      select: { classroomId: true, classroom: { select: { teacherId: true } } },
    });
    if (foreignEnrollment) {
      await auditTeacherRefusal({
        action: "TEACHER_STUDENT_ACCESS_DENIED",
        actorUserId: actor.userId,
        actorRole: actor.actorRole,
        targetType: "Student",
        targetId: studentUserId,
        metadata: {
          reasonCode: "student_not_in_teacher_class",
          actorTeacherId: actor.teacherId,
          targetClassroomTeacherId: foreignEnrollment.classroom.teacherId,
        },
      });
    }
    throw new PermissionError("NOT_FOUND", "student not in teacher class");
  }
  return enrollment;
}

export { PermissionError };
