import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { setBetaAccess } from "@/lib/beta/access";
import { isSameOriginRequest } from "@/lib/security/requestOrigin";

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: {
      id: true,
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
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { userId, enabled } = body as { userId?: unknown; enabled?: unknown };
  if (typeof userId !== "string" || userId.length === 0 || userId.length > 128 || typeof enabled !== "boolean") {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { supabaseId: true },
  });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    await setBetaAccess({ supabaseId: target.supabaseId, enabled });
  } catch (error) {
    console.error("[admin/beta/access] update failed", error);
    return NextResponse.json({ error: "Unable to update beta access" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, enabled });
}
