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

// POST /api/classroom/join — join via code (creates pending enrollment)
export async function POST(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { code } = await request.json();
  if (!code) return NextResponse.json({ error: "Code requis" }, { status: 400 });

  const classroom = await prisma.classroom.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      teacher: { include: { user: { select: { fullName: true } } } },
      enrollments: { where: { isActive: true } },
    },
  });

  if (!classroom || !classroom.isActive) {
    return NextResponse.json({ error: "Code invalide ou classe inactive" }, { status: 404 });
  }

  if (classroom.enrollments.length >= classroom.maxStudents) {
    return NextResponse.json({ error: "Cette classe est complète" }, { status: 400 });
  }

  // Create enrollment (pending — isValidated=false on user)
  await prisma.classroomEnrollment.upsert({
    where: { classroomId_userId: { classroomId: classroom.id, userId: dbUser.id } },
    create: { classroomId: classroom.id, userId: dbUser.id },
    update: { isActive: true },
  });

  // Update user studentType and classroomCode
  await prisma.user.update({
    where: { id: dbUser.id },
    data: { studentType: "classroom", classroomCode: code.toUpperCase(), isValidated: false },
  });

  // Notify teacher
  await prisma.notification.create({
    data: {
      userId: classroom.teacher.userId,
      title: "📋 Nouvelle demande d'inscription",
      body: `${dbUser.fullName} souhaite rejoindre votre classe "${classroom.name}". Validez sa demande dans l'espace enseignant.`,
      type: "enrollment_request",
    },
  });

  return NextResponse.json({
    ok: true,
    teacherName: classroom.teacher.user.fullName,
    classroomName: classroom.name,
    message: `Demande envoyée à ${classroom.teacher.user.fullName}. Vous serez notifié par email.`,
  });
}
