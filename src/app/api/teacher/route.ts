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

  if (action === "dashboard") {
    const teacherWithDetails = await prisma.user.findUnique({
      where: { supabaseId: authUser.id },
      include: {
        teacher: {
          include: {
            classrooms: {
              include: {
                enrollments: {
                  include: {
                    user: {
                      select: {
                        id: true, fullName: true, email: true,
                        germanLevel: true, xpTotal: true, streakDays: true,
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!teacherWithDetails?.teacher) {
      return NextResponse.json({ success: true, classes: [], students: [], pendingRequests: [], assignments: [] });
    }

    const classroomIds = teacherWithDetails.teacher.classrooms.map(c => c.id);

    const pendingRequests = classroomIds.length > 0
      ? await prisma.classJoinRequest.findMany({
          where: { status: "pending", toClassroomId: { in: classroomIds } },
          include: {
            fromUser: { select: { id: true, fullName: true, email: true, germanLevel: true } }
          }
        })
      : [];

    const classes = teacherWithDetails.teacher.classrooms.map(cls => ({
      id: cls.id,
      name: cls.name,
      level: cls.level,
      code: cls.code,
      maxStudents: cls.maxStudents,
      isActive: cls.isActive,
      students: cls.enrollments.length,
      avgScore: 0,
    }));

    const students = teacherWithDetails.teacher.classrooms.flatMap(cls =>
      cls.enrollments.map(e => ({
        id: e.user.id,
        name: e.user.fullName,
        email: e.user.email,
        classId: cls.id,
        className: cls.name,
        level: e.user.germanLevel,
        xp: e.user.xpTotal,
        streak: e.user.streakDays,
        avgScore: 0,
        lastActive: "—",
        progress: 0,
      }))
    );

    const formattedRequests = pendingRequests.map(r => ({
      id: r.id,
      studentName: r.fromUser.fullName,
      studentEmail: r.fromUser.email,
      studentLevel: r.fromUser.germanLevel,
      message: r.message,
      classroomId: r.toClassroomId,
      className: teacherWithDetails.teacher!.classrooms.find(c => c.id === r.toClassroomId)?.name ?? "",
      date: r.createdAt,
    }));

    return NextResponse.json({
      success: true,
      teacher: {
        name: teacherWithDetails.fullName,
        city: teacherWithDetails.city,
        bio: teacherWithDetails.bio,
      },
      classes,
      students,
      pendingRequests: formattedRequests,
      assignments: [],
    });
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
