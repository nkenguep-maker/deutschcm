import { NextResponse } from "next/server";
import { isTeacherWorkspaceActive } from "@/lib/flags";
import { resolveTeacherActor } from "@/lib/permissions/teacher";
import { getTeacherDashboard } from "@/lib/teacher/queries";
import { mapErrorToResponse } from "@/lib/api/circleErrors";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!isTeacherWorkspaceActive()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const actor = await resolveTeacherActor();
    const [stats, profile] = await Promise.all([
      getTeacherDashboard(actor.teacherId),
      prisma.user.findUnique({
        where: { id: actor.userId },
        select: { fullName: true, city: true },
      }),
    ]);
    return NextResponse.json({
      teacher: actor.teacher,
      profile: {
        fullName: profile?.fullName ?? null,
        city: profile?.city ?? null,
      },
      center: actor.center,
      stats,
    });
  } catch (e) {
    return mapErrorToResponse(e);
  }
}
