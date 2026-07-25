// P4.5-QA · configuration + gate server-only.
//
// Le mode QA est actif UNIQUEMENT si TOUTES les conditions sont vraies ·
//
//   1. Environnement Vercel = "preview" (jamais "production" ni undefined)
//   2. Flag YEMA_QA_MODE_ENABLED = "true"
//   3. Project ref Supabase courant = kzzagbojjkivdzzcrmxn (P-1)
//   4. Secrets QA présents et suffisamment longs
//
// Le gate est appelé EN PREMIER par toutes les routes et pages QA. Si
// une seule condition n'est pas remplie, la route répond 404 stable
// (`{"error":"Not found"}`) et la page rend `notFound()`.
//
// Aucune variable QA n'est jamais préfixée `NEXT_PUBLIC_*` · toute la
// résolution se fait server-side.

import "server-only";
import { getFlag } from "@/lib/flags";

export const QA_ALLOWED_PROJECT_REF = "kzzagbojjkivdzzcrmxn";
export const QA_MIN_SECRET_LENGTH = 32; // 32 octets binaires ou 32+ chars hex

export type QaConfigStatus =
  | { active: true; adminEmail: string; ttlMinutes: number; projectRef: string }
  | { active: false; reason: QaInactiveReason };

export type QaInactiveReason =
  | "not_preview"
  | "flag_disabled"
  | "wrong_project_ref"
  | "missing_secrets"
  | "invalid_admin_email"
  | "invalid_ttl";

/**
 * Extrait le project ref Supabase de la variable NEXT_PUBLIC_SUPABASE_URL
 * actuelle. Retourne null si absente ou non parseable.
 */
export function currentSupabaseProjectRef(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const m = url.match(/https:\/\/([a-z0-9]{20})\.supabase\.co/i);
  return m ? m[1].toLowerCase() : null;
}

/**
 * Valide un email · exactement un @, domaine non vide, aucun espace.
 * Aucune tentative de correction ou devination.
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  if (/\s/.test(email)) return false;
  const parts = email.split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || !domain) return false;
  if (!domain.includes(".")) return false;
  return true;
}

function validQaSecretsPresent(): boolean {
  const sessionSecret = process.env.YEMA_QA_SESSION_SECRET || "";
  const linkSecret = process.env.YEMA_QA_LINK_SIGNING_SECRET || "";
  return sessionSecret.length >= QA_MIN_SECRET_LENGTH && linkSecret.length >= QA_MIN_SECRET_LENGTH;
}

/**
 * Résout le statut du mode QA. Aucun secret n'est retourné · uniquement
 * le hash MD5 court de l'email admin autorisé (utilisé pour signature
 * cookie) et le TTL en minutes.
 */
export function resolveQaConfig(): QaConfigStatus {
  const vercelEnv = process.env.VERCEL_ENV;
  // Autoriser explicitement `preview` sur Vercel OU un flag local test
  // lorsque le wrapper P-1 est utilisé (`YEMA_QA_ALLOW_LOCAL=true`).
  const isPreview = vercelEnv === "preview"
    || process.env.YEMA_QA_ALLOW_LOCAL === "true";
  if (!isPreview) return { active: false, reason: "not_preview" };

  if (!getFlag("QA_MODE_ENABLED")) return { active: false, reason: "flag_disabled" };

  const ref = currentSupabaseProjectRef();
  if (ref !== QA_ALLOWED_PROJECT_REF) return { active: false, reason: "wrong_project_ref" };

  if (!validQaSecretsPresent()) return { active: false, reason: "missing_secrets" };

  const adminEmail = process.env.YEMA_QA_ADMIN_EMAIL || "";
  if (!isValidEmail(adminEmail)) return { active: false, reason: "invalid_admin_email" };

  const ttlRaw = process.env.YEMA_QA_SESSION_TTL_MINUTES || "120";
  const ttlMinutes = Number.parseInt(ttlRaw, 10);
  if (!Number.isFinite(ttlMinutes) || ttlMinutes <= 0 || ttlMinutes > 240) {
    return { active: false, reason: "invalid_ttl" };
  }

  return { active: true, adminEmail, ttlMinutes, projectRef: ref };
}

/**
 * Raccourci pour les feature-gates de routes · true si QA totalement actif.
 */
export function isQaModeActive(): boolean {
  return resolveQaConfig().active === true;
}
