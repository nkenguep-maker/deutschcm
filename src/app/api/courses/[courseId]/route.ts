import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

async function getActor() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  return prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: {
      id: true,
      role: true,
      userRoles: {
        where: { status: "ACTIVE" },
        select: { role: true },
      },
    },
  });
}

function hasPrivilegedCourseRole(actor: NonNullable<Awaited<ReturnType<typeof getActor>>>) {
  const roles = new Set([actor.role, ...actor.userRoles.map((entry) => entry.role)]);
  return roles.has("ADMIN") || roles.has("TEACHER");
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const actor = await getActor();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { courseId } = await params;
  const privileged = hasPrivilegedCourseRole(actor);

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        where: privileged ? undefined : { isPublished: true },
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

  if (privileged) {
    return NextResponse.json({ course });
  }

  // Learners never see draft courses, even when they know an internal ID.
  if (!course.isPublished) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const learningPath = await prisma.learningPath.findFirst({
    where: {
      userId: actor.id,
      universe: "MONDE",
      language: "DEUTSCH",
      status: "ACTIVE",
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, currentLevel: true },
  });
  if (!learningPath) {
    return NextResponse.json({ error: "Course access required" }, { status: 403 });
  }

  if (learningPath.currentLevel && course.level !== learningPath.currentLevel) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const now = new Date();
  const passageGrant = await prisma.accessGrant.findFirst({
    where: {
      status: "ACTIVE",
      startsAt: { lte: now },
      AND: [
        { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
        {
          OR: [
            { beneficiaryType: "USER", beneficiaryId: actor.id },
            { beneficiaryType: "LEARNING_PATH", beneficiaryId: learningPath.id },
          ],
        },
      ],
      productVariant: {
        active: true,
        language: "DEUTSCH",
        level: course.level,
        product: { code: "PASSAGE" },
      },
    },
    select: { id: true },
  });

  if (!passageGrant) {
    return NextResponse.json({ error: "Course access required" }, { status: 403 });
  }

  return NextResponse.json({ course });
}
