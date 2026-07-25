// P4.3b · Services Prisma Teacher · scope strict `teacherId`.
//
// Convention · chaque fonction reçoit un `teacherId` résolu serveur via
// `resolveTeacherActor`. Aucun `teacherId` client. Aucun `classroomId`
// client sans validation `assertTeacherOwnsClassroom` en amont.
// Pagination bornée, projections minimales, tri allowlisté.
//
// Voir docs/YEMA_P4_3B_TEACHER_WORKSPACE.md §Projections.

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

export interface PageArgs {
  page?: number;
  pageSize?: number;
  query?: string;
}

function normPage(args: PageArgs) {
  const page = Math.max(1, Math.floor(Number(args.page ?? 1) || 1));
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Math.floor(Number(args.pageSize ?? DEFAULT_PAGE_SIZE) || DEFAULT_PAGE_SIZE)),
  );
  const q = typeof args.query === "string" ? args.query.trim().slice(0, 80) : "";
  return { page, pageSize, q, skip: (page - 1) * pageSize };
}

// ── Dashboard ──────────────────────────────────────────────────────────
export interface TeacherDashboardStats {
  classroomCount: number;
  activeStudentCount: number;
  pendingRequestCount: number;
  // Note · rétention, top students, revenue, avgScore, avgProgress restent
  // LOCK_HONESTLY en P4.3b (aucune source réelle calculable).
}

export async function getTeacherDashboard(teacherId: string): Promise<TeacherDashboardStats> {
  const [classroomCount, classroomRows] = await Promise.all([
    prisma.classroom.count({ where: { teacherId } }),
    prisma.classroom.findMany({ where: { teacherId }, select: { id: true } }),
  ]);
  const classroomIds = classroomRows.map((c) => c.id);
  if (classroomIds.length === 0) {
    return { classroomCount, activeStudentCount: 0, pendingRequestCount: 0 };
  }
  const [activeStudentCount, pendingRequestCount] = await Promise.all([
    prisma.classroomEnrollment.count({
      where: { isActive: true, classroomId: { in: classroomIds } },
    }),
    prisma.classJoinRequest.count({
      where: { status: "pending", toClassroomId: { in: classroomIds } },
    }),
  ]);
  return { classroomCount, activeStudentCount, pendingRequestCount };
}

// ── Classes ────────────────────────────────────────────────────────────
export interface TeacherClassRow {
  id: string;
  name: string;
  level: string;
  code: string;
  maxStudents: number;
  activeStudentCount: number;
  isActive: boolean;
  centerId: string | null;
  createdAt: Date;
}

export async function getTeacherClasses(teacherId: string, args: PageArgs = {}) {
  const { page, pageSize, q, skip } = normPage(args);
  const where: Prisma.ClassroomWhereInput = {
    teacherId,
    ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.classroom.count({ where }),
    prisma.classroom.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        name: true,
        level: true,
        code: true,
        maxStudents: true,
        isActive: true,
        centerId: true,
        createdAt: true,
        _count: { select: { enrollments: { where: { isActive: true } } } },
      },
    }),
  ]);
  const items: TeacherClassRow[] = rows.map((c) => ({
    id: c.id,
    name: c.name,
    level: String(c.level),
    code: c.code,
    maxStudents: c.maxStudents,
    activeStudentCount: c._count.enrollments,
    isActive: c.isActive,
    centerId: c.centerId,
    createdAt: c.createdAt,
  }));
  return { items, total, page, pageSize };
}

// ── Class detail ───────────────────────────────────────────────────────
export interface TeacherClassDetail {
  id: string;
  name: string;
  level: string;
  code: string;
  description: string | null;
  maxStudents: number;
  activeStudentCount: number;
  isActive: boolean;
  centerId: string | null;
  createdAt: Date;
}

/**
 * `classroomId` doit avoir été validé en amont via
 * `assertTeacherOwnsClassroom`. Cette query n'ajoute PAS de filtre teacherId
 * afin d'éviter une confusion sémantique · le contrat est le caller.
 */
