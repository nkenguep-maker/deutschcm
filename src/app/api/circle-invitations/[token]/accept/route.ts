// P4.2 · POST /api/circle-invitations/[token]/accept
//
// Le token brut est passé dans l'URL · résolu par hash côté serveur.
// L'user authentifié doit correspondre à l'email invité (défense sanity).

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFlag } from "@/lib/flags";
import { PermissionError, resolveCircleActor } from "@/lib/permissions/circle";
import { acceptInvitation } from "@/lib/invitations/service";
import { writeAuditEvent } from "@/lib/audit/events";
import { mapErrorToResponse, err } from "@/lib/api/circleErrors";
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

    const result = await prisma.$transaction(
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
    );
    return NextResponse.json({
      membership: { id: result.membershipId, circleId: result.circleId, role: "ADULT" },
    });
  } catch (e) {
    return mapErrorToResponse(e);
  }
}
