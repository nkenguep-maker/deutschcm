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

// GET /api/level-history?userId=xxx — fetch level history for a student
export async function GET(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  const history = await prisma.levelHistory.findMany({
    where: { userId },
    orderBy: { changedAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ history });
}

// POST /api/level-history — teacher modifies student level
export async function POST(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const teacher = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    select: { id: true, role: true, fullName: true },
  });
  if (!teacher || (teacher.role !== "TEACHER" && teacher.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { studentId, newLevel, reason } = await request.json();
  if (!studentId || !newLevel || !reason?.trim()) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
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
        reason: reason.trim(),
        changedBy: teacher.id,
      },
    }),
    prisma.notification.create({
      data: {
        userId: studentId,
        title: "📊 Niveau mis à jour",
        body: `Votre niveau a été modifié de ${oldLevel} → ${newLevel}. Raison : ${reason.trim()}`,
        type: "level-updated",
      },
    }),
  ]);

  return NextResponse.json({ ok: true, oldLevel, newLevel });
}
