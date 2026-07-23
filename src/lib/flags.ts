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
  | "TEACHER_RLS_CONFIRMED"
  | "COACH_WORKSPACE_ENABLED"
  | "ROOTS_COACH_RLS_CONFIRMED"
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
  "TEACHER_RLS_CONFIRMED",
  "COACH_WORKSPACE_ENABLED",
  "ROOTS_COACH_RLS_CONFIRMED",
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

/**
 * P4.3b · même contrat double-confirmation que Center · en production,
 * `TEACHER_WORKSPACE_ENABLED = true` ne suffit pas · il faut aussi
 * `TEACHER_RLS_CONFIRMED = true` (policies RLS Teacher posées et validées).
 * En dev/test, seul le flag principal est requis.
 */
export function isTeacherWorkspaceActive(): boolean {
  if (!getFlag("TEACHER_WORKSPACE_ENABLED")) return false;
  if (process.env.NODE_ENV === "production" && !getFlag("TEACHER_RLS_CONFIRMED")) {
    return false;
  }
  return true;
}

/**
 * P4.4 · workspace Coach Racines · même pattern double confirmation.
 * `COACH_WORKSPACE_ENABLED` seul en dev · en prod, requiert aussi
 * `ROOTS_COACH_RLS_CONFIRMED=true` (policies RLS + projection function
 * posées et validées).
 *
 * Note · `RACINES_COACH_OPERATIONAL` reste indépendant · il gouverne
 * l'opérationnalité commerciale (paiement, réservation session, etc.),
 * pas l'exposition du workspace en lecture.
 */
export function isRootsCoachWorkspaceActive(): boolean {
  if (!getFlag("COACH_WORKSPACE_ENABLED")) return false;
  if (process.env.NODE_ENV === "production" && !getFlag("ROOTS_COACH_RLS_CONFIRMED")) {
    return false;
  }
  return true;
}

/**
 * P4.5 · workflow assignments (Monde + Racines). `ASSIGNMENTS_ENABLED = false`
 * verrouille TOUTES les nouvelles routes P4.5 en 404/placeholder. En production,
 * l'exposition effective d'un endpoint reste conditionnée aux guards RLS
 * existants Teacher (`isTeacherWorkspaceActive`) ou Coach
 * (`isRootsCoachWorkspaceActive`) selon le contexte · brief §22.
 */
export function isAssignmentsActive(): boolean {
  return getFlag("ASSIGNMENTS_ENABLED");
}

/**
 * P4.5 · audio (submission + feedback). Requiert `ASSIGNMENTS_ENABLED` en
 * plus de `AUDIO_FEEDBACK_ENABLED` · un déploiement peut vouloir garder
 * l'audio verrouillé pendant que l'écrit est déjà accepté (brief §22).
 */
export function isAudioFeedbackActive(): boolean {
  return isAssignmentsActive() && getFlag("AUDIO_FEEDBACK_ENABLED");
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
