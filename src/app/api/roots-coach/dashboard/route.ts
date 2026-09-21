import { NextResponse } from "next/server";
import { isRootsCoachWorkspaceActive } from "@/lib/flags";
import { resolveRootsCoachActor } from "@/lib/permissions/rootsCoach";
import { getRootsCoachDashboard } from "@/lib/rootsCoach/queries";
import { mapErrorToResponse } from "@/lib/api/circleErrors";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!isRootsCoachWorkspaceActive()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const actor = await resolveRootsCoachActor();
    const [stats, profile] = await Promise.all([
      getRootsCoachDashboard(actor.userId),
      prisma.user.findUnique({
        where: { id: actor.userId },
        select: { fullName: true, city: true, qualifications: true },
      }),
    ]);
    return NextResponse.json({
      actorRole: actor.actorRole,
      profile: {
        fullName: profile?.fullName ?? null,
        city: profile?.city ?? null,
        qualifications: profile?.qualifications ?? null,
      },
      stats,
    });
  } catch (e) {
    return mapErrorToResponse(e);
  }
}
