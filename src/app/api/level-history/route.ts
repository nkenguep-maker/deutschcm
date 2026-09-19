import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { isSameOriginRequest } from "@/lib/security/requestOrigin";

const LEVELS = new Set(["A1", "A2", "B1", "B2", "C1", "C2"]);
const MAX_REASON_CHARS = 500;

async function getAuthUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    },
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function getDbActor(supabaseId: string) {
  return prisma.user.findUnique({
    where: { supabaseId },
    select: { id: true, role: true, fullName: true },
  });
}

async function teacherOwnsStudent(teacherUserId: string, studentUserId: string): Promise<boolean> {
  const teacher = await prisma.teacher.findUnique({
    where: { userId: teacherUserId },
    select: { id: true },
  });
  if (!teacher) return false;

  const enrollment = await prisma.classroomEnrollment.findFirst({
    where: {
      userId: studentUserId,
      isActive: true,
      classroom: {
        teacherId: teacher.id,
        isActive: true,
      },
    },
    select: { id: true },
  });
  return Boolean(enrollment);
}

async function canReadStudentHistory(
  actor: { id: string; role: "STUDENT" | "TEACHER" | "ADMIN" | "CENTER" },
  studentUserId: string,
): Promise<boolean> {
  if (actor.id === studentUserId) return true;
  if (actor.role === "ADMIN") return true;
  if (actor.role !== "TEACHER") return false;
  return teacherOwnsStudent(actor.id, studentUserId);
}

// GET /api/level-history?userId=xxx
// Self is allowed; ADMIN may inspect any user; TEACHER may inspect only an
// actively enrolled student in one of their own active classrooms.
export async function GET(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const actor = await getDbActor(authUser.id);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  if (!(await canReadStudentHistory(actor, userId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const history = await prisma.levelHistory.findMany({
    where: { userId },
    orderBy: { changedAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ history });
}

// POST /api/level-history — teacher modifies a student level only inside an
// owned active classroom; ADMIN remains the explicit global exception.
export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const actor = await getDbActor(authUser.id);
  if (!actor || (actor.role !== "TEACHER" && actor.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const raw = await request.json().catch(() => null);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const body = raw as { studentId?: unknown; newLevel?: unknown; reason?: unknown };
  if (
    typeof body.studentId !== "string" ||
    typeof body.newLevel !== "string" ||
    typeof body.reason !== "string"
  ) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const studentId = body.studentId.trim();
  const newLevel = body.newLevel.trim().toUpperCase();
  const reason = body.reason.trim();

  if (!studentId || !LEVELS.has(newLevel) || !reason || reason.length > MAX_REASON_CHARS) {
    return NextResponse.json({ error: "Invalid fields" }, { status: 400 });
  }

  if (actor.role === "TEACHER" && !(await teacherOwnsStudent(actor.id, studentId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { germanLevel: true },
  });
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  const oldLevel = student.germanLevel ?? "A1";

  await prisma.$transaction([
    prisma.user.update({
      where: { id: studentId },
      data: { germanLevel: newLevel, levelAssignedAt: new Date() },
    }),
    prisma.levelHistory.create({
      data: {
        userId: studentId,
        oldLevel,
        newLevel,
        reason,
        changedBy: actor.id,
      },
    }),
    prisma.notification.create({
      data: {
        userId: studentId,
        title: "📊 Niveau mis à jour",
        body: `Votre niveau a été modifié de ${oldLevel} → ${newLevel}. Raison : ${reason}`,
        type: "level-updated",
      },
    }),
  ]);

  return NextResponse.json({ ok: true, oldLevel, newLevel });
}
