import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import prisma from "@/lib/prisma";
import { revokeRole, syncUserMetadata, type SpaceRole } from "@/lib/roles";
import { isSameOriginRequest } from "@/lib/security/requestOrigin";

// Endpoint admin — retire un rôle d'un compte. Protège deux cas :
// (1) jamais retirer le dernier rôle actif (déjà géré dans revokeRole)
// (2) un admin ne peut pas retirer son propre ADMIN

const VALID: SpaceRole[] = ["STUDENT", "TEACHER", "CENTER", "ADMIN"];

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) =>
          list.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          ),
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const adminDb = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: {
      id: true,
      userRoles: { where: { status: "ACTIVE", role: "ADMIN" }, select: { id: true } },
    },
  });
  if (!adminDb || adminDb.userRoles.length === 0) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const userId = body && typeof body === "object" && !Array.isArray(body)
    ? (body as { userId?: unknown }).userId
    : null;
  const role = body && typeof body === "object" && !Array.isArray(body)
    ? (body as { role?: unknown }).role
    : null;
  if (
    typeof userId !== "string" || userId.length === 0 || userId.length > 128 ||
    typeof role !== "string" || !VALID.includes(role as SpaceRole)
  ) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  if (userId === adminDb.id && role === "ADMIN") {
    return NextResponse.json(
      { error: "Cannot revoke own ADMIN role" },
      { status: 400 },
    );
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { supabaseId: true },
  });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const result = await revokeRole({ userId, role: role as SpaceRole });
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }

  await syncUserMetadata({ supabaseId: target.supabaseId });
  return NextResponse.json({ ok: true });
}
