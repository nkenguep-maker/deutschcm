// P4.1 · Feature flags centralisés, résolus côté serveur.
//
// Règle · tous les flags P4 sont FALSE par défaut. La lecture se fait via
// `getFlag(name)` uniquement — jamais depuis `process.env` directement dans
// les routes ou composants. Une variable d'environnement absente compte
// comme "false" (sécurité par défaut).
//
// Convention · variables d'environnement préfixées `YEMA_<FLAG_NAME>`.
// Le serveur est autoritaire — aucun flag n'est jamais exposé via
// `NEXT_PUBLIC_*`. Un composant client qui veut connaître l'état d'un
// flag doit passer par une route serveur.

export type FeatureFlag =
  | "CIRCLE_ENABLED"
  | "CENTER_REAL_DATA_ENABLED"
  | "CENTER_RLS_CONFIRMED"
  | "TEACHER_WORKSPACE_ENABLED"
  | "COACH_WORKSPACE_ENABLED"
  | "ASSIGNMENTS_ENABLED"
  | "AUDIO_FEEDBACK_ENABLED"
  | "CLOSED_MESSAGING_ENABLED"
  | "NOTIFICATIONS_ENABLED"
  | "RACINES_COACH_OPERATIONAL";

const P4_FLAGS: readonly FeatureFlag[] = [
  "CIRCLE_ENABLED",
  "CENTER_REAL_DATA_ENABLED",
  "CENTER_RLS_CONFIRMED",
  "TEACHER_WORKSPACE_ENABLED",
  "COACH_WORKSPACE_ENABLED",
  "ASSIGNMENTS_ENABLED",
  "AUDIO_FEEDBACK_ENABLED",
  "CLOSED_MESSAGING_ENABLED",
  "NOTIFICATIONS_ENABLED",
  "RACINES_COACH_OPERATIONAL",
] as const;

export function getFlag(name: FeatureFlag): boolean {
  const raw = process.env[`YEMA_${name}`];
  return raw === "true" || raw === "1";
}

/**
 * P4.3a hardening · en production, `CENTER_REAL_DATA_ENABLED` seul ne suffit
 * pas · il faut également `CENTER_RLS_CONFIRMED = true` pour reconnaître que
 * les policies RLS PostgreSQL ont été posées et validées. Sans cette double
 * confirmation, les endpoints Center servent des données via des filtres
 * applicatifs uniquement · ce qui est acceptable en dev / P-1 mais bloquant
 * pour la production.
 *
 * En dev et test (`NODE_ENV !== "production"`), seul `CENTER_REAL_DATA_ENABLED`
 * est requis · voir spec P4.3a hardening §4.
 */
export function isCenterRealDataActive(): boolean {
  if (!getFlag("CENTER_REAL_DATA_ENABLED")) return false;
  if (process.env.NODE_ENV === "production" && !getFlag("CENTER_RLS_CONFIRMED")) {
    return false;
  }
  return true;
}

export function assertFlagEnabled(name: FeatureFlag): void {
  if (!getFlag(name)) {
    const err = new Error(`feature_flag_disabled:${name}`);
    (err as { code?: string }).code = "FEATURE_FLAG_DISABLED";
    throw err;
  }
}

export function listAllFlags(): Record<FeatureFlag, boolean> {
  const out = {} as Record<FeatureFlag, boolean>;
  for (const f of P4_FLAGS) out[f] = getFlag(f);
  return out;
}
