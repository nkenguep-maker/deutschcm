import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const center = await prisma.languageCenter.findUnique({
    where: { code: code.toUpperCase() },
    select: {
      id: true,
      name: true,
      city: true,
      country: true,
      logoUrl: true,
      plan: true,
      teachers: { select: { id: true } },
      classrooms: {
        where: { isActive: true },
        select: { enrollments: { where: { isActive: true }, select: { id: true } } },
      },
    },
  });

  if (!center) {
    return NextResponse.json({ valid: false, error: "Code de centre invalide" });
  }

  const studentCount = center.classrooms.reduce(
    (acc, c) => acc + c.enrollments.length, 0
  );

  return NextResponse.json({
    valid: true,
    center: {
      id: center.id,
      name: center.name,
      city: center.city,
      country: center.country,
      logoUrl: center.logoUrl,
      plan: center.plan,
      teacherCount: center.teachers.length,
      studentCount,
    },
  });
}
