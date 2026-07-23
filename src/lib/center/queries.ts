// P4.3a · Services Prisma Center · toutes les queries scope strict `centerId`.
//
// Convention · chaque fonction reçoit un `centerId` **résolu serveur** (via
// `resolveCenterActor`). Aucun `centerId` client. Pagination serveur avec
// limite max stable. Recherche allowlistée sur les champs safe uniquement.
//
// Projection minimale · voir docs/YEMA_P4_3A_CENTER_REAL_DATA.md §Projections.

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

export type EnrollmentStatus = "PENDING" | "ACTIVE" | "REMOVED";

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

// ── Dashboard aggregates · uniquement des chiffres calculables réels ─────
export interface CenterDashboardStats {
  teacherCount: number;
  classroomCount: number;
  studentCount: number;
  pendingEnrollmentCount: number;
  // Note · retention, top students, revenue restent LOCK_HONESTLY en P4.3a
  // (aucune source réelle en base). L'UI affiche "Donnée indisponible".
}

export async function getCenterDashboard(centerId: string): Promise<CenterDashboardStats> {
  const [teacherCount, classroomCount, pendingEnrollmentCount, studentCount] = await Promise.all([
    prisma.teacher.count({ where: { centerId } }),
    prisma.classroom.count({ where: { centerId } }),
    (async () => {
      // ClassJoinRequest n'a pas de relation vers Classroom · on filtre en 2 temps.
      const classroomIds = await prisma.classroom.findMany({
        where: { centerId }, select: { id: true },
      }).then((rows) => rows.map((r) => r.id));
      if (classroomIds.length === 0) return 0;
      return prisma.classJoinRequest.count({
        where: { status: "pending", toClassroomId: { in: classroomIds } },
      });
    })(),
    // Étudiants distincts inscrits dans une classe du centre.
    prisma.user.count({
      where: {
        classroomEnrollments: {
          some: { isActive: true, classroom: { centerId } },
        },
      },
    }),
  ]);
  return { teacherCount, classroomCount, studentCount, pendingEnrollmentCount };
}

// ── Teachers ─────────────────────────────────────────────────────────────
export interface CenterTeacherRow {
  id: string;
  fullName: string;
  isVerified: boolean;
  speciality: string[];
  languages: string[];
  classroomCount: number;
  activeStudentCount: number;
  createdAt: Date;
}

export async function getCenterTeachers(centerId: string, args: PageArgs = {}) {
  const { page, pageSize, q, skip } = normPage(args);
  const where: Prisma.TeacherWhereInput = {
    centerId,
    ...(q
      ? {
          user: {
            fullName: { contains: q, mode: "insensitive" },
          },
        }
      : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.teacher.count({ where }),
    prisma.teacher.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        speciality: true,
        languages: true,
        isVerified: true,
        createdAt: true,
        user: { select: { fullName: true } },
        _count: { select: { classrooms: true } },
      },
    }),
  ]);
  // Étudiants actifs par teacher · agrégation légère · une seule query.
  const teacherIds = rows.map((r) => r.id);
  const studentCounts = teacherIds.length
    ? await prisma.classroomEnrollment.groupBy({
        by: ["classroomId"],
        where: {
          isActive: true,
          classroom: { teacherId: { in: teacherIds }, centerId },
        },
        _count: { _all: true },
      })
    : [];
  const classroomsForTeachers = teacherIds.length
    ? await prisma.classroom.findMany({
        where: { teacherId: { in: teacherIds }, centerId },
        select: { id: true, teacherId: true },
      })
    : [];
  const classroomToTeacher = new Map(classroomsForTeachers.map((c) => [c.id, c.teacherId]));
  const perTeacher = new Map<string, number>();
  for (const row of studentCounts) {
    const tId = classroomToTeacher.get(row.classroomId);
    if (!tId) continue;
    perTeacher.set(tId, (perTeacher.get(tId) ?? 0) + row._count._all);
  }

  const items: CenterTeacherRow[] = rows.map((t) => ({
    id: t.id,
    fullName: t.user.fullName,
    isVerified: t.isVerified,
    speciality: t.speciality ?? [],
    languages: t.languages ?? [],
    classroomCount: t._count.classrooms,
    activeStudentCount: perTeacher.get(t.id) ?? 0,
    createdAt: t.createdAt,
  }));
  return { items, total, page, pageSize };
}

