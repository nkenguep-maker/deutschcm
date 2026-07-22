// P3 · Racines seam · état des langues Racines et progression É1-É5.
//
// Doctrine §8 · l'échelle Racines est É1 (Écoute) → É5 (Foyer). Elle ne
// s'aligne PAS sur CECRL. Utilisée à la fois côté profil adulte (SelfAssessment
// racinesStep) et côté profil enfant (ChildLangue.echelle sur native).
//
// Cohérence · réutilise NATAL_STEPS/labels de src/lib/childScales.ts sans
// dupliquer. Ce module ajoute :
//   - definition claire de chaque étape (doctrine §8)
//   - statut opérationnel par langue Racines (READY / PARTIAL / MISSING)
//   - helper canAccessRacinesContent(langId)

import { NATAL_STEPS, NATAL_LABEL_FR, NATAL_LABEL_EN, type NatalStep } from "@/lib/childScales";
import { LANGUAGES } from "@/lib/discovery";

export type RacinesStep = NatalStep;                       // "E1" | ... | "E5"
export const RACINES_STEPS = NATAL_STEPS;                  // ["E1", ..., "E5"]

export interface RacinesStepDefinition {
  key: RacinesStep;
  labelFr: string;
  labelEn: string;
  descriptionFr: string;
  descriptionEn: string;
}

/** Définition doctrinale §8 · courte, honnête, utilisable en UI. */
export const RACINES_STEP_DEFINITIONS: RacinesStepDefinition[] = [
  {
    key: "E1",
    labelFr: NATAL_LABEL_FR.E1,
    labelEn: NATAL_LABEL_EN.E1,
    descriptionFr: "Reconnaître, écouter, mémoriser, comprendre des éléments simples.",
    descriptionEn: "Recognise, listen, memorise, understand simple pieces.",
  },
  {
    key: "E2",
    labelFr: NATAL_LABEL_FR.E2,
    labelEn: NATAL_LABEL_EN.E2,
    descriptionFr: "Répéter, prononcer, dire des phrases simples.",
    descriptionEn: "Repeat, pronounce, say simple sentences.",
  },
  {
    key: "E3",
    labelFr: NATAL_LABEL_FR.E3,
    labelEn: NATAL_LABEL_EN.E3,
    descriptionFr: "Comprendre et raconter une histoire courte, enrichir le vocabulaire narratif.",
    descriptionEn: "Understand and tell a short story, enrich narrative vocabulary.",
  },
  {
    key: "E4",
    labelFr: NATAL_LABEL_FR.E4,
    labelEn: NATAL_LABEL_EN.E4,
    descriptionFr: "Dialoguer, poser des questions, exprimer un avis, participer à une conversation.",
    descriptionEn: "Dialogue, ask questions, express an opinion, join a conversation.",
  },
  {
    key: "E5",
    labelFr: NATAL_LABEL_FR.E5,
    labelEn: NATAL_LABEL_EN.E5,
    descriptionFr: "Transmettre, raconter aux proches, utiliser la langue dans le quotidien familial.",
    descriptionEn: "Pass on, tell those close to you, use the language in daily family life.",
  },
];

// ─── Statut opérationnel par langue Racines ────────────────────
// §6 · une langue n'est déclarée READY que si elle a 4 leçons complètes,
// parcours cohérent, contenu relu, exercices, progression É1-É5 et droits
// éditoriaux clairs. Dans l'état actuel du repo · aucune langue Racines
// n'a de contenu seedé (voir docs/YEMA_P1_FUNNEL.md §15 et audit P2).

export type RacinesContentStatus = "READY" | "PARTIAL" | "MISSING";

export const RACINES_LANG_STATUS: Record<string, RacinesContentStatus> = {
  wolof:   "MISSING",
  douala:  "MISSING",
  lingala: "MISSING",
  bambara: "MISSING",
};

/** L'utilisateur peut-il accéder à du contenu Racines pour cette langue ? */
export function canAccessRacinesContent(langId: string): boolean {
  return RACINES_LANG_STATUS[langId] === "READY";
}

/** Liste des langues Racines connues + leur statut. */
export function racinesLanguagesWithStatus(): Array<{
  id: string; nameFr: string; nameEn: string; status: RacinesContentStatus;
}> {
  return LANGUAGES
    .filter((l) => l.universe === "RACINES")
    .map((l) => ({
      id: l.id,
      nameFr: l.nameFr,
      nameEn: l.nameEn,
      status: RACINES_LANG_STATUS[l.id] ?? "MISSING",
    }));
}

/** Aucune langue Racines n'est active tant que RACINES_LANG_STATUS ne l'a pas
 *  passée à READY. Empêche toute activation commerciale prématurée. */
export function anyRacinesLanguageReady(): boolean {
  return Object.values(RACINES_LANG_STATUS).some((s) => s === "READY");
}

// ─── Type de profil actif Racines ──────────────────────────────

export type RacinesProfileMode = "SOLO" | "FAMILY";

/** Détermine le mode du profil actif : Solo (aucun ChildProfile) ou Family
 *  (au moins un ChildProfile). Le paramètre est le compte du calling user
 *  côté serveur — l'ownership est déjà validé par le caller. */
export function inferProfileMode(childrenCount: number): RacinesProfileMode {
  return childrenCount > 0 ? "FAMILY" : "SOLO";
}
