// P4.2 · DELETE /api/circles/[circleId]/members/[membershipId]
// OWNER retire un membre ADULT · jamais un OWNER · jamais un CHILD (utiliser
// /children/[childProfileId] pour ça).

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFlag } from "@/lib/flags";
import { PermissionError, resolveCircleActor } from "@/lib/permissions/circle";
import { ownerRemoveAdult, MembershipError } from "@/lib/circles/memberships";
import { writeAuditEvent } from "@/lib/audit/events";
import { mapErrorToResponse, auditAccessDenied } from "@/lib/api/circleErrors";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ circleId: string; membershipId: string }> },
) {
  if (!getFlag("CIRCLE_ENABLED")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const { circleId, membershipId } = await params;
  try {
    const actor = await resolveCircleActor();
    const result = await prisma.$transaction(
      async (tx) => {
        const removed = await ownerRemoveAdult(tx, {
          circleId, ownerUserId: actor.userId, targetMembershipId: membershipId,
        });
        await writeAuditEvent(
          {
            actorUserId: actor.userId,
            actorRole: "OWNER",
            action: "ADULT_REMOVED",
            targetType: "CircleMembership",
            targetId: removed.removedMembershipId,
            scopeType: "Circle",
            scopeId: circleId,
            metadata: { removedUserId: removed.removedUserId },
          },
          tx,
        );
        return removed;
      },
      { isolationLevel: "Serializable" },
    );
    return NextResponse.json({ ok: true, removedMembershipId: result.removedMembershipId });
  } catch (e) {
    if (
      (e instanceof MembershipError && e.code === "forbidden") ||
      (e instanceof PermissionError && e.code === "FORBIDDEN")
    ) {
      await auditAccessDenied({
        actorUserId: null,
        actorRole: "UNKNOWN",
        circleId,
        targetType: "CircleMembership",
        targetId: membershipId,
        reasonCode: "owner_required_for_member_remove",
      });
    }
    return mapErrorToResponse(e);
  }
}
