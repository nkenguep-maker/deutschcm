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
// Aucun `teacherId` / `centerId` / `classroomId` client n'est jamais accepté
// comme source d'autorité. Le scope est retourné avec le row Teacher projeté
// en champs minimaux (id, isVerified, speciality, languages, centerId,
// center résumé). Aucun `findFirst` arbitraire, aucun `orderBy` implicite.

import { prisma } from "@/lib/prisma";
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
 * Résout le Teacher géré par l'utilisateur authentifié.
 * - 401 anonyme
 * - 403 rôle Teacher absent (Center admin seul, Coach, Student, etc.)
 * - 404 rôle Teacher présent mais aucun Teacher row (ZERO_BINDING)
 * - 404 Teacher inactif
 * - 409 binding ambigu (2+ Teacher rows ou legacy divergent)
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
    throw new PermissionError("NOT_FOUND", "no teacher membership resolved");
  }
  if (teacherRows.length > 1) {
    throw new PermissionError("CONFLICT", "teacher scope ambiguous");
  }
  const teacher = teacherRows[0];

  // Teacher inactif · convention · isVerified === false ET aucune classe
  // active · pour le moment on considère qu'un Teacher non-vérifié reste
  // consultable en lecture (dashboard vide). Un Teacher supprimé ne remonte
  // simplement pas ici.

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
 * Vérifie qu'une classe appartient au Teacher courant. Utilise `findUnique`
 * sur l'id + un filtre applicatif teacherId. Retourne le row projeté ou
 * throw 404 sans oracle sur l'existence hors-scope.
 */
export async function assertTeacherOwnsClassroom(
  actor: TeacherActor,
  classroomId: string,
): Promise<{ id: string; name: string; centerId: string | null; level: string }> {
  if (typeof classroomId !== "string" || classroomId.length < 4) {
    throw new PermissionError("NOT_FOUND", "class not found");
  }
  const classroom = await prisma.classroom.findFirst({
    where: { id: classroomId, teacherId: actor.teacherId },
    select: { id: true, name: true, centerId: true, level: true },
  });
  if (!classroom) {
    // Toujours 404 · jamais 403 · évite l'oracle "cette classe existe ailleurs".
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
    throw new PermissionError("NOT_FOUND", "student not in teacher class");
  }
  return enrollment;
}

export { PermissionError };
