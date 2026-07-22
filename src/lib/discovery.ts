// P1 · Contenu de découverte YEMA · quatre leçons par langue active.
//
// Doctrine §14-15 : une langue ne peut être « active » que si elle possède
// ses quatre leçons complètes. Aucune génération de contenu, aucune IA,
// aucun texte inventé sensible. Les leçons deutsch sont dérivées du track
// A1 Beta déjà seedé (src/data/a1-beta-modules.ts), champ par champ, sans
// dépendance à un service externe.
//
// Toute langue non listée ici est marquée « bientôt disponible » côté
// selection screen et n'ouvre pas de flux de découverte.

import type { LanguageCode } from "@prisma/client";

export type DiscoveryLangId = "deutsch";

export type ExerciseType = "mcq" | "match" | "order";

export interface DiscoveryExercise {
  id: string;
  type: ExerciseType;
  prompt: string;
  promptEn: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  explanationEn: string;
}

export interface DiscoveryLesson {
  n: 1 | 2 | 3 | 4;
  title: string;
  titleEn: string;
  objective: string;
  objectiveEn: string;
  intro: string;
  introEn: string;
  vocab: Array<{ de: string; fr: string; en: string; example?: string }>;
  exercises: DiscoveryExercise[];
  // audio est facultatif · si absent, on n'affiche pas de lecteur vide
  audio?: { src: string; durationSec: number; speaker: string };
}

/** Univers d'une langue · Monde ou Racines. */
export type Universe = "MONDE" | "RACINES";

export interface LanguageStatus {
  id: string;
  code: LanguageCode | null;   // null pour langues non représentées en Prisma
  universe: Universe;
  nameFr: string;
  nameEn: string;
  status: "active" | "soon";   // active = 4 leçons prêtes ; soon = liste d'attente
  activatedAt?: string;
}

// Sources : docs/YEMA_PRODUCT_DESIGN_DOCTRINE.md §7 (langues opérationnelles)
// + audit P1 (§6) — seule DEUTSCH a du contenu réel dans le repo.
// Ajouter une langue = 4 leçons complètes dans DISCOVERY_LESSONS + activation ici.
export const LANGUAGES: LanguageStatus[] = [
  // Monde · Le voyage
  { id: "deutsch",  code: "DEUTSCH", universe: "MONDE",   nameFr: "Allemand", nameEn: "German",  status: "active", activatedAt: "2026-07-22" },
  { id: "anglais",  code: null,      universe: "MONDE",   nameFr: "Anglais",  nameEn: "English", status: "soon" },
  { id: "francais", code: null,      universe: "MONDE",   nameFr: "Français", nameEn: "French",  status: "soon" },
  // Racines · Les racines · aucune langue active tant que le seed n'existe pas.
  { id: "wolof",    code: "WOLOF",   universe: "RACINES", nameFr: "Wolof",    nameEn: "Wolof",    status: "soon" },
  { id: "douala",   code: "DOUALA",  universe: "RACINES", nameFr: "Douala",   nameEn: "Duala",    status: "soon" },
  { id: "lingala",  code: "LINGALA", universe: "RACINES", nameFr: "Lingala",  nameEn: "Lingala",  status: "soon" },
  { id: "bambara",  code: "BAMBARA", universe: "RACINES", nameFr: "Bambara",  nameEn: "Bambara",  status: "soon" },
];

export function languagesForUniverse(u: Universe): LanguageStatus[] {
  return LANGUAGES.filter((l) => l.universe === u);
}

export function isLanguageActive(id: string): boolean {
  return LANGUAGES.some((l) => l.id === id && l.status === "active");
}

// ─── Contenu de découverte · Deutsch A1 ──────────────────────────
// Adapté du track A1 Beta (src/data/a1-beta-modules.ts). Sélection :
//   L1 Guten Tag · salutations
//   L2 Meine Familie · famille
//   L3 Essen und Trinken · nourriture
//   L4 Meine Wohnung · logement
// Chaque leçon a été raccourcie pour un usage « découverte » (10 min).

