// P4.2 · POST /api/circles/[circleId]/invitations/adult
//
// OWNER seul. Crée une invitation ADULT (72h expiry). Retourne le token brut
// en mode test uniquement (X-P4-Test-Token) · en prod P5, un service email
// écoutera ADULT_CIRCLE_INVITATION_CREATED.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFlag } from "@/lib/flags";
import { resolveCircleActor } from "@/lib/permissions/circle";
import { createAdultInvitation } from "@/lib/invitations/service";
import { generateRawToken } from "@/lib/invitations/tokens";
import { writeAuditEvent } from "@/lib/audit/events";
import { mapErrorToResponse, err } from "@/lib/api/circleErrors";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ circleId: string }> },
) {
  if (!getFlag("CIRCLE_ENABLED")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const { circleId } = await params;
  const body = await request.json().catch(() => ({}));
  const email = typeof body?.email === "string" ? body.email : null;
  if (!email || !email.includes("@")) {
    return err("validation_error", "email required", 400);
  }
  try {
    const actor = await resolveCircleActor();
    const rawToken = generateRawToken();
    const result = await prisma.$transaction(
      async (tx) => {
        const invitation = await createAdultInvitation(tx, {
          circleId,
          ownerUserId: actor.userId,
          invitedEmail: email,
          rawToken,
        });
        await writeAuditEvent(
          {
            actorUserId: actor.userId,
            actorRole: "OWNER",
            action: "ADULT_INVITED",
            targetType: "CircleInvitation",
            targetId: invitation.id,
            scopeType: "Circle",
            scopeId: circleId,
            metadata: { role: "ADULT", expiresAt: invitation.expiresAt.toISOString() },
          },
          tx,
        );
        return invitation;
      },
      { isolationLevel: "Serializable" },
    );
    const res = NextResponse.json({
      invitation: { id: result.id, circleId: result.circleId, expiresAt: result.expiresAt },
    });
    // Test only · le vrai flow email arrive en P5. On expose le token via un
    // header uniquement quand YEMA_ALLOW_TEST_TOKENS=true (jamais en prod).
    if (process.env.YEMA_ALLOW_TEST_TOKENS === "true") {
      res.headers.set("X-P4-Test-Token", rawToken);
    }
    return res;
  } catch (e) {
    return mapErrorToResponse(e);
  }
}
