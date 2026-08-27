import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

async function isAuthenticated() {
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
  return Boolean(user);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code: rawCode } = await params;
  const code = rawCode.trim().toUpperCase();
  if (code.length < 4 || code.length > 64) {
    return NextResponse.json({ valid: false, error: "Code invalide" }, { status: 400 });
  }

  const classroom = await prisma.classroom.findUnique({
    where: { code },
    include: {
      teacher: { include: { user: { select: { fullName: true, city: true } } } },
      center: { select: { name: true, city: true } },
      enrollments: { where: { isActive: true }, select: { id: true } },
    },
  });

  if (!classroom || !classroom.isActive) {
    return NextResponse.json({ valid: false, error: "Code invalide ou classe inactive" });
  }

  return NextResponse.json({
    valid: true,
    classroom: {
      id: classroom.id,
      name: classroom.name,
      level: classroom.level,
      teacherName: classroom.teacher.user.fullName,
      teacherCity: classroom.teacher.user.city,
      centerName: classroom.center?.name ?? null,
      centerCity: classroom.center?.city ?? null,
      enrolledCount: classroom.enrollments.length,
      maxStudents: classroom.maxStudents,
    },
  });
}
