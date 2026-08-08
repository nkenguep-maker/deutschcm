import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";
import {
  BetaInviteError,
  createBetaInviteToken,
  isClosedBetaEnabled,
  normalizeInviteEmail,
} from "@/lib/beta/invite";
import { isSameOriginRequest } from "@/lib/security/requestOrigin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const input = body as { email?: unknown; locale?: unknown };
  if (typeof input.email !== "string") {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  const email = normalizeInviteEmail(input.email);
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  const locale = input.locale === "en" ? "en" : "fr";

  let token: string;
  try {
    token = createBetaInviteToken({ email });
  } catch (error) {
    if (error instanceof BetaInviteError && error.code === "invite_secret_missing") {
      console.error("[admin/beta/invite] YEMA_BETA_INVITE_SECRET missing or too short");
      return NextResponse.json({ error: "Beta invitation is not configured" }, { status: 503 });
    }
    throw error;
  }

  const inviteUrl = new URL(`/${locale}/beta/accept`, request.nextUrl.origin);
  inviteUrl.searchParams.set("token", token);

  const copy = locale === "en"
    ? {
        subject: "Your YEMA closed beta invitation",
        title: "Your YEMA access is ready.",
        body: "This invitation is valid for 72 hours and is tied to this email address.",
        cta: "Accept my invitation",
      }
    : {
        subject: "Votre invitation à la bêta fermée YEMA",
        title: "Votre accès YEMA est prêt.",
        body: "Cette invitation est valable 72 heures et liée à cette adresse e-mail.",
        cta: "Accepter mon invitation",
      };

  const delivery = await sendEmail({
    to: email,
    subject: copy.subject,
    html: `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#0f0b07;color:#f7f1e8;padding:32px"><div style="max-width:560px;margin:0 auto"><p style="color:#d7b56d;font-size:12px;letter-spacing:.12em;text-transform:uppercase">YEMA · Closed beta</p><h1 style="font-size:28px">${copy.title}</h1><p style="line-height:1.7;color:#d9d0c5">${copy.body}</p><p style="margin-top:28px"><a href="${inviteUrl.toString()}" style="display:inline-block;background:#d7b56d;color:#0f0b07;text-decoration:none;padding:13px 20px;border-radius:999px;font-weight:700">${copy.cta}</a></p></div></body></html>`,
  });

  // The raw token is returned only to the authenticated admin so the invite
  // can still be copied if transactional email is unavailable. It is never
  // persisted by YEMA.
  return NextResponse.json({
    ok: true,
    inviteUrl: inviteUrl.toString(),
    emailSent: delivery.success,
    expiresInSeconds: 72 * 60 * 60,
  });
}
