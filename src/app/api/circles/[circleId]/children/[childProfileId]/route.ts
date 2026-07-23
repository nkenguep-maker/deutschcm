// P4.2 · DELETE /api/circles/[circleId]/children/[childProfileId]
// OWNER retire un ChildProfile du Circle · soft-delete (REMOVED).
// Reset user_metadata.activeChildId côté user_metadata si nécessaire.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFlag } from "@/lib/flags";
import { resolveCircleActor } from "@/lib/permissions/circle";
import { removeChildFromCircle } from "@/lib/circles/memberships";
import { writeAuditEvent } from "@/lib/audit/events";
import { mapErrorToResponse } from "@/lib/api/circleErrors";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ circleId: string; childProfileId: string }> },
) {
  if (!getFlag("CIRCLE_ENABLED")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const { circleId, childProfileId } = await params;
  try {
    const actor = await resolveCircleActor();
    const result = await prisma.$transaction(
      async (tx) => {
        const removed = await removeChildFromCircle(tx, {
          circleId, ownerUserId: actor.userId, childProfileId,
        });
        await writeAuditEvent(
          {
            actorUserId: actor.userId,
            actorRole: "OWNER",
            action: "CHILD_REMOVED",
            targetType: "CircleMembership",
            targetId: removed.removedMembershipId,
            scopeType: "Circle",
            scopeId: circleId,
            metadata: { childProfileId },
          },
          tx,
        );
        return removed;
      },
      { isolationLevel: "Serializable" },
    );

    // Reset activeChildId dans user_metadata si le parent avait ce profil actif.
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.activeChildId === childProfileId) {
        await supabase.auth.updateUser({
          data: { ...user.user_metadata, activeChildId: null },
        });
      }
    } catch (e) {
      console.warn("[remove child] activeChildId reset failed (non-fatal):", (e as Error).message);
    }

    return NextResponse.json({ ok: true, removedMembershipId: result.removedMembershipId });
  } catch (e) {
    return mapErrorToResponse(e);
  }
}