const DEUTSCH_DISCOVERY: DiscoveryLesson[] = [
  {
    n: 1,
    title: "Guten Tag !",
    titleEn: "Good day!",
    objective: "Dire bonjour, se présenter, demander comment ça va.",
    objectiveEn: "Say hello, introduce yourself, ask how someone is.",
    intro:
      "En allemand, on distingue tôt les registres. « Hallo » se dit entre amis, « Guten Tag » à un inconnu. La question « Wie geht's ? » (comment ça va ?) attend une vraie réponse.",
    introEn:
      "German makes an early distinction between registers. « Hallo » is between friends, « Guten Tag » is for a stranger. The question « Wie geht's ? » (how are you?) expects a real answer.",
    vocab: [
      { de: "Guten Tag",  fr: "Bonjour",        en: "Good day" },
      { de: "Hallo",      fr: "Salut",          en: "Hi" },
      { de: "Wie geht's?",fr: "Comment ça va ?",en: "How's it going?" },
      { de: "Danke",      fr: "Merci",          en: "Thanks" },
      { de: "Auf Wiedersehen", fr: "Au revoir", en: "Goodbye" },
    ],
    exercises: [
      {
        id: "d1_q1", type: "mcq",
        prompt: "Comment dit-on « Bonjour » (formel) en allemand ?",
        promptEn: "How do you say « Good day » (formal) in German?",
        options: ["Hallo", "Guten Tag", "Danke", "Tschüss"],
        correctIndex: 1,
        explanation: "« Guten Tag » est le bonjour formel utilisé dans la journée.",
        explanationEn: "« Guten Tag » is the formal daytime greeting.",
      },
      {
        id: "d1_q2", type: "mcq",
        prompt: "« Wie geht's ? » signifie…",
        promptEn: "« Wie geht's ? » means…",
        options: ["Quel âge as-tu ?", "Comment ça va ?", "Où habites-tu ?", "Comment tu t'appelles ?"],
        correctIndex: 1,
        explanation: "« Wie geht's ? » est une question fréquente pour prendre des nouvelles.",
        explanationEn: "« Wie geht's ? » is a common way to ask how someone is.",
      },
    ],
  },
  {
    n: 2,
    title: "Meine Familie",
    titleEn: "My family",
    objective: "Parler de sa famille, utiliser les adjectifs possessifs.",
    objectiveEn: "Talk about your family, use possessive adjectives.",
    intro:
      "Comme en français, la famille structure la langue. « Mein » (mon) et « meine » (ma) changent selon le genre du mot. « Mein Bruder » (mon frère), « meine Schwester » (ma sœur).",
    introEn:
      "As in French, family shapes the language. « Mein » (my/masculine) and « meine » (my/feminine) change with the noun's gender. « Mein Bruder » (my brother), « meine Schwester » (my sister).",
    vocab: [
      { de: "die Familie",  fr: "la famille",  en: "the family" },
      { de: "der Vater",    fr: "le père",     en: "the father" },
      { de: "die Mutter",   fr: "la mère",     en: "the mother" },
      { de: "der Bruder",   fr: "le frère",    en: "the brother" },
      { de: "die Schwester",fr: "la sœur",     en: "the sister" },
      { de: "das Kind",     fr: "l'enfant",    en: "the child" },
    ],
    exercises: [
      {
        id: "d2_q1", type: "mcq",
        prompt: "Comment dit-on « la sœur » en allemand ?",
        promptEn: "How do you say « the sister » in German?",
        options: ["der Bruder", "die Schwester", "die Mutter", "das Kind"],
        correctIndex: 1,
        explanation: "« Schwester » est féminin · article « die ».",
        explanationEn: "« Schwester » is feminine · article « die ».",
      },
      {
        id: "d2_q2", type: "mcq",
        prompt: "L'article de « Kind » (enfant) est…",
        promptEn: "The article for « Kind » (child) is…",
        options: ["der", "die", "das", "ein"],
        correctIndex: 2,
        explanation: "« Kind » est neutre · article « das ».",
        explanationEn: "« Kind » is neuter · article « das ».",
      },
    ],
  },
  {
    n: 3,
    title: "Essen und Trinken",
    titleEn: "Food and drink",
    objective: "Commander au restaurant, dire ce qu'on aime manger.",
    objectiveEn: "Order at a restaurant, say what you like to eat.",
    intro:
      "Au restaurant allemand, la formule polie est « Ich hätte gern… » (je voudrais…) suivie du plat. Le café allemand est fort et souvent servi avec un morceau de chocolat.",
    introEn:
      "At a German restaurant, the polite phrase is « Ich hätte gern… » (I would like…) followed by the dish. German coffee is strong and often served with a piece of chocolate.",
    vocab: [
      { de: "das Wasser",  fr: "l'eau",       en: "water" },
      { de: "der Kaffee",  fr: "le café",     en: "coffee" },
      { de: "das Brot",    fr: "le pain",     en: "bread" },
      { de: "das Fleisch", fr: "la viande",   en: "meat" },
      { de: "der Fisch",   fr: "le poisson",  en: "fish" },
      { de: "Ich hätte gern…", fr: "Je voudrais…", en: "I would like…" },
    ],
    exercises: [
      {
        id: "d3_q1", type: "mcq",
        prompt: "« Ich hätte gern einen Kaffee » signifie…",
        promptEn: "« Ich hätte gern einen Kaffee » means…",
        options: ["Je veux un thé", "Je voudrais un café", "J'aime le café", "Où est le café ?"],
        correctIndex: 1,
        explanation: "Formule de politesse pour commander — « Je voudrais un café ».",
        explanationEn: "Polite phrase to order — « I would like a coffee ».",
      },
      {
        id: "d3_q2", type: "mcq",
        prompt: "Comment dit-on « le pain » en allemand ?",
        promptEn: "How do you say « bread » in German?",
        options: ["das Brot", "das Wasser", "der Fisch", "der Kaffee"],
        correctIndex: 0,
        explanation: "« Brot » est neutre · article « das ».",
        explanationEn: "« Brot » is neuter · article « das ».",
      },
    ],
  },
  {
    n: 4,
    title: "Meine Wohnung",
    titleEn: "My home",
    objective: "Décrire son logement, situer les pièces.",
    objectiveEn: "Describe your home, locate rooms.",
    intro:
      "L'allemand distingue « Wohnung » (appartement) et « Haus » (maison). Les pièces se déclinent : « das Wohnzimmer » (salon), « die Küche » (cuisine), « das Schlafzimmer » (chambre).",
    introEn:
      "German distinguishes « Wohnung » (apartment) and « Haus » (house). Rooms decline: « das Wohnzimmer » (living room), « die Küche » (kitchen), « das Schlafzimmer » (bedroom).",
    vocab: [
      { de: "die Wohnung",     fr: "l'appartement",  en: "apartment" },
      { de: "das Haus",        fr: "la maison",      en: "house" },
      { de: "das Wohnzimmer",  fr: "le salon",       en: "living room" },
      { de: "die Küche",       fr: "la cuisine",     en: "kitchen" },
      { de: "das Schlafzimmer",fr: "la chambre",     en: "bedroom" },
      { de: "das Badezimmer",  fr: "la salle de bain",en:"bathroom" },
    ],
    exercises: [
      {
        id: "d4_q1", type: "mcq",
        prompt: "« Wohnzimmer » se traduit par…",
        promptEn: "« Wohnzimmer » translates to…",
        options: ["chambre", "salon", "cuisine", "salle de bain"],
        correctIndex: 1,
        explanation: "« Wohn- » vient de « wohnen » (habiter) — c'est la pièce où l'on vit ensemble.",
        explanationEn: "« Wohn- » comes from « wohnen » (to live) — the room where the household gathers.",
      },
      {
        id: "d4_q2", type: "mcq",
        prompt: "Quelle est la traduction de « la cuisine » ?",
        promptEn: "What is the translation of « the kitchen »?",
        options: ["das Haus", "die Küche", "das Wohnzimmer", "das Schlafzimmer"],
        correctIndex: 1,
        explanation: "« Küche » est féminin · article « die ».",
        explanationEn: "« Küche » is feminine · article « die ».",
      },
    ],
  },
];

