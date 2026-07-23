// P4.2 · POST /api/circles/[circleId]/leave
// Un membre non-OWNER quitte volontairement · OWNER interdit.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFlag } from "@/lib/flags";
import { resolveCircleActor } from "@/lib/permissions/circle";
import { adultLeaveCircle } from "@/lib/circles/memberships";
import { writeAuditEvent } from "@/lib/audit/events";
import { mapErrorToResponse } from "@/lib/api/circleErrors";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ circleId: string }> },
) {
  if (!getFlag("CIRCLE_ENABLED")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const { circleId } = await params;
  try {
    const actor = await resolveCircleActor();
    const result = await prisma.$transaction(
      async (tx) => {
        const left = await adultLeaveCircle(tx, { circleId, actorUserId: actor.userId });
        await writeAuditEvent(
          {
            actorUserId: actor.userId,
            actorRole: "ADULT",
            action: "ADULT_LEFT_CIRCLE",
            targetType: "CircleMembership",
            targetId: left.removedMembershipId,
            scopeType: "Circle",
            scopeId: circleId,
          },
          tx,
        );
        return left;
      },
      { isolationLevel: "Serializable" },
    );
    return NextResponse.json({ ok: true, removedMembershipId: result.removedMembershipId });
  } catch (e) {
    return mapErrorToResponse(e);
  }
}
