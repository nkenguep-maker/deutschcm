import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { isClosedBetaEnabled } from "@/lib/beta/invite";
import { revokeBetaInvitation } from "@/lib/beta/invitationStore";
import { isSameOriginRequest } from "@/lib/security/requestOrigin";

export async function POST(request: NextRequest) {
  if (!isClosedBetaEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: {
      userRoles: {
        where: { role: "ADMIN", status: "ACTIVE" },
        select: { id: true },
        take: 1,
      },
    },
  });
  if (!admin || admin.userRoles.length === 0) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const invitationId = body && typeof body === "object" && !Array.isArray(body)
    ? (body as { invitationId?: unknown }).invitationId
    : null;
  if (typeof invitationId !== "string" || invitationId.length === 0 || invitationId.length > 128) {
    return NextResponse.json({ error: "Invalid invitation" }, { status: 400 });
  }

  try {
    const revoked = await revokeBetaInvitation({ invitationId });
    if (!revoked) {
      return NextResponse.json(
        { error: "Invitation is already used, revoked or unavailable" },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/beta/invite/revoke] failed", error);
    return NextResponse.json({ error: "Invitation store unavailable" }, { status: 503 });
  }
}
