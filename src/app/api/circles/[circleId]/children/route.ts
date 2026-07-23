// P4.2 · POST /api/circles/[circleId]/children
// OWNER ajoute un ChildProfile de son foyer au Circle. Cap 4 + dédup.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFlag } from "@/lib/flags";
import { PermissionError, resolveCircleActor } from "@/lib/permissions/circle";
import { addChildToCircle, MembershipError } from "@/lib/circles/memberships";
import { writeAuditEvent } from "@/lib/audit/events";
import { mapErrorToResponse, auditAccessDenied, err } from "@/lib/api/circleErrors";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ circleId: string }> },
) {
  if (!getFlag("CIRCLE_ENABLED")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const { circleId } = await params;
  const body = await request.json().catch(() => ({}));
  const childProfileId = typeof body?.childProfileId === "string" ? body.childProfileId : null;
  if (!childProfileId) return err("validation_error", "childProfileId required", 400);
  try {
    const actor = await resolveCircleActor();
    const membership = await prisma.$transaction(
      async (tx) => {
        const m = await addChildToCircle(tx, {
          circleId, ownerUserId: actor.userId, childProfileId,
        });
        await writeAuditEvent(
          {
            actorUserId: actor.userId,
            actorRole: "OWNER",
            action: "CHILD_ADDED",
            targetType: "CircleMembership",
            targetId: m.id,
            scopeType: "Circle",
            scopeId: circleId,
            metadata: { childProfileId },
          },
          tx,
        );
        return m;
      },
      { isolationLevel: "Serializable" },
    );
    return NextResponse.json({ membership: { id: membership.id, role: "CHILD" } });
  } catch (e) {
    if (
      e instanceof MembershipError &&
      (e.code === "child_not_in_household" || e.code === "forbidden")
    ) {
      await auditAccessDenied({
        actorUserId: null,
        actorRole: "UNKNOWN",
        circleId,
        targetType: "ChildProfile",
        targetId: childProfileId,
        reasonCode: e.code === "child_not_in_household" ? "foreign_child_add_attempt" : "owner_required_for_child_add",
      });
    }
    if (e instanceof PermissionError && e.code === "FORBIDDEN") {
      await auditAccessDenied({
        actorUserId: null,
        actorRole: "UNKNOWN",
        circleId,
        targetType: "ChildProfile",
        targetId: childProfileId,
        reasonCode: "owner_required_for_child_add",
      });
    }
    return mapErrorToResponse(e);
  }
}
