import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          content: true,
          videoUrl: true,
          sortOrder: true,
          xpReward: true,
          isPublished: true,
        },
      },
    },
  });

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  return NextResponse.json({ course });
}
