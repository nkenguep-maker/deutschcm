// Config tarifaire centralisée · YEMA.
// Deux univers séparés : « les langues du monde » (le voyage) et
// « les langues africaines » (les racines). Chaque univers a ses
// prix sur deux rails · FCFA (Mobile Money, Afrique) et EUR (carte).
//
// Doctrine · on n'affiche jamais un prix d'un univers à côté de
// l'autre. La page /pricing est un écran de choix ; /pricing/monde
// et /pricing/racines rendent chacun son univers avec un seul rail
// visible à la fois.

export type Rail = "fcfa" | "eur";
export type LevelId = "A1" | "A2" | "B1" | "B2" | "C1";

export const LEVELS: readonly LevelId[] = ["A1", "A2", "B1", "B2", "C1"];

// ── Univers 1 · Langues du monde · Le Passage par niveau ──────────
// Le Passage · programme complet d'un niveau, en autonomie · 4 mois,
// examens blancs corrigés, écrit relu, attestation. Prix qui grimpent
// par niveau (charge pédagogique croissante).
export const WORLD_PASSAGE_PRICES: Record<LevelId, Record<Rail, number>> = {
  A1: { fcfa: 49000, eur: 75 },
  A2: { fcfa: 54000, eur: 78 },
  B1: { fcfa: 58000, eur: 85 },
  B2: { fcfa: 64000, eur: 99 },
  C1: { fcfa: 72000, eur: 119 },
};

// Supplément « pack professeur » · s'AJOUTE au Passage, jamais un
// produit parallèle. Affiché avec « + » devant le prix pour lever
// toute ambiguïté.
export const WORLD_TEACHER_ADD: Record<LevelId, Record<Rail, number>> = {
  A1: { fcfa: 30000, eur: 45 },
  A2: { fcfa: 40000, eur: 60 },
  B1: { fcfa: 50000, eur: 75 },
  B2: { fcfa: 60000, eur: 90 },
  C1: { fcfa: 75000, eur: 115 },
};

// ── Univers 2 · Langues africaines · deux offres seulement ───────
// Pas de paliers complexes au lancement. Solo (1 personne, 1 langue)
// ou Famille (2 adultes + 4 enfants max, chacun son profil).
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

