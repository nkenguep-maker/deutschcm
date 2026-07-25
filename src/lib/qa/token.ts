// P4.5-QA · signature et vérification de tokens QA (bootstrap link + cookie).
//
// Format · base64url(JSON.stringify(payload)) + "." + base64url(HMAC-SHA256).
//
// Aucun token n'est loggué en clair · les helpers ne retournent que le
// payload sur succès ou un code d'erreur sans exposer le token brut.

import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const MAX_TOKEN_LEN = 4096; // sanity · aucun token QA légitime n'est aussi long
export const QA_BOOTSTRAP_TTL_SECONDS = 600; // 10 minutes maximum

export interface QaBootstrapPayload {
  emailHash: string;      // sha256("email:P1_REF") first 16 hex chars
  deploymentHost: string; // e.g. "deutschcm-osgf6v4x1-yema.vercel.app"
  projectRef: string;     // must equal kzzagbojjkivdzzcrmxn
  issuedAt: number;       // seconds since epoch
  expiresAt: number;      // seconds since epoch
  nonce: string;          // 32 hex chars random
}

export interface QaCookiePayload {
  qaAdminEmailHash: string;
  deploymentHost: string;
  projectRef: string;
  issuedAt: number;
  expiresAt: number;
  nonce: string;
}

function b64urlEncode(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function b64urlDecode(str: string): Buffer {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  return Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function sign(payloadBytes: Buffer, secret: string): string {
  const mac = createHmac("sha256", secret).update(payloadBytes).digest();
  return b64urlEncode(mac);
}

export function encodeToken<T>(payload: T, secret: string): string {
  if (!secret || secret.length < 32) throw new Error("QA token secret too short");
  const payloadJson = JSON.stringify(payload);
  const payloadBytes = Buffer.from(payloadJson, "utf8");
  const payloadPart = b64urlEncode(payloadBytes);
  const sigPart = sign(payloadBytes, secret);
  return `${payloadPart}.${sigPart}`;
}

export type TokenDecodeResult<T> =
  | { ok: true; payload: T }
  | { ok: false; reason: TokenDecodeError };

export type TokenDecodeError =
  | "token_missing"
  | "token_too_long"
  | "token_malformed"
  | "signature_invalid"
  | "payload_invalid";

export function decodeToken<T>(token: string, secret: string): TokenDecodeResult<T> {
  if (!token) return { ok: false, reason: "token_missing" };
  if (token.length > MAX_TOKEN_LEN) return { ok: false, reason: "token_too_long" };
  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false, reason: "token_malformed" };
  const [payloadPart, sigPart] = parts;
  let payloadBytes: Buffer;
  try { payloadBytes = b64urlDecode(payloadPart); }
  catch { return { ok: false, reason: "token_malformed" }; }
  const expected = sign(payloadBytes, secret);
  const providedBytes = Buffer.from(sigPart, "utf8");
  const expectedBytes = Buffer.from(expected, "utf8");
  if (providedBytes.length !== expectedBytes.length) return { ok: false, reason: "signature_invalid" };
  if (!timingSafeEqual(providedBytes, expectedBytes)) return { ok: false, reason: "signature_invalid" };
  let payload: T;
  try { payload = JSON.parse(payloadBytes.toString("utf8")) as T; }
  catch { return { ok: false, reason: "payload_invalid" }; }
  return { ok: true, payload };
}

/**
 * Vérifie un bootstrap token complet (signature + timing + host + projectRef).
 * Renvoie une erreur stable sans exposer le token.
 */
export type QaBootstrapVerifyResult =
  | { ok: true; payload: QaBootstrapPayload }
  | { ok: false; reason: QaBootstrapVerifyError };

export type QaBootstrapVerifyError =
  | TokenDecodeError
  | "expired"
  | "host_mismatch"
  | "project_ref_mismatch";

export function verifyBootstrapToken(
  token: string,
  secret: string,
  expected: { deploymentHost: string; projectRef: string; nowSeconds: number },
): QaBootstrapVerifyResult {
  const decoded = decodeToken<QaBootstrapPayload>(token, secret);
  if (!decoded.ok) return { ok: false, reason: decoded.reason };
  const p = decoded.payload;
  // Validate shape.
  if (typeof p.emailHash !== "string" || typeof p.deploymentHost !== "string"
      || typeof p.projectRef !== "string" || typeof p.issuedAt !== "number"
      || typeof p.expiresAt !== "number" || typeof p.nonce !== "string") {
    return { ok: false, reason: "payload_invalid" };
  }
  if (p.expiresAt <= expected.nowSeconds) return { ok: false, reason: "expired" };
  if (p.expiresAt - p.issuedAt > QA_BOOTSTRAP_TTL_SECONDS) return { ok: false, reason: "expired" };
  if (p.deploymentHost.toLowerCase() !== expected.deploymentHost.toLowerCase()) {
    return { ok: false, reason: "host_mismatch" };
  }
  if (p.projectRef !== expected.projectRef) return { ok: false, reason: "project_ref_mismatch" };
  return { ok: true, payload: p };
}
