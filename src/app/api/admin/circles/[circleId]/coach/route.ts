// P4.2 · POST / DELETE /api/admin/circles/[circleId]/coach
//
// ADMIN uniquement (rôle YEMA_ADMIN). Assigne ou retire un coach RACINES_COACH
// sur le cercle. Respecte capacité Q15 (20 profils / 10 Circles).

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFlag } from "@/lib/flags";
import { PermissionError } from "@/lib/permissions/circle";
import { resolveAdminActor } from "@/lib/permissions/admin";
import { assignCoach, removeCoach } from "@/lib/circles/memberships";
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
  const coachUserId = typeof body?.coachUserId === "string" ? body.coachUserId : null;
  if (!coachUserId) return err("validation_error", "coachUserId required", 400);
  try {
    const admin = await resolveAdminActor();
    const result = await prisma.$transaction(
      async (tx) => {
        const m = await assignCoach(tx, {
          circleId, coachUserId, adminUserId: admin.userId,
        });
        await writeAuditEvent(
          {
            actorUserId: admin.userId,
            actorRole: "YEMA_ADMIN",
            action: "COACH_ASSIGNED",
            targetType: "CircleMembership",
            targetId: m.id,
            scopeType: "Circle",
            scopeId: circleId,
            metadata: { coachUserId },
          },
          tx,
        );
        return m;
      },
      { isolationLevel: "Serializable" },
    );
    return NextResponse.json({ membership: { id: result.id, role: "COACH" } });
  } catch (e) {
    if (e instanceof PermissionError && e.code === "FORBIDDEN") {
      await auditAccessDenied({
        actorUserId: null,
        actorRole: "UNKNOWN",
        circleId,
        targetType: "Coach",
        reasonCode: "admin_required_for_coach_assign",
      });
    }
    return mapErrorToResponse(e);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ circleId: string }> },
) {
  if (!getFlag("CIRCLE_ENABLED")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const { circleId } = await params;
  try {
    const admin = await resolveAdminActor();
    const result = await prisma.$transaction(
      async (tx) => {
        const removed = await removeCoach(tx, { circleId });
        if (removed.removedMembershipId) {
          await writeAuditEvent(
            {
              actorUserId: admin.userId,
              actorRole: "YEMA_ADMIN",
              action: "COACH_REMOVED",
              targetType: "CircleMembership",
              targetId: removed.removedMembershipId,
              scopeType: "Circle",
              scopeId: circleId,
              metadata: { previousCoachUserId: removed.previousCoachUserId },
            },
            tx,
          );
        }
        return removed;
      },
      { isolationLevel: "Serializable" },
    );
    return NextResponse.json({
      ok: true, removedMembershipId: result.removedMembershipId,
    });
  } catch (e) {
    if (e instanceof PermissionError && e.code === "FORBIDDEN") {
      await auditAccessDenied({
        actorUserId: null,
        actorRole: "UNKNOWN",
        circleId,
        targetType: "Coach",
        reasonCode: "admin_required_for_coach_remove",
      });
    }
    return mapErrorToResponse(e);
  }
}