// ── Format helpers · locale FR pour espaces fins entre milliers ──
export function fmtFcfa(v: number): string {
  // Espace fine   entre milliers, remplacée par insécable
  // pour garantir le rendu sur tous les navigateurs.
  return new Intl.NumberFormat("fr-FR", { useGrouping: true })
    .format(v)
    .replace(/ /g, " ");
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

// ── Détection du rail par défaut · client-side ───────────────────
// Heuristique · navigator.language (-CM, -SN, -CI, -CD, -TG, -BF,
// -BJ, -ML, -NE, -GN, -MG, -CG, -GA) ou timezone Africa/* → FCFA.
// Sinon EUR. L'utilisateur peut toujours basculer via le toggle.
export function detectDefaultRail(): Rail {
  if (typeof window === "undefined") return "eur";
  try {
    const lang = navigator.language || "";
    if (/-(CM|SN|CI|CD|TG|BF|BJ|ML|NE|GN|MG|CG|GA|GN|TD|CF|BI|RW|GH|NG)$/i.test(lang)) {
      return "fcfa";
    }
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && /^africa\//i.test(tz)) return "fcfa";
  } catch {
    // silent — défaut EUR
  }
  return "eur";
}

// ── Copy éditoriale · bilingue, une seule source ──────────────────
// Structuré pour matcher la doctrine actuelle du repo (inline dans
// chaque page, jamais dans messages/*.json).
export const PRICING_COPY = {
  fr: {
    // Écran de choix · /pricing
    doorsKicker: "Deux mondes, deux façons d'entrer.",
    doorsTitle: "Que voulez-vous apprendre ?",
    doorsSub: "Choisissez d'abord l'univers. Le tarif suit.",
    doorMonde: {
      kicker: "Le voyage",
      title: "Les langues du monde",
      sub: "Partir, étudier, travailler. Un niveau, un but précis, une attestation.",
      cta: "Entrer",
    },
    doorRacines: {
      kicker: "Les racines",
      title: "Les langues africaines",
      sub: "Pour soi, pour ses enfants. On habite la langue, on la transmet.",
      cta: "Entrer",
    },
    back: "← Retour au choix",
    railFcfa: "FCFA",
    railEur: "€",
    railNoteFcfa: "Mobile Money",
    railNoteEur: "Carte bancaire",
    // Bloc L'entrée · gratuit (haut des DEUX univers)
    entryKicker: "L'entrée",
    entryTitle: "Gratuit",
    entrySub: "Pour tester la maison.",
    entryFeatures: [
      "Test de niveau court",
      "Première leçon complète",
      "Un récit de la Veillée, avec ses mots",
      "Une conversation Klaus de 5 minutes",
      "Mini-rapport personnalisé à la fin",
    ],
    entryCta: "Commencer gratuitement",
    // Univers 1 · monde
    mondeTitle: "Les langues du monde",
    mondeSub: "Le programme complet d'un niveau, à votre rythme.",
    passageKicker: "Étape 1 · Le Passage",
    passageTitle: "Un niveau complet, en autonomie",
    passageSub: "Exercices, IA, examens blancs corrigés, écrit relu, attestation. Accès 4 mois.",
    passageLevel: "Niveau",
    passagePrice: (level: LevelId) => `Le Passage · ${level}`,
    passagePer: "par niveau · 4 mois",
    passageCta: "Prendre ce Passage",
    // Univers 1 · pack prof
    teacherKicker: "Étape 2 · Optionnel",
    teacherLede: "En option, ajoutez un professeur à votre Passage.",
    teacherTitle: "Un professeur qui vous suit",
    teacherSub: "Il corrige vos épreuves, pose des devoirs, anime le fil de discussion (audio compris). Un prix par niveau, en supplément du Passage.",
    teacherBadge: "Supplément au Passage · optionnel",
    teacherAdd: "en plus",
    teacherCta: "Ajouter un professeur",
    // Univers 2 · racines
    racinesTitle: "Les langues africaines",
    racinesSub: "On habite la langue. On la transmet.",
    soloName: "Solo",
    soloSub: "Une personne, une langue.",
    soloMonth: "par mois",
    soloYear: "par an",
    soloOr: "ou",
    soloCta: "Rejoindre",
    familyName: "Famille",
    familySub: "Deux adultes, jusqu'à quatre enfants. Chacun son profil.",
    familyMonth: "par mois",
    familyYear: "par an",
    familyOr: "ou",
    familyCta: "Rejoindre",
    profReminderTitle: "Un professeur en supplément",
    profReminderSub: "Le pack professeur des langues du monde est aussi disponible ici. Un prix par niveau, à ajouter à votre offre.",
    profReminderCta: "Voir les tarifs professeur",
    // Bas de page · mentions
    foundersLine: "Cercle des Fondateurs · tarif garanti 24 mois, puis −30 % permanent tant que l'abonnement reste actif.",
    guaranteeLine: "14 jours satisfait ou remboursé.",
    // Sep & labels
    sep: "·",
  },
  en: {
    doorsKicker: "Two worlds, two ways in.",
    doorsTitle: "What do you want to learn?",
    doorsSub: "Pick the universe first. Pricing follows.",
    doorMonde: {
      kicker: "The journey",
      title: "World languages",
      sub: "Leave, study, work. One level, one precise goal, one certificate.",
      cta: "Enter",
    },
    doorRacines: {
      kicker: "The roots",
      title: "African languages",
      sub: "For yourself, for your children. Live in the language, pass it on.",
      cta: "Enter",
    },
    back: "← Back to choice",
    railFcfa: "FCFA",
    railEur: "€",
    railNoteFcfa: "Mobile Money",
    railNoteEur: "Card payment",
    entryKicker: "The Entrance",
    entryTitle: "Free",
    entrySub: "To taste the house.",
    entryFeatures: [
      "Short level test",
      "One full lesson",
      "One story from the Veillée",
      "A five-minute Klaus conversation",
      "Personal mini-report at the end",
    ],
    entryCta: "Start free",
    mondeTitle: "World languages",
    mondeSub: "The full programme of one level, at your own pace.",
    passageKicker: "Step 1 · The Passage",
    passageTitle: "A full level, on your own",
    passageSub: "Exercises, AI, corrected mock exams, reviewed writing, certificate. Four-month access.",
    passageLevel: "Level",
    passagePrice: (level: LevelId) => `The Passage · ${level}`,
    passagePer: "per level · 4 months",
    passageCta: "Take this Passage",
    teacherKicker: "Step 2 · Optional",
    teacherLede: "Optionally, add a teacher to your Passage.",
    teacherTitle: "A teacher who follows you",
    teacherSub: "They mark your work, set homework, run the class thread (audio included). One price per level, on top of the Passage.",
    teacherBadge: "Add-on to the Passage · optional",
    teacherAdd: "extra",
    teacherCta: "Add a teacher",
    racinesTitle: "African languages",
    racinesSub: "Live in the language. Pass it on.",
    soloName: "Solo",
    soloSub: "One person, one language.",
    soloMonth: "per month",
    soloYear: "per year",
    soloOr: "or",
    soloCta: "Join",
    familyName: "Family",
    familySub: "Two adults, up to four children. Each with their own profile.",
    familyMonth: "per month",
    familyYear: "per year",
    familyOr: "or",
    familyCta: "Join",
    profReminderTitle: "A teacher as an add-on",
    profReminderSub: "The world-languages teacher pack is also available here. One price per level, on top of your offer.",
    profReminderCta: "See teacher prices",
    foundersLine: "Founders' Circle · rate locked for 24 months, then −30% forever as long as the subscription is active.",
    guaranteeLine: "14 days money-back.",
    sep: "·",
  },
} as const;

export type PricingLocale = keyof typeof PRICING_COPY;
