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

// GET /api/classroom/validate?classroomId=xxx — pending students
export async function GET(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const classroomId = request.nextUrl.searchParams.get("classroomId");

  const pending = await prisma.classroomEnrollment.findMany({
    where: {
      ...(classroomId ? { classroomId } : {}),
      isActive: true,
      user: { isValidated: false, studentType: "classroom" },
    },
    include: {
      user: { select: { id: true, fullName: true, email: true, germanLevel: true, createdAt: true, classroomCode: true } },
      classroom: { select: { name: true, level: true } },
    },
    orderBy: { joinedAt: "asc" },
  });

  return NextResponse.json({ pending: pending.map(e => ({ ...e.user, classroomName: e.classroom.name, classroomLevel: e.classroom.level, joinedAt: e.joinedAt })) });
}

// POST /api/classroom/validate — validate or refuse
export async function POST(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const validator = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
  if (!validator) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await request.json();
  const { action, studentId, reason } = body;

  const student = await prisma.user.findUnique({ where: { id: studentId } });
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  if (action === "validate") {
    await prisma.user.update({
      where: { id: studentId },
      data: { isValidated: true, validatedAt: new Date(), validatedBy: validator.id },
    });
    // Save notification
    await prisma.notification.create({
      data: {
        userId: studentId,
        title: "✅ Inscription validée !",
        body: `Votre inscription a été validée par ${validator.fullName}. Bienvenue dans la classe !`,
        type: "validation_approved",
      },
    });
    return NextResponse.json({ ok: true, message: "Étudiant validé" });
  }

  if (action === "refuse") {
    await prisma.user.update({
      where: { id: studentId },
      data: { isValidated: false, studentType: "solo" },
    });
    await prisma.classroomEnrollment.updateMany({
      where: { userId: studentId },
      data: { isActive: false },
    });
    await prisma.notification.create({
      data: {
        userId: studentId,
        title: "❌ Inscription refusée",
        body: `Votre inscription a été refusée. Raison : ${reason ?? "Non précisée"}. Vous pouvez continuer en mode solo.`,
        type: "validation_refused",
      },
    });
    return NextResponse.json({ ok: true, message: "Étudiant refusé" });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
