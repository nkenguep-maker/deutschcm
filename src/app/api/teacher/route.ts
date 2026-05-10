import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

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
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function getTeacher(supabaseId: string) {
  const user = await prisma.user.findUnique({
    where: { supabaseId },
    include: { teacher: { include: { classrooms: { include: { enrollments: true, assignments: true } } } } },
  });
  return user;
}

// GET /api/teacher — teacher profile + classrooms
export async function GET(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  const dbUser = await getTeacher(authUser.id);
  if (!dbUser || (dbUser.role !== "TEACHER" && dbUser.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (action === "classrooms") {
    return NextResponse.json({ classrooms: dbUser.teacher?.classrooms ?? [] });
  }

  if (action === "code") {
    if (!dbUser.teacher) return NextResponse.json({ error: "No teacher profile" }, { status: 400 });
    let code = dbUser.teacher.code;
    if (!code) {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let attempt = "";
      for (let i = 0; i < 6; i++) attempt += chars[Math.floor(Math.random() * chars.length)];
      code = `TCH-${attempt}`;
      while (await prisma.teacher.findUnique({ where: { code } })) {
        let retry = "";
        for (let i = 0; i < 6; i++) retry += chars[Math.floor(Math.random() * chars.length)];
        code = `TCH-${retry}`;
      }
      await prisma.teacher.update({ where: { id: dbUser.teacher.id }, data: { code } });
    }
    return NextResponse.json({ code });
  }

  if (action === "students" && url.searchParams.get("classroomId")) {
    const classroomId = url.searchParams.get("classroomId")!;
    const enrollments = await prisma.classroomEnrollment.findMany({
      where: { classroomId, isActive: true },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, xpTotal: true, streakDays: true, lastActiveAt: true, createdAt: true },
        },
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return NextResponse.json({ students: enrollments.map((e: any) => e.user) });
  }

  return NextResponse.json({ teacher: dbUser });
}

// POST /api/teacher — create classroom or assignment
export async function POST(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await getTeacher(authUser.id);
  if (!dbUser || (dbUser.role !== "TEACHER" && dbUser.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!dbUser.teacher) return NextResponse.json({ error: "No teacher profile" }, { status: 400 });

  const body = await request.json();
  const { type } = body;

  if (type === "classroom") {
    const { name, description, level, maxStudents } = body;
    const code = `DEUTSCH-${level}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const classroom = await prisma.classroom.create({
      data: {
        name,
        description,
        level,
        maxStudents: maxStudents ?? 30,
        code,
        teacherId: dbUser.teacher.id,
      },
    });
    return NextResponse.json({ classroom });
  }

  if (type === "assignment") {
    const { classroomId, title, description, moduleId, dueDate, maxScore } = body;
    const assignment = await prisma.assignment.create({
      data: {
        classroomId,
        title,
        description,
        moduleId: moduleId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        maxScore: maxScore ?? 100,
      },
    });
    return NextResponse.json({ assignment });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// PUT /api/teacher — grade an assignment submission
export async function PUT(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await getTeacher(authUser.id);
  if (!dbUser || (dbUser.role !== "TEACHER" && dbUser.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { assignmentId, userId, score, feedback } = body;

  const submission = await prisma.assignmentSubmission.upsert({
    where: { assignmentId_userId: { assignmentId, userId } },
    update: { score, feedback },
    create: { assignmentId, userId, score, feedback },
  });

  return NextResponse.json({ submission });
}
