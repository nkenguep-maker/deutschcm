// P4.5-QA · logger server-only anonymisé pour le mode QA.
//
// Doctrine (per §13 du brief · fallback log server-only) · aucune nouvelle
// AuditAction n'est ajoutée à l'enum Prisma dans cette phase QA-b1.
// Les événements QA sont écrits via `console.info` avec un préfixe fixe
// et une allowlist stricte de metadata · rien d'autre n'est loggé.
//
// Interdit dans le log · email complet, token, cookie, magic link,
// password, authorization header, service-role key.

import "server-only";

export type QaLogAction =
  | "QA_SESSION_STARTED"
  | "QA_IMPERSONATION_STARTED"
  | "QA_IMPERSONATION_ENDED"
  | "QA_SESSION_EXPIRED"
  | "QA_ACCESS_DENIED";

export interface QaLogMetadata {
  persona?: string;
  sourceRole?: string;
  targetRole?: string;
  deploymentHost?: string;
  projectRef?: string;
  reasonCode?: string;
}

const ALLOWED_META_KEYS: ReadonlyArray<keyof QaLogMetadata> = [
  "persona", "sourceRole", "targetRole",
  "deploymentHost", "projectRef", "reasonCode",
];

// Patterns interdits · si détectés dans un metadata, remplacer par [REDACTED].
const FORBIDDEN_PATTERNS = [
  /eyJ[A-Za-z0-9_-]{20,}/,          // JWT
  /sb_secret_[A-Za-z0-9_-]{16,}/,   // Supabase secret
  /sk-[A-Za-z0-9_-]{16,}/,          // OpenAI / generic
  /Bearer\s+[A-Za-z0-9._-]+/i,      // auth header
  /@[a-z0-9.-]+\.[a-z]{2,}/i,       // email domain fragment · sanitize à la source
];

function sanitize(value: unknown): string {
  if (value == null) return "";
  let s = String(value);
  for (const p of FORBIDDEN_PATTERNS) {
    if (p.test(s)) s = "[REDACTED]";
  }
  // Cap length to avoid log spam.
  if (s.length > 200) s = s.slice(0, 200) + "…";
  return s;
}

export function qaLog(action: QaLogAction, meta: QaLogMetadata = {}): void {
  const safe: Record<string, string> = {};
  for (const k of ALLOWED_META_KEYS) {
    const v = meta[k];
    if (v !== undefined) safe[k] = sanitize(v);
  }
  const record = {
    kind: "yema.qa.event",
    action,
    timestamp: new Date().toISOString(),
    ...safe,
  };
  // Une seule ligne JSON compacte · facile à grep dans les logs Preview.
  console.info(`[yema.qa] ${JSON.stringify(record)}`);
}
