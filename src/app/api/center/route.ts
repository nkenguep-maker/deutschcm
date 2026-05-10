import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

function generateCenterCode(city: string): string {
  const prefix = (city ?? "CM").replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase().padEnd(3, "X");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${suffix}`;
}

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

async function getCenterUser(supabaseId: string) {
  return prisma.user.findUnique({
    where: { supabaseId },
    include: {
      teacher: { include: { center: { include: { teachers: { include: { user: true, classrooms: { include: { enrollments: true } } } }, classrooms: { include: { enrollments: true, assignments: true } } } } } },
    },
  });
}

function isCenterManager(role: string) {
  return role === "CENTER_MANAGER" || role === "ADMIN";
}

// GET /api/center — stats, students list, etc.
export async function GET(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    include: { teacher: { include: { center: true } } },
  });

  if (!dbUser || !isCenterManager(dbUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  const centerId = dbUser.teacher?.centerId ?? url.searchParams.get("centerId");

  if (action === "code" && centerId) {
    let center = await prisma.languageCenter.findUnique({ where: { id: centerId }, select: { id: true, code: true, city: true } });
    if (!center) return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });
    if (!center.code) {
      let code = generateCenterCode(center.city);
      while (await prisma.languageCenter.findUnique({ where: { code } })) {
        code = generateCenterCode(center.city);
      }
      center = await prisma.languageCenter.update({ where: { id: centerId }, data: { code }, select: { id: true, code: true, city: true } });
    }
    return NextResponse.json({ code: center.code });
  }

  if (action === "stats" && centerId) {
    const [teacherCount, classroomCount] = await Promise.all([
      prisma.teacher.count({ where: { centerId } }),
      prisma.classroom.count({ where: { centerId, isActive: true } }),
    ]);

    const classrooms = await prisma.classroom.findMany({
      where: { centerId },
      include: { enrollments: { where: { isActive: true } } },
    });
    const studentCount = classrooms.reduce((acc, c) => acc + c.enrollments.length, 0);

    return NextResponse.json({ teacherCount, classroomCount, studentCount, revenueXAF: 75000 });
  }

  if (action === "students" && centerId) {
    const [classrooms, directStudents] = await Promise.all([
      prisma.classroom.findMany({
        where: { centerId },
        include: {
          enrollments: {
            where: { isActive: true },
            include: { user: { select: { id: true, fullName: true, email: true, xpTotal: true, streakDays: true, lastActiveAt: true } } },
          },
        },
      }),
      prisma.user.findMany({
        where: { centerId, role: "STUDENT" },
        select: { id: true, fullName: true, email: true, xpTotal: true, streakDays: true, lastActiveAt: true },
      }),
    ]);
    const classroomStudentIds = new Set(classrooms.flatMap(c => c.enrollments.map(e => e.user.id)));
    const fromClassrooms = classrooms.flatMap(c => c.enrollments.map(e => ({ ...e.user, classroom: c.name, classroomId: c.id })));
    const fromDirect = directStudents
      .filter(s => !classroomStudentIds.has(s.id))
      .map(s => ({ ...s, classroom: "En attente d'affectation", classroomId: null }));
    return NextResponse.json({ students: [...fromClassrooms, ...fromDirect] });
  }

  return NextResponse.json({ center: dbUser.teacher?.center ?? null });
}

// POST /api/center — invite teacher, subscribe plan
export async function POST(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
  if (!dbUser || !isCenterManager(dbUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { type } = body;

  if (type === "invite-teacher") {
    // In production: send invitation email. Here we return a mock token.
    return NextResponse.json({ success: true, inviteToken: `INV-${Date.now()}` });
  }

  if (type === "subscribe") {
    const { plan, centerId } = body;
    const prices: Record<string, number> = { STARTER: 25000, PRO: 75000, ENTERPRISE: 150000 };
    return NextResponse.json({ success: true, plan, amount: prices[plan] ?? 25000, centerId });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
