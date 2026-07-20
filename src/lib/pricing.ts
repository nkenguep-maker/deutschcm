// Config tarifaire centralisée · YEMA.
// Deux univers séparés · « les langues du monde » (le voyage) et
// « les langues africaines » (les racines). Un prix d'un univers ne
// s'affiche jamais à côté de l'autre.
//
// /pricing = seuil (aucun prix). /pricing/monde et /pricing/racines
// rendent chacun leur univers avec un seul rail visible.

export type Rail = "fcfa" | "eur";
export type LevelId = "A1" | "A2" | "B1" | "B2" | "C1";

export const LEVELS: readonly LevelId[] = ["A1", "A2", "B1", "B2", "C1"];

// ── Univers 1 · Langues du monde · Le Passage par niveau ──────────
export const WORLD_PASSAGE_PRICES: Record<LevelId, Record<Rail, number>> = {
  A1: { fcfa: 49000, eur: 75 },
  A2: { fcfa: 54000, eur: 78 },
  B1: { fcfa: 58000, eur: 85 },
  B2: { fcfa: 64000, eur: 99 },
  C1: { fcfa: 72000, eur: 119 },
};

// Supplément « pack professeur » · s'AJOUTE au Passage, jamais un
// produit parallèle. Affiché avec « + » devant.
export const WORLD_TEACHER_ADD: Record<LevelId, Record<Rail, number>> = {
  A1: { fcfa: 30000, eur: 45 },
  A2: { fcfa: 40000, eur: 60 },
  B1: { fcfa: 50000, eur: 75 },
  B2: { fcfa: 60000, eur: 90 },
  C1: { fcfa: 75000, eur: 115 },
};

// ── Univers 2 · Langues africaines · Solo · Famille ──────────────
export interface AfricanOfferPrice {
  month: number;
  year: number;
}
export interface AfricanOffer {
  fcfa: AfricanOfferPrice;
  eur: AfricanOfferPrice;
}
export const AFRICAN_SOLO: AfricanOffer = {
  fcfa: { month: 3500, year: 35000 },
  eur:  { month: 9.90, year: 99 },
};
export const AFRICAN_FAMILY: AfricanOffer = {
  fcfa: { month: 9900, year: 99000 },
  eur:  { month: 19.90, year: 149 },
};

export type Period = "month" | "year";
/** Périodicité par défaut adaptée au rail · mensuel accessible en
 *  FCFA (Cameroun / Afrique de l'Ouest), annuel en EUR (diaspora,
 *  paiement CB rare à petit ticket). L'autre reste visible d'un tap. */
export function defaultPeriodFor(rail: Rail): Period {
  return rail === "fcfa" ? "month" : "year";
}

// ── Langues citées dans les portes · toujours en groupe ──────────
// Doctrine · au moins 2 langues cohabitent, jamais un pays d'origine
// unique. On ne dit pas d'où viennent les langues, on dit ce qu'elles
// permettent.
export const WORLD_LANGS_FR = "allemand, anglais, français, et d’autres à venir";
export const WORLD_LANGS_EN = "German, English, French, and more soon";
export const RACINES_LANGS_FR = "wolof, bassa, douala, lingala, et d’autres à venir";
export const RACINES_LANGS_EN = "Wolof, Bassa, Douala, Lingala, and more soon";

