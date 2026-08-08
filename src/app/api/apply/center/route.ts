// POST /api/apply/center — Sprint 7.
// Formulaire public de demande de démo centre. Aucune tarification ni
// promesse commerciale n'est créée ici : la route enregistre uniquement
// une demande RECEIVED et envoie des notifications si l'email est configuré.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";
import { isSameOriginRequest } from "@/lib/security/requestOrigin";

interface Payload {
  centerName?: unknown;
  city?: unknown;
  whatsapp?: unknown;
  email?: unknown;
}

const ADMIN_EMAIL = process.env.YEMA_ADMIN_EMAIL ?? "hello@yema.app";
const MAX_APPLICATIONS_PER_EMAIL_PER_HOUR = 3;
const MAX_CENTER_NAME = 120;
const MAX_CITY = 120;
const MAX_EMAIL = 254;
const MAX_WHATSAPP = 40;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function acknowledgeHtml(centerName: string, locale: "fr" | "en"): string {
  const safeCenterName = escapeHtml(centerName);
  const heading = locale === "en"
    ? "Demo request received."
    : "Demande de démo reçue.";
  const line1 = locale === "en"
    ? "Every center is reviewed before beta access is considered."
    : "Chaque centre est étudié avant qu'un accès bêta soit envisagé.";
  const line2 = locale === "en"
    ? "We will contact you after reviewing your request."
    : "Nous vous contacterons après examen de votre demande.";
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#1B120A;font-family:Georgia,serif">
    <div style="max-width:560px;margin:0 auto;padding:48px 24px;color:#F4EBDC">
      <p style="font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.22em;color:#B8873E;text-transform:uppercase;margin:0 0 18px">YEMA · Démo centre</p>
      <h1 style="font-style:italic;font-size:28px;line-height:1.15;color:#F4EBDC;margin:0 0 18px">${safeCenterName}, ${heading}</h1>
      <p style="font-size:16px;line-height:1.65;color:rgba(244,235,220,0.72);margin:0 0 12px">${line1}</p>
      <p style="font-size:16px;line-height:1.65;color:rgba(244,235,220,0.72);margin:0">${line2}</p>
    </div>
  </body></html>`;
}

function adminHtml(app: {
  centerName: string; city: string; whatsapp?: string | null; email: string;
}): string {
  const centerName = escapeHtml(app.centerName);
  const city = escapeHtml(app.city);
  const email = escapeHtml(app.email);
  const whatsapp = escapeHtml(app.whatsapp ?? "—");
  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif">
    <h2>Nouvelle demande de démo centre</h2>
    <table style="border-collapse:collapse;font-size:14px">
      <tr><td style="padding:6px 12px;color:#666">Centre</td><td style="padding:6px 12px"><strong>${centerName}</strong></td></tr>
      <tr><td style="padding:6px 12px;color:#666">Ville</td><td style="padding:6px 12px">${city}</td></tr>
      <tr><td style="padding:6px 12px;color:#666">Email</td><td style="padding:6px 12px">${email}</td></tr>
      <tr><td style="padding:6px 12px;color:#666">WhatsApp</td><td style="padding:6px 12px">${whatsapp}</td></tr>
    </table>
    <p style="color:#666;font-size:13px;margin-top:24px">À examiner dans la console Admin.</p>
  </body></html>`;
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  try {
    const raw = await request.json().catch(() => null);
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
    }
    const body = raw as Payload;

    if (
      typeof body.centerName !== "string" ||
      typeof body.city !== "string" ||
      typeof body.email !== "string" ||
      (body.whatsapp !== undefined && body.whatsapp !== null && typeof body.whatsapp !== "string")
    ) {
      return NextResponse.json({ ok: false, error: "invalid_fields" }, { status: 400 });
    }

    const centerName = body.centerName.trim();
    const city = body.city.trim();
    const email = body.email.trim().toLowerCase();
    const whatsapp = typeof body.whatsapp === "string" ? body.whatsapp.trim() : null;

    if (!centerName || !city || !email) {
      return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
    }
    if (
      centerName.length > MAX_CENTER_NAME ||
      city.length > MAX_CITY ||
      email.length > MAX_EMAIL ||
      (whatsapp?.length ?? 0) > MAX_WHATSAPP
    ) {
      return NextResponse.json({ ok: false, error: "field_too_long" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await prisma.centerApplication.count({
      where: {
        email: { equals: email, mode: "insensitive" },
        createdAt: { gte: oneHourAgo },
      },
    });
    if (recentCount >= MAX_APPLICATIONS_PER_EMAIL_PER_HOUR) {
      return NextResponse.json(
        { ok: false, error: "rate_limited" },
        { status: 429, headers: { "Retry-After": "3600" } },
      );
    }

    const app = await prisma.centerApplication.create({
      data: { centerName, city, email, whatsapp },
    });

    const locale: "fr" | "en" =
      (request.nextUrl.searchParams.get("locale") ?? "fr") === "en" ? "en" : "fr";

    if (process.env.RESEND_API_KEY) {
      Promise.allSettled([
        sendEmail({
          to: ADMIN_EMAIL,
          subject: `[YEMA] Démo centre · ${centerName}`,
          html: adminHtml({ centerName, city, email, whatsapp }),
          from: "YEMA <noreply@deutschcm.vercel.app>",
        }),
        sendEmail({
          to: email,
          subject: locale === "en"
            ? "YEMA · Your demo request"
            : "YEMA · Votre demande de démo",
          html: acknowledgeHtml(centerName, locale),
          from: "YEMA <noreply@deutschcm.vercel.app>",
        }),
      ]).catch(() => undefined);
    }

    return NextResponse.json({ ok: true, id: app.id });
  } catch (err) {
    console.error("[apply/center] error:", err);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