export async function getTeacherClass(
  teacherId: string,
  classroomId: string,
): Promise<TeacherClassDetail | null> {
  const row = await prisma.classroom.findFirst({
    where: { id: classroomId, teacherId },
    select: {
      id: true,
      name: true,
      level: true,
      code: true,
      description: true,
      maxStudents: true,
      isActive: true,
      centerId: true,
      createdAt: true,
      _count: { select: { enrollments: { where: { isActive: true } } } },
    },
  });
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    level: String(row.level),
    code: row.code,
    description: row.description,
    maxStudents: row.maxStudents,
    activeStudentCount: row._count.enrollments,
    isActive: row.isActive,
    centerId: row.centerId,
    createdAt: row.createdAt,
  };
}

// ── Class students (scoped) ───────────────────────────────────────────
export interface TeacherStudentRow {
  id: string;
  fullName: string;
  level: string | null;
  classroomId: string;
  classroomName: string;
  joinedAt: Date;
  isActive: boolean;
}

export async function getTeacherClassStudents(
  teacherId: string,
  classroomId: string,
  args: PageArgs = {},
) {
  const { page, pageSize, q, skip } = normPage(args);
  // Guard applicative · même si le caller a déjà validé, on double-check.
  const classroom = await prisma.classroom.findFirst({
    where: { id: classroomId, teacherId },
    select: { id: true, name: true },
  });
  if (!classroom) {
    return { items: [] as TeacherStudentRow[], total: 0, page, pageSize };
  }
  const where: Prisma.ClassroomEnrollmentWhereInput = {
    isActive: true,
    classroomId: classroom.id,
    ...(q
      ? { user: { fullName: { contains: q, mode: "insensitive" } } }
      : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.classroomEnrollment.count({ where }),
    prisma.classroomEnrollment.findMany({
      where,
      orderBy: { joinedAt: "desc" },
      skip,
      take: pageSize,
      select: {
        joinedAt: true,
        isActive: true,
        user: {
          select: {
            id: true,
            fullName: true,
            germanLevel: true,
          },
        },
      },
    }),
  ]);
  const items: TeacherStudentRow[] = rows.map((e) => ({
    id: e.user.id,
    fullName: e.user.fullName,
    level: e.user.germanLevel,
    classroomId: classroom.id,
    classroomName: classroom.name,
    joinedAt: e.joinedAt,
    isActive: e.isActive,
  }));
  return { items, total, page, pageSize };
}

// ── Aggregated students (all Teacher classes) ─────────────────────────
export async function getTeacherStudents(teacherId: string, args: PageArgs = {}) {
  const { page, pageSize, q, skip } = normPage(args);
  const where: Prisma.ClassroomEnrollmentWhereInput = {
    isActive: true,
    classroom: { teacherId },
    ...(q
      ? { user: { fullName: { contains: q, mode: "insensitive" } } }
      : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.classroomEnrollment.count({ where }),
    prisma.classroomEnrollment.findMany({
      where,
      orderBy: { joinedAt: "desc" },
      skip,
      take: pageSize,
      select: {
        joinedAt: true,
        isActive: true,
        classroom: { select: { id: true, name: true } },
        user: {
          select: {
            id: true,
            fullName: true,
            germanLevel: true,
          },
        },
      },
    }),
  ]);
  const items: TeacherStudentRow[] = rows.map((e) => ({
    id: e.user.id,
    fullName: e.user.fullName,
    level: e.user.germanLevel,
    classroomId: e.classroom.id,
    classroomName: e.classroom.name,
    joinedAt: e.joinedAt,
    isActive: e.isActive,
  }));
  return { items, total, page, pageSize };
}

// ── Schedule · LOCK_HONESTLY ───────────────────────────────────────────
// Le schéma n'a aucune table `TeacherSchedule` / `ClassroomSession`. Aucune
// donnée réelle de planning n'est calculable. Cette fonction retourne
// explicitement `available: false` · l'UI affiche un placeholder honnête.
export interface TeacherSchedule {
  available: false;
}

export async function getTeacherSchedule(teacherId: string): Promise<TeacherSchedule> {
  // Signature garde `teacherId` pour cohérence avec les autres queries · le
  // planning sera un jour dérivé du Teacher courant. Marqué intentionnel ·
  void teacherId;
  return { available: false };
}
