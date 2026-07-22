// P1 · Funnel state derivation · source de vérité DB, aucune migration.
//
// Doctrine §7-8 : ne pas ajouter une table generic « onboarding_state » quand
// LearningPath + onboardingAnswers JSON couvrent tous les besoins P1. L'état
// du funnel est dérivé, jamais dupliqué.
//
//   ACCOUNT_READY         → user existe (Supabase Auth)
//   UNIVERSE_SELECTED     → LearningPath ACTIVE avec universe
//   LANGUAGE_SELECTED     → LearningPath.language non-null
//   SELF_ASSESSED         → currentLevel (Monde) OU onboardingAnswers.racinesStep (Racines)
//   DISCOVERY_STARTED     → onboardingAnswers.discoveryProgress contient ≥1
//   DISCOVERY_COMPLETED   → discoveryProgress contient les 4 leçons
//   ACTIVATION_SELECTED   → onboardingAnswers.activationIntent défini
//   ACTIVATED             → AccessGrant ACTIVE sur ce LearningPath
//
// Persistance additionnelle DANS onboardingAnswers (JSON) :
//   { why, startPoint, racinesStep?, discoveryProgress: number[],
//     activationIntent: { offer, level?, currency, period?, withTeacher } }

import type { LearningPath } from "@prisma/client";
import { DISCOVERY_TOTAL, isLanguageActive } from "@/lib/discovery";

export type FunnelStep =
  | "ACCOUNT_READY"
  | "UNIVERSE_SELECTED"
  | "LANGUAGE_SELECTED"
  | "SELF_ASSESSED"
  | "DISCOVERY_STARTED"
  | "DISCOVERY_COMPLETED"
  | "ACTIVATION_SELECTED"
  | "ACTIVATED";

export type Universe = "MONDE" | "RACINES";
export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1";
export type RacinesStep = "E1" | "E2" | "E3" | "E4" | "E5";

export interface ActivationIntent {
  // Monde
  offer?: "PASSAGE";
  cefrLevel?: CefrLevel;
  withTeacher?: boolean;
  // Racines
  racinesOffer?: "SOLO" | "FAMILLE";
  racinesPeriod?: "MONTH" | "YEAR";
  // commun
  currency: "XAF" | "EUR";
  selectedAt: string;
}

export interface FunnelAnswers {
  why?: string;
  startPoint?: string;
  // Legacy (P1 initial · dérivé de startPoint). Toujours lu pour rétro-compat.
  cefrSelfAssessed?: CefrLevel;
  racinesStep?: RacinesStep;
  // Nouveau (P1 hardening §2-3) · vraie sélection 5 options.
  selfAssessmentAnswer?: 1 | 2 | 3 | 4 | 5;
  declaredLevel?: CefrLevel | RacinesStep;
  recommendedLevel?: CefrLevel | RacinesStep;
  discoveryProgress?: number[];
  activationIntent?: ActivationIntent;
}

/** Parse robuste du JSON onboardingAnswers (peut être null, string ou object). */
export function readAnswers(lp: Pick<LearningPath, "onboardingAnswers"> | null): FunnelAnswers {
  if (!lp?.onboardingAnswers) return {};
  const raw = lp.onboardingAnswers as unknown;
  if (typeof raw === "string") {
    try { return JSON.parse(raw) as FunnelAnswers; } catch { return {}; }
  }
  if (raw && typeof raw === "object") return raw as FunnelAnswers;
  return {};
}

export interface FunnelInput {
  hasSupabaseUser: boolean;
  learningPath: Pick<LearningPath, "universe" | "language" | "currentLevel" | "onboardingAnswers"> | null;
  hasActiveAccessGrant: boolean;
}

/** Renvoie l'étape la plus avancée atteinte par l'utilisateur. */
export function deriveFunnelStep(input: FunnelInput): FunnelStep {
  if (!input.hasSupabaseUser) return "ACCOUNT_READY";
  if (input.hasActiveAccessGrant) return "ACTIVATED";

  const lp = input.learningPath;
  if (!lp?.universe) return "ACCOUNT_READY";

  const answers = readAnswers(lp);

  if (!lp.language) return "UNIVERSE_SELECTED";

  const isMonde = lp.universe === "MONDE";
  // Nouveau (P1 hardening) : selfAssessmentAnswer + declaredLevel priment
  // sur les clés legacy cefrSelfAssessed / racinesStep pour marquer une
  // vraie évaluation. Le formulaire d'univers pré-remplit les legacy
  // dérivées de startPoint, mais l'utilisateur DOIT passer par l'écran
  // niveau 5 options pour être considéré « self-assessed ».
  const hasNewAnswer = Boolean(answers.selfAssessmentAnswer && answers.declaredLevel);
  const hasLegacyMonde = isMonde && (lp.currentLevel || answers.cefrSelfAssessed);
  const hasLegacyRacines = !isMonde && answers.racinesStep;
  const selfAssessed = hasNewAnswer || Boolean(hasLegacyMonde) || Boolean(hasLegacyRacines);
  if (!selfAssessed) return "LANGUAGE_SELECTED";

  const progress = Array.isArray(answers.discoveryProgress) ? answers.discoveryProgress : [];
  if (progress.length === 0) return "SELF_ASSESSED";
  if (progress.length < DISCOVERY_TOTAL) return "DISCOVERY_STARTED";
  if (!answers.activationIntent) return "DISCOVERY_COMPLETED";
  return "ACTIVATION_SELECTED";
}

/** Prochaine URL logique (sans locale — le caller préfixe). */
export function nextFunnelHref(step: FunnelStep, input: FunnelInput): string {
  switch (step) {
    case "ACCOUNT_READY":
      return "/onboarding";
    case "UNIVERSE_SELECTED":
      // On envoie sur le formulaire d'univers existant : /onboarding/{monde|racines}
      return input.learningPath?.universe === "RACINES"
        ? "/onboarding/racines"
        : "/onboarding/monde";
    case "LANGUAGE_SELECTED":
      // Le formulaire d'univers est fini (LP + language présents), il manque
      // la vraie auto-évaluation 5 options (§2-3 hardening).
      return input.learningPath?.universe === "RACINES"
        ? "/onboarding/racines/niveau"
        : "/onboarding/monde/niveau";
    case "SELF_ASSESSED":
      // Racines n'a pas encore de contenu → attente (voir router /decouverte).
      return "/decouverte/1";
    case "DISCOVERY_STARTED": {
      const answers = readAnswers(input.learningPath);
      const done = new Set(answers.discoveryProgress ?? []);
      const next = [1, 2, 3, 4].find((n) => !done.has(n)) ?? 1;
      return `/decouverte/${next}`;
    }
    case "DISCOVERY_COMPLETED":
      return "/decouverte/bilan";
    case "ACTIVATION_SELECTED":
      // Après enregistrement de l'intention : dashboard (P5 gèrera le paiement)
      return "/dashboard";
    case "ACTIVATED":
      return "/dashboard";
  }
}

/** Confort côté client · un langId est jouable si son statut est active. */
export function canPlayLanguage(langId: string): boolean {
  return isLanguageActive(langId);
}
