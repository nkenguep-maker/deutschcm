import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { isSameOriginRequest } from "@/lib/security/requestOrigin";

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

async function hasActiveClassroomEnrollment(userId: string, classroomId: string): Promise<boolean> {
  const enrollment = await prisma.classroomEnrollment.findUnique({
    where: { classroomId_userId: { classroomId, userId } },
    select: { isActive: true },
  });
  return enrollment?.isActive === true;
}

function notFound() {
  return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
}

// Legacy learner endpoint.
//
// Reads are limited to the authenticated learner's own active enrollments.
// Mutating join/submission flows moved to the P4.7 approval/versioned routes
// and are deliberately not reimplemented here.
export async function GET(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    select: { id: true },
  });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const action = request.nextUrl.searchParams.get("action");
  const classroomId = request.nextUrl.searchParams.get("classroomId");

  if (!action) {
    const enrollments = await prisma.classroomEnrollment.findMany({
      where: { userId: dbUser.id, isActive: true },
      include: {
        classroom: {
          include: {
            teacher: { include: { user: { select: { fullName: true } } } },
            assignments: { orderBy: { dueDate: "asc" }, take: 3 },
            enrollments: { where: { isActive: true }, select: { id: true } },
          },
        },
      },
    });
    return NextResponse.json({ classrooms: enrollments.map((entry) => entry.classroom) });
  }

  if (!classroomId || classroomId.length > 128) {
    return NextResponse.json({ error: "classroomId required" }, { status: 400 });
  }

  // Never let a guessed classroom ID become an oracle for leaderboard or
  // assignments. This legacy surface is learner-only; teacher/admin use their
  // dedicated scoped endpoints.
  if (!(await hasActiveClassroomEnrollment(dbUser.id, classroomId))) {
    return notFound();
  }

  if (action === "leaderboard") {
    const enrollments = await prisma.classroomEnrollment.findMany({
      where: { classroomId, isActive: true },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            xpTotal: true,
            streakDays: true,
          },
        },
      },
      orderBy: { user: { xpTotal: "desc" } },
      take: 10,
    });
    return NextResponse.json({ leaderboard: enrollments.map((entry) => entry.user) });
  }

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

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    select: { id: true },
  });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await request.json().catch(() => null) as { type?: unknown } | null;
  const type = body?.type;

  if (type === "join") {
    return NextResponse.json(
      {
        error: "Use the classroom approval workflow",
        code: "CLASSROOM_JOIN_APPROVAL_REQUIRED",
        endpoint: "/api/classroom/join",
      },
      { status: 410 },
    );
  }

  if (type === "submit") {
    return NextResponse.json(
      {
        error: "Use the versioned student submission workflow",
        code: "CLASSROOM_SUBMISSION_WORKFLOW_REQUIRED",
      },
      { status: 410 },
    );
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
