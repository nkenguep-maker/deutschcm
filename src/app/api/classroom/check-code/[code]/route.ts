import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const classroom = await prisma.classroom.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      teacher: { include: { user: { select: { fullName: true, city: true } } } },
      center: { select: { name: true, city: true } },
      enrollments: { where: { isActive: true } },
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
