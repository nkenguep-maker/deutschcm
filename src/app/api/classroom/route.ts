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

// GET /api/classroom — list enrolled classrooms, feed, or leaderboard
export async function GET(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  const classroomId = url.searchParams.get("classroomId");

  // List enrolled classrooms
  if (!action) {
    const enrollments = await prisma.classroomEnrollment.findMany({
      where: { userId: dbUser.id, isActive: true },
      include: {
        classroom: {
          include: {
            teacher: { include: { user: { select: { fullName: true } } } },
            assignments: { orderBy: { dueDate: "asc" }, take: 3 },
            enrollments: { where: { isActive: true } },
          },
        },
      },
    });
    return NextResponse.json({ classrooms: enrollments.map(e => e.classroom) });
  }

  if (!classroomId) return NextResponse.json({ error: "classroomId required" }, { status: 400 });

  // Leaderboard
  if (action === "leaderboard") {
    const enrollments = await prisma.classroomEnrollment.findMany({
      where: { classroomId, isActive: true },
      include: { user: { select: { id: true, fullName: true, xpTotal: true, streakDays: true } } },
      orderBy: { user: { xpTotal: "desc" } },
      take: 10,
    });
    return NextResponse.json({ leaderboard: enrollments.map(e => e.user) });
  }

  // Assignments for this class
  if (action === "assignments") {
    const assignments = await prisma.assignment.findMany({
      where: { classroomId },
      include: {
        submissions: { where: { userId: dbUser.id } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ assignments });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// POST /api/classroom — join or send message
export async function POST(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await request.json();
  const { type } = body;

  if (type === "join") {
    const { code } = body;
    const classroom = await prisma.classroom.findUnique({ where: { code } });
    if (!classroom) return NextResponse.json({ error: "Code invalide" }, { status: 404 });
    if (!classroom.isActive) return NextResponse.json({ error: "Cette classe est inactive" }, { status: 400 });

    const count = await prisma.classroomEnrollment.count({ where: { classroomId: classroom.id, isActive: true } });
    if (count >= classroom.maxStudents) return NextResponse.json({ error: "Classe complète" }, { status: 400 });

    const enrollment = await prisma.classroomEnrollment.upsert({
      where: { classroomId_userId: { classroomId: classroom.id, userId: dbUser.id } },
      update: { isActive: true },
      create: { classroomId: classroom.id, userId: dbUser.id },
    });
    return NextResponse.json({ enrollment, classroom });
  }

  if (type === "submit") {
    const { assignmentId, score, feedback } = body;
    const submission = await prisma.assignmentSubmission.upsert({
      where: { assignmentId_userId: { assignmentId, userId: dbUser.id } },
      update: { score, feedback },
      create: { assignmentId, userId: dbUser.id, score, feedback },
    });
    return NextResponse.json({ submission });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
