// POST /api/apply/center — Sprint 7.
// Formulaire de démo centre. Crée un CenterApplication (statut RECEIVED),
// email interne à l'admin, accusé au demandeur. Aucune promesse de tarif
// en public — les tarifs vivent dans /admin.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";

interface Payload {
  centerName?: string;
  city?: string;
  whatsapp?: string;
  email?: string;
}

const ADMIN_EMAIL = process.env.YEMA_ADMIN_EMAIL ?? "hello@yema.app";

function acknowledgeHtml(centerName: string, locale: "fr" | "en"): string {
  const heading = locale === "en"
    ? "Demo request received."
    : "Demande de démo reçue.";
  const line1 = locale === "en"
    ? "Every center of the house is met before being onboarded."
    : "Chaque centre de la maison est rencontré avant d'être embarqué.";
  const line2 = locale === "en"
    ? "We will call you back within 48 hours."
    : "Nous vous rappelons sous 48 heures.";
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#1B120A;font-family:Georgia,serif">
    <div style="max-width:560px;margin:0 auto;padding:48px 24px;color:#F4EBDC">
      <p style="font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.22em;color:#B8873E;text-transform:uppercase;margin:0 0 18px">YEMA · Démo centre</p>
      <h1 style="font-style:italic;font-size:28px;line-height:1.15;color:#F4EBDC;margin:0 0 18px">${centerName}, ${heading}</h1>
      <p style="font-size:16px;line-height:1.65;color:rgba(244,235,220,0.72);margin:0 0 12px">${line1}</p>
      <p style="font-size:16px;line-height:1.65;color:rgba(244,235,220,0.72);margin:0">${line2}</p>
    </div>
  </body></html>`;
}

function adminHtml(app: {
  centerName: string; city: string; whatsapp?: string | null; email: string;
}): string {
  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif">
    <h2>Nouvelle demande de démo centre</h2>
    <table style="border-collapse:collapse;font-size:14px">
      <tr><td style="padding:6px 12px;color:#666">Centre</td><td style="padding:6px 12px"><strong>${app.centerName}</strong></td></tr>
      <tr><td style="padding:6px 12px;color:#666">Ville</td><td style="padding:6px 12px">${app.city}</td></tr>
      <tr><td style="padding:6px 12px;color:#666">Email</td><td style="padding:6px 12px">${app.email}</td></tr>
      <tr><td style="padding:6px 12px;color:#666">WhatsApp</td><td style="padding:6px 12px">${app.whatsapp ?? "—"}</td></tr>
    </table>
    <p style="color:#666;font-size:13px;margin-top:24px">À contacter sous 48 heures. Voir /admin/applications.</p>
  </body></html>`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Payload;
    const centerName = String(body.centerName ?? "").trim();
    const city = String(body.city ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const whatsapp = body.whatsapp ? String(body.whatsapp).trim() : null;

    if (!centerName || !city || !email) {
      return NextResponse.json(
        { ok: false, error: "missing_fields" },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { ok: false, error: "invalid_email" },
        { status: 400 }
      );
    }

    const app = await prisma.centerApplication.create({
      data: { centerName, city, email, whatsapp },
    });

    const url = new URL(request.url);
    const locale: "fr" | "en" =
      (url.searchParams.get("locale") ?? "fr") === "en" ? "en" : "fr";

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
      ]).catch(() => {});
    }

    return NextResponse.json({ ok: true, id: app.id });
  } catch (err) {
    console.error("[apply/center] error:", err);
    return NextResponse.json(
      { ok: false, error: "internal" },
      { status: 500 }
    );
  }
}