// ── Classes (Classroom legacy) ───────────────────────────────────────────
export interface CenterClassRow {
  id: string;
  name: string;
  level: string;
  code: string;
  maxStudents: number;
  activeStudentCount: number;
  isActive: boolean;
  teacher: { id: string; fullName: string } | null;
  createdAt: Date;
}

export async function getCenterClasses(centerId: string, args: PageArgs = {}) {
  const { page, pageSize, q, skip } = normPage(args);
  const where: Prisma.ClassroomWhereInput = {
    centerId,
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
        createdAt: true,
        teacher: { select: { id: true, user: { select: { fullName: true } } } },
        _count: { select: { enrollments: { where: { isActive: true } } } },
      },
    }),
  ]);
  const items: CenterClassRow[] = rows.map((c) => ({
    id: c.id,
    name: c.name,
    level: String(c.level),
    code: c.code,
    maxStudents: c.maxStudents,
    activeStudentCount: c._count.enrollments,
    isActive: c.isActive,
    teacher: c.teacher ? { id: c.teacher.id, fullName: c.teacher.user.fullName } : null,
    createdAt: c.createdAt,
  }));
  return { items, total, page, pageSize };
}

// ── Students ─────────────────────────────────────────────────────────────
export interface CenterStudentRow {
  id: string;
  fullName: string;
  classroomId: string | null;
  classroomName: string | null;
  level: string | null;
  joinedAt: Date | null;
}

export async function getCenterStudents(
  centerId: string,
  args: PageArgs & { classId?: string | null } = {},
) {
  const { page, pageSize, q, skip } = normPage(args);
  // Valide `classId` dans le scope du centre · sinon on ignore le filtre.
  let classIdFilter: string | undefined;
  if (typeof args.classId === "string" && args.classId.length >= 4) {
    const owned = await prisma.classroom.findFirst({
      where: { id: args.classId, centerId },
      select: { id: true },
    });
    if (!owned) {
      // classId étranger · réponse sûre = pas de résultat, jamais 404 leak.
      return { items: [], total: 0, page, pageSize };
    }
    classIdFilter = owned.id;
  }
  const where: Prisma.ClassroomEnrollmentWhereInput = {
    isActive: true,
    classroom: { centerId, ...(classIdFilter ? { id: classIdFilter } : {}) },
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
        classroom: { select: { id: true, name: true, level: true } },
        user: { select: { id: true, fullName: true } },
      },
    }),
  ]);
  const items: CenterStudentRow[] = rows.map((e) => ({
    id: e.user.id,
    fullName: e.user.fullName,
    classroomId: e.classroom.id,
    classroomName: e.classroom.name,
    level: e.classroom.level ? String(e.classroom.level) : null,
    joinedAt: e.joinedAt,
  }));
  return { items, total, page, pageSize };
}

// ── Pending enrollments ─────────────────────────────────────────────────
export interface CenterPendingRow {
  id: string;
  fromUserId: string;
  fromUserFullName: string;
  toClassroomId: string;
  toClassroomName: string;
  createdAt: Date;
}

export async function getCenterPendingEnrollments(centerId: string, args: PageArgs = {}) {
  const { page, pageSize, skip } = normPage(args);
  // 1. Récupère les IDs de classrooms du centre.
  const classrooms = await prisma.classroom.findMany({
    where: { centerId },
    select: { id: true, name: true },
  });
  const classroomIds = classrooms.map((c) => c.id);
  if (classroomIds.length === 0) {
    return { items: [] as CenterPendingRow[], total: 0, page, pageSize };
  }
  const classroomById = new Map(classrooms.map((c) => [c.id, c.name]));

  // 2. `ClassJoinRequest.status` est String (pas d'enum) · convention "pending".
  const where: Prisma.ClassJoinRequestWhereInput = {
    status: "pending",
    toClassroomId: { in: classroomIds },
  };
  const [total, rows] = await Promise.all([
    prisma.classJoinRequest.count({ where }),
    prisma.classJoinRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        createdAt: true,
        toClassroomId: true,
        fromUser: { select: { id: true, fullName: true } },
      },
    }),
  ]);
  const items: CenterPendingRow[] = rows.flatMap((r) => {
    if (!r.toClassroomId) return [];
    return [{
      id: r.id,
      fromUserId: r.fromUser.id,
      fromUserFullName: r.fromUser.fullName,
      toClassroomId: r.toClassroomId,
      toClassroomName: classroomById.get(r.toClassroomId) ?? "",
      createdAt: r.createdAt,
    }];
  });
  return { items, total, page, pageSize };
}
