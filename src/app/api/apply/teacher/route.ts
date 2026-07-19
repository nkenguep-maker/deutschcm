// POST /api/apply/teacher — Sprint 5.
// Formulaire d'accréditation enseignant·e. Crée un TeacherApplication
// (statut RECEIVED), envoie un email interne à l'admin, envoie un
// accusé au candidat. Aucune promesse de création de classe immédiate
// — la maison rencontre chaque prof avant de l'accréditer.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";

interface Payload {
  fullName?: string;
  email?: string;
  whatsapp?: string;
  city?: string;
  languages?: string;
  experience?: string;
}

const ADMIN_EMAIL = process.env.YEMA_ADMIN_EMAIL ?? "hello@yema.app";

function acknowledgeHtml(fullName: string, locale: "fr" | "en"): string {
  const heading = locale === "en"
    ? "Application received."
    : "Demande reçue.";
  const line1 = locale === "en"
    ? "Every teacher of the house is met before being accredited."
    : "Chaque enseignant·e de la maison est rencontré·e avant d'être accrédité·e.";
  const line2 = locale === "en"
    ? "We will call you back within 48 hours."
    : "Nous vous rappelons sous 48 heures.";
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#1B120A;font-family:Georgia,serif">
    <div style="max-width:560px;margin:0 auto;padding:48px 24px;color:#F4EBDC">
      <p style="font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.22em;color:#B8873E;text-transform:uppercase;margin:0 0 18px">YEMA · Accréditation enseignant·e</p>
      <h1 style="font-style:italic;font-size:28px;line-height:1.15;color:#F4EBDC;margin:0 0 18px">${fullName ? fullName + "," : ""} ${heading}</h1>
      <p style="font-size:16px;line-height:1.65;color:rgba(244,235,220,0.72);margin:0 0 12px">${line1}</p>
      <p style="font-size:16px;line-height:1.65;color:rgba(244,235,220,0.72);margin:0">${line2}</p>
    </div>
  </body></html>`;
}

function adminHtml(app: {
  fullName: string; email: string; whatsapp?: string | null; city: string;
  languages: string; experience: string;
}): string {
  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif">
    <h2>Nouvelle demande d'accréditation enseignant·e</h2>
    <table style="border-collapse:collapse;font-size:14px">
      <tr><td style="padding:6px 12px;color:#666">Nom</td><td style="padding:6px 12px"><strong>${app.fullName}</strong></td></tr>
      <tr><td style="padding:6px 12px;color:#666">Email</td><td style="padding:6px 12px">${app.email}</td></tr>
      <tr><td style="padding:6px 12px;color:#666">WhatsApp</td><td style="padding:6px 12px">${app.whatsapp ?? "—"}</td></tr>
      <tr><td style="padding:6px 12px;color:#666">Ville</td><td style="padding:6px 12px">${app.city}</td></tr>
      <tr><td style="padding:6px 12px;color:#666">Langue(s)</td><td style="padding:6px 12px">${app.languages}</td></tr>
      <tr><td style="padding:6px 12px;color:#666;vertical-align:top">Diplôme / expérience</td><td style="padding:6px 12px;white-space:pre-wrap">${app.experience}</td></tr>
    </table>
    <p style="color:#666;font-size:13px;margin-top:24px">À contacter sous 48 heures. Voir /admin/applications.</p>
  </body></html>`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Payload;
    const fullName = String(body.fullName ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const city = String(body.city ?? "").trim();
    const languages = String(body.languages ?? "").trim();
    const experience = String(body.experience ?? "").trim();
    const whatsapp = body.whatsapp ? String(body.whatsapp).trim() : null;

    if (!fullName || !email || !city || !languages || !experience) {
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

    // Locale hint côté client (langue de l'accusé de réception).
    const url = new URL(request.url);
    const locale: "fr" | "en" =
      (url.searchParams.get("locale") ?? "fr") === "en" ? "en" : "fr";

    // Best-effort emails — on ne bloque pas la réponse si Resend rate.
    const emailPromises: Promise<unknown>[] = [];
    if (process.env.RESEND_API_KEY) {
      emailPromises.push(
        sendEmail({
          to: ADMIN_EMAIL,
          subject: `[YEMA] Nouvelle demande enseignant·e · ${fullName}`,
          html: adminHtml({
            fullName, email, whatsapp, city, languages, experience,
          }),
          from: "YEMA <noreply@deutschcm.vercel.app>",
        }),
      );
      emailPromises.push(
        sendEmail({
          to: email,
          subject: locale === "en"
            ? "YEMA · Your application"
            : "YEMA · Votre demande",
          html: acknowledgeHtml(fullName, locale),
          from: "YEMA <noreply@deutschcm.vercel.app>",
        }),
      );
      Promise.allSettled(emailPromises).catch(() => {});
    }

    return NextResponse.json({ ok: true, id: app.id });
  } catch (err) {
    console.error("[apply/teacher] error:", err);
    return NextResponse.json(
      { ok: false, error: "internal" },
      { status: 500 }
    );
  }
}
