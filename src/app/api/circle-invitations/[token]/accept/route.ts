// P4.2 · POST /api/circle-invitations/[token]/accept
//
// Le token brut est passé dans l'URL · résolu par hash côté serveur.
// L'user authentifié doit correspondre à l'email invité (défense sanity).

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFlag } from "@/lib/flags";
import { PermissionError, resolveCircleActor } from "@/lib/permissions/circle";
import {
  acceptInvitation,
  revokeInvitationForCapacity,
  InvitationError,
} from "@/lib/invitations/service";
import { CapacityError } from "@/lib/circles/memberships";
import { writeAuditEvent } from "@/lib/audit/events";
import { mapErrorToResponse, err } from "@/lib/api/circleErrors";
import { withSerializableRetry } from "@/lib/db/retry";
import { hashToken } from "@/lib/invitations/tokens";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  if (!getFlag("CIRCLE_ENABLED")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const { token } = await params;
  if (!token || token.length < 32) {
    return err("validation_error", "invalid token", 400);
  }
  try {
    // Résout email de l'user authentifié (via Supabase getUser).
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) throw new PermissionError("UNAUTHORIZED", "not signed in");
    const actor = await resolveCircleActor();

    // Retry limité sur 40001 / P2034. Le lock advisory pris dans
    // acceptInvitation() serialise les accepts concurrents sur le même
    // Circle, ce qui limite les collisions à des cas rares.
    const result = await withSerializableRetry(
      () =>
        prisma.$transaction(
          async (tx) => {
            const accepted = await acceptInvitation(tx, {
              rawToken: token,
              actorUserId: actor.userId,
              actorEmail: user.email!,
            });
            await writeAuditEvent(
              {
                actorUserId: actor.userId,
                actorRole: "ADULT",
                action: "ADULT_INVITATION_ACCEPTED",
                targetType: "CircleMembership",
                targetId: accepted.membershipId,
                scopeType: "Circle",
                scopeId: accepted.circleId,
              },
              tx,
            );
            return accepted;
          },
          { isolationLevel: "Serializable" },
        ),
      { errorCode: "concurrent_invitation_update" },
    );
    return NextResponse.json({
      membership: { id: result.membershipId, circleId: result.circleId, role: "ADULT" },
    });
  } catch (e) {
    // Cas concurrent · une accept a échoué parce que le cap 2 adultes est
    // atteint. On marque l'invitation perdante REVOKED avec reason stable
    // dans une TX séparée + AuditEvent, pour éviter qu'un lien apparemment
    // valide reste actionnable.
    if (e instanceof CapacityError && e.code === "max_adults_reached") {
      try {
        const tokenHash = hashToken(token);
        await prisma.$transaction(async (tx) => {
          const inv = await tx.circleInvitation.findUnique({
            where: { tokenHash },
            select: { id: true, circleId: true },
          });
          if (!inv) return;
          const revoked = await revokeInvitationForCapacity(tx, inv.id);
          if (revoked) {
            await writeAuditEvent(
              {
                actorUserId: null,
                actorRole: "SYSTEM",
                action: "ADULT_INVITATION_REVOKED",
                targetType: "CircleInvitation",
                targetId: inv.id,
                scopeType: "Circle",
                scopeId: inv.circleId,
                metadata: { reasonCode: "adult_capacity_reached" },
              },
              tx,
            );
          }
        });
      } catch (revokeErr) {
        console.warn("[accept] auto-revoke on capacity failed", (revokeErr as Error).message);
      }
    }
    return mapErrorToResponse(e);
  }
}
