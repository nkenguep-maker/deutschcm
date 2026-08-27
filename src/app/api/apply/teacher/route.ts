// POST /api/apply/teacher — Sprint 5.
// Formulaire public d'accréditation enseignant·e. La route enregistre une
// demande RECEIVED ; aucun rôle, accès ou délai de traitement n'est promis.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";
import { isSameOriginRequest } from "@/lib/security/requestOrigin";

interface Payload {
  fullName?: unknown;
  email?: unknown;
  whatsapp?: unknown;
  city?: unknown;
  languages?: unknown;
  experience?: unknown;
}

const ADMIN_EMAIL = process.env.YEMA_ADMIN_EMAIL ?? "hello@yema.app";
const MAX_APPLICATIONS_PER_EMAIL_PER_HOUR = 3;
const MAX_FULL_NAME = 120;
const MAX_EMAIL = 254;
const MAX_WHATSAPP = 40;
const MAX_CITY = 120;
const MAX_LANGUAGES = 240;
const MAX_EXPERIENCE = 2000;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function acknowledgeHtml(fullName: string, locale: "fr" | "en"): string {
  const safeFullName = escapeHtml(fullName);
  const heading = locale === "en"
    ? "Application received."
    : "Demande reçue.";
  const line1 = locale === "en"
    ? "Every teacher application is reviewed before accreditation."
    : "Chaque demande enseignant·e est étudiée avant toute accréditation.";
  const line2 = locale === "en"
    ? "We will contact you after reviewing your application."
    : "Nous vous contacterons après examen de votre demande.";
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#1B120A;font-family:Georgia,serif">
    <div style="max-width:560px;margin:0 auto;padding:48px 24px;color:#F4EBDC">
      <p style="font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.22em;color:#B8873E;text-transform:uppercase;margin:0 0 18px">YEMA · Accréditation enseignant·e</p>
      <h1 style="font-style:italic;font-size:28px;line-height:1.15;color:#F4EBDC;margin:0 0 18px">${safeFullName ? safeFullName + "," : ""} ${heading}</h1>
      <p style="font-size:16px;line-height:1.65;color:rgba(244,235,220,0.72);margin:0 0 12px">${line1}</p>
      <p style="font-size:16px;line-height:1.65;color:rgba(244,235,220,0.72);margin:0">${line2}</p>
    </div>
  </body></html>`;
}

function adminHtml(app: {
  fullName: string; email: string; whatsapp?: string | null; city: string;
  languages: string; experience: string;
}): string {
  const fullName = escapeHtml(app.fullName);
  const email = escapeHtml(app.email);
  const whatsapp = escapeHtml(app.whatsapp ?? "—");
  const city = escapeHtml(app.city);
  const languages = escapeHtml(app.languages);
  const experience = escapeHtml(app.experience);

  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif">
    <h2>Nouvelle demande d'accréditation enseignant·e</h2>
    <table style="border-collapse:collapse;font-size:14px">
      <tr><td style="padding:6px 12px;color:#666">Nom</td><td style="padding:6px 12px"><strong>${fullName}</strong></td></tr>
      <tr><td style="padding:6px 12px;color:#666">Email</td><td style="padding:6px 12px">${email}</td></tr>
      <tr><td style="padding:6px 12px;color:#666">WhatsApp</td><td style="padding:6px 12px">${whatsapp}</td></tr>
      <tr><td style="padding:6px 12px;color:#666">Ville</td><td style="padding:6px 12px">${city}</td></tr>
      <tr><td style="padding:6px 12px;color:#666">Langue(s)</td><td style="padding:6px 12px">${languages}</td></tr>
      <tr><td style="padding:6px 12px;color:#666;vertical-align:top">Diplôme / expérience</td><td style="padding:6px 12px;white-space:pre-wrap">${experience}</td></tr>
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
      typeof body.fullName !== "string" ||
      typeof body.email !== "string" ||
      typeof body.city !== "string" ||
      typeof body.languages !== "string" ||
      typeof body.experience !== "string" ||
      (body.whatsapp !== undefined && body.whatsapp !== null && typeof body.whatsapp !== "string")
    ) {
      return NextResponse.json({ ok: false, error: "invalid_fields" }, { status: 400 });
    }

    const fullName = body.fullName.trim();
    const email = body.email.trim().toLowerCase();
    const city = body.city.trim();
    const languages = body.languages.trim();
    const experience = body.experience.trim();
    const whatsapp = typeof body.whatsapp === "string" ? body.whatsapp.trim() : null;

    if (!fullName || !email || !city || !languages || !experience) {
      return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
    }
    if (
      fullName.length > MAX_FULL_NAME ||
      email.length > MAX_EMAIL ||
      (whatsapp?.length ?? 0) > MAX_WHATSAPP ||
      city.length > MAX_CITY ||
      languages.length > MAX_LANGUAGES ||
      experience.length > MAX_EXPERIENCE
    ) {
      return NextResponse.json({ ok: false, error: "field_too_long" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await prisma.teacherApplication.count({
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

    const app = await prisma.teacherApplication.create({
      data: {
        fullName,
        email,
        whatsapp,
        city,
        languages,
        experience,
      },
    });

    const locale: "fr" | "en" =
      (request.nextUrl.searchParams.get("locale") ?? "fr") === "en" ? "en" : "fr";

    if (process.env.RESEND_API_KEY) {
      await Promise.allSettled([
        sendEmail({
          to: ADMIN_EMAIL,
          subject: `[YEMA] Nouvelle demande enseignant·e · ${fullName}`,
          html: adminHtml({
            fullName, email, whatsapp, city, languages, experience,
          }),
          from: "YEMA <noreply@deutschcm.vercel.app>",
        }),
        sendEmail({
          to: email,
          subject: locale === "en"
            ? "YEMA · Your application"
            : "YEMA · Votre demande",
          html: acknowledgeHtml(fullName, locale),
          from: "YEMA <noreply@deutschcm.vercel.app>",
        }),
      ]);
    }

    return NextResponse.json({ ok: true, id: app.id });
  } catch (err) {
    console.error("[apply/teacher] error:", err);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
