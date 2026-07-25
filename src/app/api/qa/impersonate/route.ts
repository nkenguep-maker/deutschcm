// P4.5-QA · POST /api/qa/impersonate
//
// Body allowlist stricte · { persona: <QaPersonaId> }. Aucun email, userId,
// role, projectRef ou header d'autorisation n'est accepté depuis le body.
//
// Séquence ·
//   1. Gate QA (Preview + flag + P-1 + secrets + admin email valide)
//   2. Vérifier cookie QA (signature + expiration + host + projectRef)
//   3. Résoudre persona → fixture email server-side
//   4. Générer magic link Supabase via admin.generateLink()
//   5. Rediriger le browser vers le magic link (Supabase callback)
//   6. Le cookie QA est conservé (HttpOnly, path=/)

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resolveQaConfig } from "@/lib/qa/config";
import { readQaCookie } from "@/lib/qa/cookie";
import { getPersona, isQaPersonaId, type QaPersonaId } from "@/lib/qa/personas";
import { qaLog } from "@/lib/qa/log";

function notFound() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

function badRequest(code: string) {
  return NextResponse.json({ error: "Bad request", code }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const status = resolveQaConfig();
  if (!status.active) return notFound();

  const url = new URL(request.url);
  const host = url.host;
  const now = Math.floor(Date.now() / 1000);
  const sessionSecret = process.env.YEMA_QA_SESSION_SECRET!;
  const cookieCheck = await readQaCookie(sessionSecret, {
    deploymentHost: host,
    projectRef: status.projectRef,
    nowSeconds: now,
  });
  if (!cookieCheck.ok) {
    qaLog("QA_ACCESS_DENIED", {
      deploymentHost: host,
      projectRef: status.projectRef,
      reasonCode: cookieCheck.reason,
    });
    return notFound();
  }

  // Body strict allowlist.
  let bodyRaw: unknown;
  try { bodyRaw = await request.json(); }
  catch { return badRequest("body_invalid_json"); }
  if (!bodyRaw || typeof bodyRaw !== "object") return badRequest("body_invalid_shape");
  const body = bodyRaw as Record<string, unknown>;
  const allowedKeys = Object.keys(body).filter((k) => k !== "persona");
  if (allowedKeys.length > 0) return badRequest("body_extra_keys");

  const personaRaw = body.persona;
  if (!isQaPersonaId(personaRaw)) return badRequest("persona_invalid");
  const persona = getPersona(personaRaw as QaPersonaId);
  if (!persona) return badRequest("persona_not_found");

  // Résolution locale → email fixture. Le body ne dicte JAMAIS l'email.
  const targetEmail = persona.fixtureEmail;

  // Générer le magic link via service_role (server-only).
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const redirectUrl = new URL("/auth/callback", url.origin);
  redirectUrl.searchParams.set("next", persona.destination("fr"));
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: targetEmail,
    options: { redirectTo: redirectUrl.toString() },
  });
  if (error || !data?.properties?.action_link) {
    qaLog("QA_ACCESS_DENIED", {
      persona: persona.id,
      targetRole: persona.role,
      deploymentHost: host,
      projectRef: status.projectRef,
      reasonCode: "generate_link_failed",
    });
    return notFound();
  }

  qaLog("QA_IMPERSONATION_STARTED", {
    persona: persona.id,
    targetRole: persona.role,
    deploymentHost: host,
    projectRef: status.projectRef,
  });

  // Redirect browser vers le magic link · Supabase autentifiera le persona
  // et redirigera vers /auth/callback?next=<destination>. Le cookie
  // yema_qa_session survit (path=/, HttpOnly).
  return NextResponse.json({ redirectUrl: data.properties.action_link }, { status: 200 });
}

// Aucun autre verbe autorisé.
export async function GET() { return notFound(); }
export async function PATCH() { return notFound(); }
export async function PUT() { return notFound(); }
export async function DELETE() { return notFound(); }
