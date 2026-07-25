// P4.5-QA · GET /api/qa/bootstrap?t=<signed-token>
//
// Consomme un lien signé à usage unique · vérifie signature/host/projectRef/
// nonce · pose le cookie QA · redirige vers /[locale]/qa · retire le token
// de l'URL finale (redirect 303 sans query string).

import { NextResponse, type NextRequest } from "next/server";
import { resolveQaConfig } from "@/lib/qa/config";
import {
  verifyBootstrapToken,
  QA_BOOTSTRAP_TTL_SECONDS,
  type QaBootstrapPayload,
} from "@/lib/qa/token";
import { setQaCookie, hashEmail, QA_COOKIE_MAX_AGE_SECONDS_HARD } from "@/lib/qa/cookie";
import { isNonceConsumed, markNonceConsumed } from "@/lib/qa/nonces";
import { qaLog } from "@/lib/qa/log";

function notFound() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function GET(request: NextRequest) {
  // Gate en 1er · toute condition manquante = 404 stable.
  const status = resolveQaConfig();
  if (!status.active) return notFound();

  const url = new URL(request.url);
  const token = url.searchParams.get("t") || "";
  const now = Math.floor(Date.now() / 1000);
  const host = url.host;

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
  if (isNonceConsumed(payload.nonce)) {
    qaLog("QA_ACCESS_DENIED", {
      deploymentHost: host,
      projectRef: status.projectRef,
      reasonCode: "nonce_replay",
    });
    return notFound();
  }

  // Verify emailHash matches admin email server-side (defense-in-depth ·
  // the token was signed by an authorized origin using the same secret).
  const expectedHash = hashEmail(status.adminEmail, status.projectRef);
  if (payload.emailHash !== expectedHash) {
    qaLog("QA_ACCESS_DENIED", {
      deploymentHost: host,
      projectRef: status.projectRef,
      reasonCode: "email_hash_mismatch",
    });
    return notFound();
  }

  // Consume nonce · TTL borné à celui du token + petite marge.
  markNonceConsumed(payload.nonce, payload.expiresAt + 60);

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

// Aucun autre verbe autorisé.
export async function POST() { return notFound(); }
export async function PATCH() { return notFound(); }
export async function PUT() { return notFound(); }
export async function DELETE() { return notFound(); }

// Sanity constant reference (silence lint if unused elsewhere).
void QA_BOOTSTRAP_TTL_SECONDS;
