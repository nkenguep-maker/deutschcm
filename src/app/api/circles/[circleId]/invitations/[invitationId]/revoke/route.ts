// P4.2 · POST /api/circles/[circleId]/invitations/[invitationId]/revoke
// OWNER seul · marque PENDING → REVOKED.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFlag } from "@/lib/flags";
import { resolveCircleActor } from "@/lib/permissions/circle";
import { revokeInvitation } from "@/lib/invitations/service";
import { writeAuditEvent } from "@/lib/audit/events";
import { mapErrorToResponse } from "@/lib/api/circleErrors";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ circleId: string; invitationId: string }> },
) {
  if (!getFlag("CIRCLE_ENABLED")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const { circleId, invitationId } = await params;
  try {
    const actor = await resolveCircleActor();
    await prisma.$transaction(
      async (tx) => {
        await revokeInvitation(tx, {
          invitationId,
          circleId,
          ownerUserId: actor.userId,
        });
        await writeAuditEvent(
          {
            actorUserId: actor.userId,
            actorRole: "OWNER",
            action: "ADULT_INVITATION_REVOKED",
            targetType: "CircleInvitation",
            targetId: invitationId,
            scopeType: "Circle",
            scopeId: circleId,
          },
          tx,
        );
      },
      { isolationLevel: "Serializable" },
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return mapErrorToResponse(e);
  }
}
