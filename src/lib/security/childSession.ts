import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// P4.6 Lot 5 · session enfant signée (cookie HttpOnly · TTL court).
//
// Doctrine sécurité (brief §2) :
//   - Cookie signé HMAC-SHA256 · jamais lisible côté client (HttpOnly).
//   - Charge minimale : childProfileId + iat + exp. Aucun parentUserId,
//     householdId, rôle, entitlement ou pinHash exposés.
//   - TTL 30 minutes (rafraîchissable côté serveur uniquement).
//   - Le PIN et le pinHash ne quittent JAMAIS le serveur.
//   - Le client ne peut JAMAIS créer un cookie enfant : la création passe
//     obligatoirement par POST /api/child-session avec vérification serveur
//     du PIN + ownership Household.
//
// Secret :
//   YEMA_CHILD_SESSION_SECRET (env). Fallback dérivé de
//   SUPABASE_JWT_SECRET si absent (log warning). Refuse d'émettre un
//   cookie si aucun secret disponible.

export const CHILD_SESSION_COOKIE_NAME = "yema_child_session";
export const CHILD_SESSION_TTL_SECONDS = 30 * 60;

export interface ChildSessionPayload {
  childProfileId: string;
  // P4.6 Lot 5.1 · invalidation immédiate après changement PIN.
  // `pv` = pinVersion = timestamp ms de ChildProfile.pinUpdatedAt (ou 0
  // si aucun PIN au moment de l'émission). resolveActiveChildSession
  // compare ce champ à la valeur DB actuelle et refuse tout mismatch.
  // Aucun hash de PIN ne circule dans le cookie.
  pv: number;
  iat: number; // seconds since epoch
  exp: number;
}

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function b64urlDecode(s: string): Buffer {
  const pad = 4 - (s.length % 4);
  const norm = (s + (pad < 4 ? "=".repeat(pad) : "")).replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(norm, "base64");
}

function resolveSecret(): string | null {
  const primary = process.env.YEMA_CHILD_SESSION_SECRET;
  if (primary && primary.length >= 32) return primary;
  const jwt = process.env.SUPABASE_JWT_SECRET;
  if (jwt && jwt.length >= 32) return `yema-child::${jwt}`;
  return null;
}

function sign(payload: string): string | null {
  const secret = resolveSecret();
  if (!secret) return null;
  return b64url(createHmac("sha256", secret).update(payload).digest());
}

export function encodeChildSession(
  childProfileId: string,
  pinUpdatedAt: Date | null,
  nowSec?: number,
): string | null {
  const now = nowSec ?? Math.floor(Date.now() / 1000);
  const pv = pinUpdatedAt ? pinUpdatedAt.getTime() : 0;
  const payload: ChildSessionPayload = {
    childProfileId,
    pv,
    iat: now,
    exp: now + CHILD_SESSION_TTL_SECONDS,
  };
  const body = b64url(Buffer.from(JSON.stringify(payload), "utf8"));
  const sig = sign(body);
  if (!sig) return null;
  return `${body}.${sig}`;
}

// Utilitaire pour comparer une pinUpdatedAt DB à la version encodée
// dans le cookie. Retourne true si la version courante correspond.
export function pinVersionMatches(payloadPv: number, currentPinUpdatedAt: Date | null): boolean {
  const currentPv = currentPinUpdatedAt ? currentPinUpdatedAt.getTime() : 0;
  return payloadPv === currentPv;
}

export type ChildSessionVerification =
  | { ok: true; payload: ChildSessionPayload }
  | { ok: false; reason: "malformed" | "bad_signature" | "expired" | "no_secret" };

export function verifyChildSession(cookie: string, nowSec?: number): ChildSessionVerification {
  if (typeof cookie !== "string" || !cookie.includes(".")) return { ok: false, reason: "malformed" };
  const [body, sig] = cookie.split(".");
  if (!body || !sig) return { ok: false, reason: "malformed" };
  const expected = sign(body);
  if (!expected) return { ok: false, reason: "no_secret" };
  const a = Buffer.from(sig, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, reason: "bad_signature" };

  let payload: ChildSessionPayload;
  try {
    const raw = b64urlDecode(body).toString("utf8");
    payload = JSON.parse(raw) as ChildSessionPayload;
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (
    typeof payload.childProfileId !== "string" ||
    typeof payload.iat !== "number" ||
    typeof payload.exp !== "number" ||
    typeof payload.pv !== "number"
  ) {
    return { ok: false, reason: "malformed" };
  }
  const now = nowSec ?? Math.floor(Date.now() / 1000);
  if (now >= payload.exp) return { ok: false, reason: "expired" };
  return { ok: true, payload };
}
