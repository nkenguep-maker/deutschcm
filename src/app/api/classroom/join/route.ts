import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { hasReachedJoinRequestQuota } from "@/lib/social/rateLimit";
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
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

function rateLimited() {
  return NextResponse.json(
    { error: "Too many requests", code: "class_join_rate_limited" },
    { status: 429, headers: { "Retry-After": "3600" } },
  );
}

// POST /api/classroom/join — crée une demande. L'enrollment ne devient actif
// qu'après acceptation explicite par l'enseignant via /api/social respond.
export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const code = typeof (body as { code?: unknown } | null)?.code === "string"
    ? (body as { code: string }).code.trim().toUpperCase()
    : "";
  if (!code || code.length > 64) {
    return NextResponse.json({ error: "Code requis" }, { status: 400 });
  }

  const classroom = await prisma.classroom.findUnique({
    where: { code },
    include: {
      teacher: { include: { user: { select: { id: true, fullName: true } } } },
      enrollments: { where: { isActive: true }, select: { userId: true } },
    },
  });

  if (!classroom || !classroom.isActive) {
    return NextResponse.json({ error: "Code invalide ou classe inactive" }, { status: 404 });
  }

  if (classroom.enrollments.length >= classroom.maxStudents) {
    return NextResponse.json({ error: "Cette classe est complète" }, { status: 409 });
  }

  const enrollment = await prisma.classroomEnrollment.findUnique({
    where: { classroomId_userId: { classroomId: classroom.id, userId: dbUser.id } },
    select: { isActive: true },
  });
  if (enrollment?.isActive) {
    return NextResponse.json({ error: "Vous êtes déjà inscrit à cette classe" }, { status: 409 });
  }

  const existing = await prisma.classJoinRequest.findFirst({
    where: {
      fromUserId: dbUser.id,
      toClassroomId: classroom.id,
      status: "pending",
    },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      {
        ok: true,
        pending: true,
        requestId: existing.id,
        teacherName: classroom.teacher.user.fullName,
        classroomName: classroom.name,
      },
      { status: 200 },
    );
  }

  if (await hasReachedJoinRequestQuota(dbUser.id)) return rateLimited();

  const joinRequest = await prisma.classJoinRequest.create({
    data: {
      fromUserId: dbUser.id,
      toClassroomId: classroom.id,
    },
    select: { id: true },
  });

  // Aucun ClassroomEnrollment, classroomCode, studentType ou isValidated
  // n'est muté avant la décision de l'enseignant.
  await prisma.notification.create({
    data: {
      userId: classroom.teacher.user.id,
      title: "📋 Nouvelle demande d'inscription",
      body: `${dbUser.fullName} souhaite rejoindre votre classe "${classroom.name}". Validez sa demande dans l'espace enseignant.`,
      type: "enrollment_request",
      metadata: {
        requestId: joinRequest.id,
        classroomId: classroom.id,
        studentName: dbUser.fullName,
      },
    },
  });

  return NextResponse.json({
    ok: true,
    pending: true,
    requestId: joinRequest.id,
    teacherName: classroom.teacher.user.fullName,
    classroomName: classroom.name,
    message: `Demande envoyée à ${classroom.teacher.user.fullName}.`,
  }, { status: 201 });
}