// ── Format helpers · locale FR pour espaces insécables ───────────
const NBSP = " ";
export function fmtFcfa(v: number): string {
  return new Intl.NumberFormat("fr-FR", { useGrouping: true })
    .format(v)
    .replace(/ /g, NBSP);
}
export function fmtEur(v: number): string {
  const decimals = v % 1 === 0 ? 0 : 2;
  return v.toLocaleString("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
export function fmtPrice(v: number, rail: Rail): string {
  return rail === "fcfa" ? fmtFcfa(v) : fmtEur(v);
}
/** Rend un prix + devise avec insécable garantie · « 49 000 FCFA », « 75 € ». */
export function fmtPriceUnit(v: number, rail: Rail): string {
  const value = fmtPrice(v, rail);
  const unit = rail === "fcfa" ? "FCFA" : "€";
  return `${value}${NBSP}${unit}`;
}

// ── Détection du rail par défaut · client-side ───────────────────
export function detectDefaultRail(): Rail {
  if (typeof window === "undefined") return "eur";
  try {
    const lang = navigator.language || "";
    if (/-(CM|SN|CI|CD|TG|BF|BJ|ML|NE|GN|MG|CG|GA|TD|CF|BI|RW|GH|NG)$/i.test(lang)) {
      return "fcfa";
    }
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && /^africa\//i.test(tz)) return "fcfa";
  } catch { /* défaut EUR */ }
  return "eur";
}

// ── Copy éditoriale · bilingue, source de vérité unique ──────────
export const PRICING_COPY = {
  fr: {
    // Écran de choix · /pricing (seuil bref, aucun prix)
    doorsKicker: "Le seuil",
    doorsTitle: "Que voulez-vous apprendre ?",
    doorsSub: "Deux mondes. Deux façons d’entrer dans la maison.",
    doorMonde: {
      kicker: "Le voyage",
      title: "Les langues du monde",
      lede: "Partir. Étudier. Travailler. Rejoindre.",
      langs: WORLD_LANGS_FR,
      cta: "Entrer",
    },
    doorRacines: {
      kicker: "Les racines",
      title: "Les langues africaines",
      lede: "Comprendre. Entretenir. Transmettre.",
      langs: RACINES_LANGS_FR,
      cta: "Entrer",
    },
    back: "← Retour au seuil",
    railFcfa: "FCFA",
    railEur: "€",
    railNoteFcfa: "Paiement Mobile Money",
    railNoteEur: "Paiement par carte",
    railPeriodMonth: "Mensuel",
    railPeriodYear: "Annuel",
    railPeriodMonthShort: "/ mois",
    railPeriodYearShort: "/ an",

    // Bloc L'entrée · une vraie leçon, pas un « essai »
    entryKicker: "L’entrée",
    entryTitle: "Commencer par une vraie leçon.",
    entrySub: "Pour sentir la maison avant d’y entrer.",
    entryFeatures: [
      "Un test de niveau court",
      "Une première leçon complète",
      "Un récit de la Veillée, avec ses mots",
      "Une conversation Klaus de cinq minutes",
      "Un mini-rapport personnalisé",
    ],
    entryCta: "Commencer par une leçon",

    // Univers 1 · monde
    mondeKicker: "Le voyage",
    mondeTitle: "Un niveau complet, à votre rythme.",
    mondeSub: "Le programme entier d’un niveau, sur quatre mois. Vous partez.",
    passageStepLabel: "Le Passage",
    passageIntro: "Choisissez un niveau. Le programme complet suit.",
    passagePer: "par niveau · 4 mois",
    passageIncludes: [
      "Programme complet du niveau",
      "Exercices, pratique IA, écrit relu",
      "Examens blancs corrigés",
      "Attestation de fin de niveau",
      "Accès quatre mois",
    ],
    passageCta: (lvl: LevelId) => `Commencer ${lvl}`,
    passageLevelChoose: (lvl: LevelId) => `Choisir ${lvl}`,

    teacherStepLabel: "Un professeur qui vous suit",
    teacherLede: "En option, ajoutez un professeur à votre Passage.",
    teacherIncludes: [
      "Correction des épreuves",
      "Devoirs et audios",
      "Fil de discussion",
      "Retour humain, rythme accompagné",
    ],
    teacherBadge: "Supplément au Passage · optionnel",
    teacherPer: "à ajouter au Passage",
    teacherCta: "Ajouter un professeur",

    // Univers 2 · racines
    racinesKicker: "Les racines",
    racinesTitle: "Habiter la langue.",
    racinesTitleEm: "La transmettre.",
    racinesSub: "Pour soi, pour ses enfants. Un abonnement sobre.",
    soloName: "Solo",
    soloLede: "Pour une personne.",
    soloIncludes: [
      "Une personne, une langue",
      "La Veillée complète",
      "Contes, proverbes, pratique",
      "Résiliable à tout moment",
    ],
    soloCta: "Rejoindre Solo",
    familyName: "Famille",
    familyLede: "Pour deux adultes et jusqu’à quatre enfants.",
    familyIncludes: [
      "Deux adultes, quatre enfants maximum",
      "Un profil nominatif par personne, progression séparée",
      "Contes, chansons, jeux pour enfants",
      "Contrôle parental, limite de temps d’écran",
    ],
    familyCta: "Créer les profils de ma famille",
    familyBadge: "Pour tout le foyer",

    profReminderTitle: "Un professeur peut aussi accompagner votre parcours.",
    profReminderSub: "Un pack par niveau, jamais au mois. Un locuteur natif accrédité assure le suivi.",
    profReminderCta: "Voir les tarifs professeur",

    // Réassurance · sous le prix
    trust: [
      "Accès quatre mois pour Le Passage.",
      "Abonnement mensuel ou annuel pour les racines.",
      "Mobile Money ou carte bancaire.",
      "Quatorze jours satisfait ou remboursé.",
    ],
    foundersLine: "Cercle des Fondateurs · tarif garanti vingt-quatre mois, puis −30 % permanent tant que l’abonnement reste actif.",
  },
  en: {
    doorsKicker: "The threshold",
    doorsTitle: "What do you want to learn?",
    doorsSub: "Two worlds. Two ways to enter the house.",
    doorMonde: {
      kicker: "The journey",
      title: "World languages",
      lede: "Leave. Study. Work. Reach out.",
      langs: WORLD_LANGS_EN,
      cta: "Enter",
    },
    doorRacines: {
      kicker: "The roots",
      title: "African languages",
      lede: "Understand. Tend. Pass on.",
      langs: RACINES_LANGS_EN,
      cta: "Enter",
    },
    back: "← Back to the threshold",
    railFcfa: "FCFA",
    railEur: "€",
    railNoteFcfa: "Mobile Money payment",
    railNoteEur: "Card payment",
    railPeriodMonth: "Monthly",
    railPeriodYear: "Yearly",
    railPeriodMonthShort: "/ month",
    railPeriodYearShort: "/ year",

    entryKicker: "The entrance",
    entryTitle: "Start with a real lesson.",
    entrySub: "To feel the house before entering it.",
    entryFeatures: [
      "A short level test",
      "One full lesson",
      "One story from the Veillée",
      "A five-minute Klaus conversation",
      "A personal mini-report",
    ],
    entryCta: "Start with a lesson",

    mondeKicker: "The journey",
    mondeTitle: "A full level, at your own pace.",
    mondeSub: "The complete programme of one level, across four months. You leave.",
    passageStepLabel: "The Passage",
    passageIntro: "Pick a level. The full programme follows.",
    passagePer: "per level · 4 months",
    passageIncludes: [
      "Full level programme",
      "Exercises, AI practice, reviewed writing",
      "Corrected mock exams",
      "End-of-level certificate",
      "Four-month access",
    ],
    passageCta: (lvl: LevelId) => `Start ${lvl}`,
    passageLevelChoose: (lvl: LevelId) => `Choose ${lvl}`,

    teacherStepLabel: "A teacher who follows you",
    teacherLede: "Optionally, add a teacher to your Passage.",
    teacherIncludes: [
      "Marked assignments",
      "Homework and audio",
      "Class thread",
      "Human feedback, guided rhythm",
    ],
    teacherBadge: "Add-on to the Passage · optional",
    teacherPer: "to add to the Passage",
    teacherCta: "Add a teacher",

    racinesKicker: "The roots",
    racinesTitle: "Live in the language.",
    racinesTitleEm: "Pass it on.",
    racinesSub: "For yourself, for your children. A sober subscription.",
    soloName: "Solo",
    soloLede: "For one person.",
    soloIncludes: [
      "One person, one language",
      "The full Veillée",
      "Tales, proverbs, practice",
      "Cancel any time",
    ],
    soloCta: "Join Solo",
    familyName: "Family",
    familyLede: "For two adults and up to four children.",
    familyIncludes: [
      "Two adults, four children maximum",
      "One named profile per person, separate progress",
      "Tales, songs, games for children",
      "Parent controls, screen-time limit",
    ],
    familyCta: "Create my family profiles",
    familyBadge: "For the whole home",

    profReminderTitle: "A teacher can also accompany your journey.",
    profReminderSub: "One pack per level, never per month. A vetted native speaker leads the follow-up.",
    profReminderCta: "See teacher prices",

    trust: [
      "Four-month access for the Passage.",
      "Monthly or yearly subscription for the roots.",
      "Mobile Money or card payment.",
      "Fourteen days money-back.",
    ],
    foundersLine: "Founders’ Circle · rate locked for twenty-four months, then −30% forever as long as the subscription stays active.",
  },
} as const;

export type PricingLocale = keyof typeof PRICING_COPY;