export const DISCOVERY_LESSONS: Record<DiscoveryLangId, DiscoveryLesson[]> = {
  deutsch: DEUTSCH_DISCOVERY,
};

export function getDiscoveryLessons(langId: string): DiscoveryLesson[] | null {
  if (langId in DISCOVERY_LESSONS) {
    return DISCOVERY_LESSONS[langId as DiscoveryLangId];
  }
  return null;
}

export function getDiscoveryLesson(langId: string, n: number): DiscoveryLesson | null {
  const lessons = getDiscoveryLessons(langId);
  if (!lessons) return null;
  return lessons.find((l) => l.n === n) ?? null;
}

/** Convertit un LanguageCode Prisma (DEUTSCH, WOLOF…) vers l'id de discovery/languages.ts */
export function prismaLangToId(code: string | null): string | null {
  if (!code) return null;
  return code.toLowerCase();
}

export const DISCOVERY_TOTAL = 4 as const;

// ─── Disponibilité par niveau Monde · sources séparées prix / contenu ─
//
// Doctrine §7 : le prix est UNE DÉCISION commerciale et peut être affiché
// pour tous les niveaux. La DISPONIBILITÉ dépend du contenu réel dans
// le repo. Ne PAS confondre :
//
//   priced         → le prix officiel P0.A est affichable
//   discoveryReady → les 4 leçons de découverte existent (§14)
//   courseReady    → le programme complet du Passage existe (P2+)
//   purchasable    → l'achat peut être délivré réellement (P5)
//
// Aujourd'hui : SEUL A1 a du contenu de découverte. Aucun niveau n'a le
// programme complet ni un pipeline d'achat opérationnel.

export type MondeLevel = "A1" | "A2" | "B1" | "B2" | "C1";

export interface MondeLevelAvailability {
  priced: boolean;
  discoveryReady: boolean;
  courseReady: boolean;
  purchasable: boolean;
}

export const MONDE_LEVEL_AVAILABILITY: Record<MondeLevel, MondeLevelAvailability> = {
  A1: { priced: true, discoveryReady: true,  courseReady: false, purchasable: false },
  A2: { priced: true, discoveryReady: false, courseReady: false, purchasable: false },
  B1: { priced: true, discoveryReady: false, courseReady: false, purchasable: false },
  B2: { priced: true, discoveryReady: false, courseReady: false, purchasable: false },
  C1: { priced: true, discoveryReady: false, courseReady: false, purchasable: false },
};

export function mondeLevelIsAvailable(level: MondeLevel): boolean {
  return MONDE_LEVEL_AVAILABILITY[level].discoveryReady;
}

export function mondeLevelIsPurchasable(level: MondeLevel): boolean {
  return MONDE_LEVEL_AVAILABILITY[level].purchasable;
}

// Racines : au moins une langue Racines doit exister avec 4 leçons pour
// qu'un niveau É soit « purchasable ». Aujourd'hui : aucun.
export const RACINES_OFFERS_AVAILABLE = false as const;
