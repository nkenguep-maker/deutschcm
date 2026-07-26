// QA-b1 Gate · POST /api/qa/impersonate
//
// Flux entièrement server-side · aucun secret (magic link URL,
// hashed_token, OTP, access token, refresh token) ne transite par le
// browser.
//
// Séquence ·
//   1. Gate QA (Preview + flag + P-1 + secrets + admin email valide)
//   2. Protection CSRF (method POST + Content-Type JSON + Origin match)
//   3. Vérifier cookie QA (signature + expiration + host + projectRef)
//   4. Résoudre persona → fixture email server-side (allowlist stricte)
//   5. Générer magic link Supabase via admin.generateLink() (server-only)
//   6. Extraire `hashed_token` du magic link, appeler verifyOtp() server
//      via le client SSR canonique → session Supabase écrite dans les
//      cookies SSR (aucun secret exposé)
//   7. Réponse HTTP 303 vers la destination du persona
//   8. Le cookie QA (yema_qa_session) est conservé (path=/, HttpOnly)

import { NextResponse, type NextRequest } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient as createSsrClient } from "@/lib/supabase/server";
import { resolveQaConfig } from "@/lib/qa/config";
import { readQaCookie } from "@/lib/qa/cookie";
import { getPersona, isQaPersonaId, type QaPersonaId } from "@/lib/qa/personas";
import { checkCsrf } from "@/lib/qa/csrf";
import { normalizeHost } from "@/lib/qa/host";
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

  // CSRF · method + content-type + Origin + Sec-Fetch-Site
  const csrf = checkCsrf(request);
  if (!csrf.ok) {
    qaLog("QA_ACCESS_DENIED", {
      deploymentHost: normalizeHost(request.headers.get("host") || ""),
      projectRef: status.projectRef,
      reasonCode: csrf.reason,
    });
    return notFound();
  }

  const url = new URL(request.url);
  const host = normalizeHost(url.host);
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

  // Body allowlist stricte.
  let bodyRaw: unknown;
  try { bodyRaw = await request.json(); }
  catch { return badRequest("body_invalid_json"); }
  if (!bodyRaw || typeof bodyRaw !== "object") return badRequest("body_invalid_shape");
  const body = bodyRaw as Record<string, unknown>;
  const extraKeys = Object.keys(body).filter((k) => k !== "persona");
  if (extraKeys.length > 0) return badRequest("body_extra_keys");

  const personaRaw = body.persona;
  if (!isQaPersonaId(personaRaw)) return badRequest("persona_invalid");
  const persona = getPersona(personaRaw as QaPersonaId);
  if (!persona) return badRequest("persona_not_found");

  const targetEmail = persona.fixtureEmail;

  // Générer un magic link server-only avec le service_role.
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  // `admin.generateLink({type:'magiclink'})` renvoie dans `data.properties`
  // un `hashed_token` que l'on passe directement à `verifyOtp` côté
  // serveur pour créer une session sans jamais exposer le token au browser.
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: targetEmail,
  });
  if (error || !data?.properties?.hashed_token) {
    qaLog("QA_ACCESS_DENIED", {
      persona: persona.id,
      targetRole: persona.role,
      deploymentHost: host,
      projectRef: status.projectRef,
      reasonCode: "generate_link_failed",
    });
    return notFound();
  }
  const hashedToken = data.properties.hashed_token as string;

  // Client SSR canonique · écrira les cookies de session Supabase via
  // le cookieStore Next à travers `setAll`.
  // Type "email" · canonique pour verifyOtp avec un token_hash reçu par
  // email (magic link Supabase). L'union EmailOtpType inclut "email" et
  // "magiclink" · "email" est plus général et documente l'intent.
  const ssrClient = await createSsrClient();
  // Reset session · aucun cumul de rôles entre 2 changements. signOut
  // efface les cookies sb-*-auth-token via le cookieStore Next avant
  // d'installer la nouvelle session via verifyOtp.
  await ssrClient.auth.signOut({ scope: "local" }).catch(() => {});
  const { error: verifyError } = await ssrClient.auth.verifyOtp({
    type: "email",
    token_hash: hashedToken,
  });
  if (verifyError) {
    qaLog("QA_ACCESS_DENIED", {
      persona: persona.id,
      targetRole: persona.role,
      deploymentHost: host,
      projectRef: status.projectRef,
      reasonCode: "verify_otp_failed",
    });
    return notFound();
  }

  qaLog("QA_IMPERSONATION_STARTED", {
    persona: persona.id,
    targetRole: persona.role,
    deploymentHost: host,
    projectRef: status.projectRef,
  });

  // Réponse 303 vers la destination · aucun secret dans le JSON, aucun
  // token dans l'URL. Le browser suit le redirect avec les cookies SSR
  // Supabase déjà posés par verifyOtp() ci-dessus.
  const destination = persona.destination("fr");
  const response = NextResponse.redirect(new URL(destination, url.origin), { status: 303 });
  // Cookie label lisible côté client (barre "MODE TEST · Enseignant").
  // Pas httpOnly (le composant client doit le lire), pas signé (aucune
  // décision d'auth basée dessus · purement affichage).
  response.cookies.set("yema_qa_persona", persona.id, {
    path: "/", sameSite: "lax", secure: true, maxAge: 7200,
  });
  return response;
}

export async function GET() { return notFound(); }
export async function PATCH() { return notFound(); }
export async function PUT() { return notFound(); }
export async function DELETE() { return notFound(); }
