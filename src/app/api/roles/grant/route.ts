import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import prisma from "@/lib/prisma";
import { grantRole, syncUserMetadata, type SpaceRole } from "@/lib/roles";
import { sendEmail, emailRoleGranted } from "@/lib/resend";
import { isSameOriginRequest } from "@/lib/security/requestOrigin";

// Endpoint admin — accorde un rôle à un compte. Rôle ADMIN uniquement.
// grantedBy = id de l'admin. Envoie un email de notification via Resend.

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

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, fullName: true, supabaseId: true },
  });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await grantRole({ userId: target.id, role: role as SpaceRole, grantedBy: adminDb.id });
  await syncUserMetadata({ supabaseId: target.supabaseId });

  sendEmail({
    to: target.email,
    subject: "Yema · nouvel accès accordé",
    html: emailRoleGranted(target.fullName, role),
  }).catch((err) => console.error("[roles/grant] email failed:", err));

  return NextResponse.json({ ok: true });
}
