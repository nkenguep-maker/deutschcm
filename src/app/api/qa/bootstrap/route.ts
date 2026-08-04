// QA-b1 Gate · GET /api/qa/bootstrap?t=<signed-token>
//
// Consomme atomiquement un lien signé à usage unique · vérifie signature/
// host normalisé/projectRef/emailHash · consommation via UPDATE atomique
// sur `qa_bootstrap_nonces` (source de vérité durable, pas de Map mémoire).
// Pose le cookie QA · redirige 303 vers /[locale]/qa (token retiré de
// l'URL finale).

import { NextResponse, type NextRequest } from "next/server";
import { resolveQaConfig } from "@/lib/qa/config";
import {
  verifyBootstrapToken,
  QA_BOOTSTRAP_TTL_SECONDS,
  type QaBootstrapPayload,
} from "@/lib/qa/token";
import { setQaCookie, hashEmail, QA_COOKIE_MAX_AGE_SECONDS_HARD } from "@/lib/qa/cookie";
import { atomicConsumeNonce } from "@/lib/qa/nonces";
import { normalizeHost } from "@/lib/qa/host";
import { qaLog } from "@/lib/qa/log";

function notFound() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function GET(request: NextRequest) {
  // Gate en 1er · toute condition manquante = 404 stable, aucune lecture DB.
  const status = resolveQaConfig();
  if (!status.active) return notFound();

  const url = new URL(request.url);
  const token = url.searchParams.get("t") || "";
  const now = Math.floor(Date.now() / 1000);
  const host = normalizeHost(url.host);

  const secret = process.env.YEMA_QA_LINK_SIGNING_SECRET!;
  const verified = verifyBootstrapToken(token, secret, {
    deploymentHost: host,
    projectRef: status.projectRef,
    nowSeconds: now,
  });
  if (!verified.ok) {
    qaLog("QA_ACCESS_DENIED", {
      deploymentHost: host,
      projectRef: status.projectRef,
      reasonCode: verified.reason,
    });
    return notFound();
  }

  const payload: QaBootstrapPayload = verified.payload;

  // Defense-in-depth · l'emailHash du token doit correspondre à
  // l'admin email courant (le token pourrait avoir été signé pour un
  // autre admin autorisé sur la même Preview · on lie strictement).
  const expectedHash = hashEmail(status.adminEmail, status.projectRef);
  if (payload.emailHash !== expectedHash) {
    qaLog("QA_ACCESS_DENIED", {
      deploymentHost: host,
      projectRef: status.projectRef,
      reasonCode: "email_hash_mismatch",
    });
    return notFound();
  }

  // Le token binde aussi le host normalisé au moment de la signature ·
  // le comparateur ci-dessus utilise déjà le host normalisé.
  const consumeResult = await atomicConsumeNonce({
    nonce: payload.nonce,
    qaAdminEmailHash: expectedHash,
    deploymentHost: host,
    projectRef: status.projectRef,
    nowSeconds: now,
  });
  if (!consumeResult.ok) {
    qaLog("QA_ACCESS_DENIED", {
      deploymentHost: host,
      projectRef: status.projectRef,
      reasonCode: consumeResult.reason,
    });
    return notFound();
  }

  // Session cookie TTL = min(qa session TTL, ttl hard cap).
  const sessionSecondsMax = Math.min(
    status.ttlMinutes * 60,
    QA_COOKIE_MAX_AGE_SECONDS_HARD,
  );
  const cookiePayload = {
    qaAdminEmailHash: expectedHash,
    deploymentHost: host,
    projectRef: status.projectRef,
    issuedAt: now,
    expiresAt: now + sessionSecondsMax,
    nonce: payload.nonce,
  };
  const sessionSecret = process.env.YEMA_QA_SESSION_SECRET!;
  await setQaCookie(cookiePayload, sessionSecret);

  qaLog("QA_SESSION_STARTED", {
    deploymentHost: host,
    projectRef: status.projectRef,
  });

  // Redirect 303 vers /fr/qa · le token disparaît de l'URL finale.
  const locale = url.searchParams.get("locale") === "en" ? "en" : "fr";
  const redirectTo = new URL(`/${locale}/qa`, url.origin);
  return NextResponse.redirect(redirectTo, { status: 303 });
}

export async function POST() { return notFound(); }
export async function PATCH() { return notFound(); }
export async function PUT() { return notFound(); }
export async function DELETE() { return notFound(); }

void QA_BOOTSTRAP_TTL_SECONDS;
