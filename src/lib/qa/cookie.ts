// P4.5-QA · gestion du cookie QA HttpOnly indépendant.
//
// Contrat · le cookie contient un payload signé HMAC-SHA256. Aucun token
// Supabase, mot de passe, clé, email complet n'est stocké dedans (seul
// un hash court de l'email admin autorisé). L'expiration côté serveur
// est REVÉRIFIÉE à chaque requête (le `Max-Age` du cookie n'est pas
// suffisant).

import "server-only";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import {
  encodeToken,
  decodeToken,
  type QaCookiePayload,
} from "@/lib/qa/token";

export const QA_COOKIE_NAME = "yema_qa_session";
export const QA_COOKIE_MAX_AGE_SECONDS_HARD = 7200; // 2h maximum absolu

export function hashEmail(email: string, projectRef: string): string {
  // SHA-256 complet · 64 chars hex. Aucune troncation · le hash est
  // persisté in-clear en DB (`qa_admin_email_hash`) et transporté dans
  // le cookie signé + token bootstrap.
  return createHash("sha256")
    .update(`${email.trim().toLowerCase()}:${projectRef}`)
    .digest("hex");
}

/**
 * Écrit le cookie QA signé. Les options sont non négociables ·
 * HttpOnly, Secure, SameSite=Lax, Path=/, Max-Age plafonné.
 */
export async function setQaCookie(payload: QaCookiePayload, secret: string): Promise<void> {
  const token = encodeToken(payload, secret);
  const maxAge = Math.min(
    QA_COOKIE_MAX_AGE_SECONDS_HARD,
    Math.max(0, payload.expiresAt - Math.floor(Date.now() / 1000)),
  );
  const store = await cookies();
  store.set({
    name: QA_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export async function clearQaCookie(): Promise<void> {
  const store = await cookies();
  store.set({
    name: QA_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export type QaCookieReadResult =
  | { ok: true; payload: QaCookiePayload }
  | { ok: false; reason: QaCookieReadError };

export type QaCookieReadError =
  | "cookie_missing"
  | "signature_invalid"
  | "payload_invalid"
  | "expired"
  | "host_mismatch"
  | "project_ref_mismatch";

/**
 * Lit + vérifie le cookie QA (signature + expiration + host + projectRef).
 */
export async function readQaCookie(
  secret: string,
  expected: { deploymentHost: string; projectRef: string; nowSeconds: number },
): Promise<QaCookieReadResult> {
  const store = await cookies();
  const raw = store.get(QA_COOKIE_NAME)?.value;
  if (!raw) return { ok: false, reason: "cookie_missing" };
  const decoded = decodeToken<QaCookiePayload>(raw, secret);
  if (!decoded.ok) {
    if (decoded.reason === "signature_invalid") return { ok: false, reason: "signature_invalid" };
    return { ok: false, reason: "payload_invalid" };
  }
  const p = decoded.payload;
  if (!p.qaAdminEmailHash || !p.deploymentHost || !p.projectRef
      || typeof p.issuedAt !== "number" || typeof p.expiresAt !== "number") {
    return { ok: false, reason: "payload_invalid" };
  }
  if (p.expiresAt <= expected.nowSeconds) return { ok: false, reason: "expired" };
  if (p.deploymentHost.toLowerCase() !== expected.deploymentHost.toLowerCase()) {
    return { ok: false, reason: "host_mismatch" };
  }
  if (p.projectRef !== expected.projectRef) return { ok: false, reason: "project_ref_mismatch" };
  return { ok: true, payload: p };
}
