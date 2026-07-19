// Registre des langues YEMA · unique source de vérité.
//
// Deux mondes :
//   · world   → langues du monde, échelle CECRL (A1 → C1/C2)
//   · sources → langues africaines, échelle YEMA (É1 → É5 :
//               Écoute · Voix · Récit · Palabre · Foyer)
//
// Chaque langue porte son territoire visuel, son code 2 lettres pour
// les puces JetBrains Mono, son statut de disponibilité, et
// éventuellement les voix TTS + speechLang pour le simulateur.
// Aucun emoji, aucune couleur ad hoc — tout est brass, seul le fond
// change selon le territoire.

export type Territory = "world" | "sources";
export type Scale = "cefr" | "yema";
export type LangStatus = "live" | "next" | "soon";

export interface Language {
  /** Identifiant technique unique (kebab-case ou courant) */
  id: string;
  /** Code 2-4 caractères utilisé dans les puces UI */
  code: string;
  /** Nom en français */
  name: string;
  /** Nom en anglais */
  nameEn: string;
  /** Nom endonyme (dans la langue elle-même) */
  nativeName?: string;
  /** Région ou pays de rattachement principal (FR) */
  region: string;
  regionEn: string;
  /** Territoire visuel */
  territory: Territory;
  /** Échelle utilisée */
  scale: Scale;
  /** Paliers de l'échelle dans l'ordre bas → haut */
  levels: string[];
  /** Cadre pédagogique (CECRL, YEMA, mixte) */
  framework: string;
  /** Statut de disponibilité produit */
  status: LangStatus;
  /** Voix TTS Azure disponibles (optionnel) */
  ttsVoices?: { female: string; male: string };
  /** BCP-47 pour le SpeechRecognition (optionnel) */
  speechLang?: string;
  /** Petite note éditoriale, une phrase max */
  note?: string;
  noteEn?: string;
}

const CEFR: string[] = ["A1", "A2", "B1", "B2", "C1"];
const YEMA_SCALE: string[] = ["É1", "É2", "É3", "É4", "É5"];

// ─── Langues du monde · territoire WORLD · échelle CECRL ─────────────
export const FOREIGN: Language[] = [
  {
    id: "deutsch",
    code: "DE",
    name: "Allemand",
    nameEn: "German",
    nativeName: "Deutsch",
    region: "Allemagne · Autriche · Suisse",
    regionEn: "Germany · Austria · Switzerland",
    territory: "world",
    scale: "cefr",
    levels: CEFR,
    framework: "CECRL",
    status: "live",
    ttsVoices: { female: "de-DE-KatjaNeural", male: "de-DE-ConradNeural" },
    speechLang: "de-DE",
    note: "Premier chapitre YEMA · disponible depuis 2026",
    noteEn: "First YEMA chapter · available since 2026",
  },
  {
    id: "anglais",
    code: "EN",
    name: "Anglais",
    nameEn: "English",
    nativeName: "English",
    region: "International",
    regionEn: "International",
    territory: "world",
    scale: "cefr",
    levels: [...CEFR, "C2"],
    framework: "CECRL + Cambridge",
    status: "next",
    ttsVoices: { female: "en-US-JennyNeural", male: "en-US-GuyNeural" },
    speechLang: "en-US",
    note: "Chapitre suivant · liste d'attente ouverte",
    noteEn: "Next chapter · waitlist open",
  },
  {
    id: "francais",
    code: "FR",
    name: "Français",
    nameEn: "French",
    nativeName: "Français",
    region: "Francophonie",
    regionEn: "Francophone world",
    territory: "world",
    scale: "cefr",
    levels: [...CEFR, "C2"],
    framework: "CECRL + Alliance Française",
    status: "next",
    ttsVoices: { female: "fr-FR-DeniseNeural", male: "fr-FR-HenriNeural" },
    speechLang: "fr-FR",
    note: "Chapitre suivant",
    noteEn: "Next chapter",
  },
  {
    id: "espagnol",
    code: "ES",
    name: "Espagnol",
    nameEn: "Spanish",
    nativeName: "Español",
    region: "Amérique · Europe",
    regionEn: "Americas · Europe",
    territory: "world",
    scale: "cefr",
    levels: CEFR,
    framework: "CECRL + Instituto Cervantes",
    status: "soon",
    ttsVoices: { female: "es-ES-ElviraNeural", male: "es-ES-AlvaroNeural" },
    speechLang: "es-ES",
  },
  {
    id: "portugais",
    code: "PT",
    name: "Portugais",
    nameEn: "Portuguese",
    nativeName: "Português",
    region: "Europe · Amérique",
    regionEn: "Europe · Americas",
    territory: "world",
    scale: "cefr",
    levels: CEFR,
    framework: "CECRL",
    status: "soon",
    speechLang: "pt-BR",
  },
  {
    id: "arabe",
    code: "AR",
    name: "Arabe",
    nameEn: "Arabic",
    nativeName: "العربية",
    region: "Afrique du Nord · Golfe",
    regionEn: "North Africa · Gulf",
    territory: "world",
    scale: "cefr",
    levels: CEFR,
    framework: "CECRL",
    status: "soon",
    speechLang: "ar-SA",
  },
  {
    id: "chinois",
    code: "ZH",
    name: "Chinois",
    nameEn: "Chinese",
    nativeName: "中文",
    region: "Chine · Diaspora",
    regionEn: "China · Diaspora",
    territory: "world",
    scale: "cefr",
    levels: CEFR,
    framework: "CECRL + HSK",
    status: "soon",
    speechLang: "zh-CN",
  },
];

// ─── Langues africaines · territoire SOURCES · échelle YEMA ──────
// Ordre priorisé par la diaspora YEMA à qui nous avons parlé.
export const NATIVE: Language[] = [
  {
    id: "bassa",
    code: "BS",
    name: "Bassa",
    nameEn: "Bassa",
    nativeName: "Ɓàsàa",
    region: "Cameroun",
    regionEn: "Cameroon",
    territory: "sources",
    scale: "yema",
    levels: YEMA_SCALE,
    framework: "Échelle YEMA",
    status: "next",
    note: "Priorité pays d'origine YEMA",
    noteEn: "Home country priority",
  },
  {
    id: "wolof",
    code: "WO",
    name: "Wolof",
    nameEn: "Wolof",
    nativeName: "Wolof",
    region: "Sénégal · Gambie · Mauritanie",
    regionEn: "Senegal · Gambia · Mauritania",
    territory: "sources",
    scale: "yema",
    levels: YEMA_SCALE,
    framework: "Échelle YEMA",
    status: "soon",
  },
  {
    id: "swahili",
    code: "SW",
    name: "Swahili",
    nameEn: "Swahili",
    nativeName: "Kiswahili",
    region: "Afrique de l'Est",
    regionEn: "East Africa",
    territory: "sources",
    scale: "yema",
    levels: YEMA_SCALE,
    framework: "Échelle YEMA",
    status: "soon",
    note: "150 M de locuteurs",
    noteEn: "150M speakers",
  },
  {
    id: "lingala",
    code: "LN",
    name: "Lingala",
    nameEn: "Lingala",
    nativeName: "Lingála",
    region: "RD Congo · Congo",
    regionEn: "DRC · Congo",
    territory: "sources",
    scale: "yema",
    levels: YEMA_SCALE,
    framework: "Échelle YEMA",
    status: "soon",
  },
  {
    id: "douala",
    code: "DL",
    name: "Douala",
    nameEn: "Douala",
    nativeName: "Duálá",
    region: "Cameroun côtier",
    regionEn: "Coastal Cameroon",
    territory: "sources",
    scale: "yema",
    levels: YEMA_SCALE,
    framework: "Échelle YEMA",
    status: "soon",
  },
  {
    id: "ewondo",
    code: "EW",
    name: "Ewondo",
    nameEn: "Ewondo",
    nativeName: "Ewondo",
    region: "Cameroun central",
    regionEn: "Central Cameroon",
    territory: "sources",
    scale: "yema",
    levels: YEMA_SCALE,
    framework: "Échelle YEMA",
    status: "soon",
  },
  {
    id: "fulfulde",
    code: "FL",
    name: "Fulfulde",
    nameEn: "Fulfulde",
    nativeName: "Fulfulde",
    region: "Sahel",
    regionEn: "Sahel",
    territory: "sources",
    scale: "yema",
    levels: YEMA_SCALE,
    framework: "Échelle YEMA",
    status: "soon",
  },
  {
    id: "yoruba",
    code: "YO",
    name: "Yorùbá",
    nameEn: "Yoruba",
    nativeName: "Yorùbá",
    region: "Nigeria · Bénin · Togo",
    regionEn: "Nigeria · Benin · Togo",
    territory: "sources",
    scale: "yema",
    levels: YEMA_SCALE,
    framework: "Échelle YEMA",
    status: "soon",
  },
];

export const ALL_LANGUAGES: Language[] = [...FOREIGN, ...NATIVE];

/** Map id → Language pour lookup rapide. */
export const LANGUAGES: Record<string, Language> = Object.fromEntries(
  ALL_LANGUAGES.map((l) => [l.id, l]),
);

/** Langues disponibles maintenant (status === "live"). */
export const AVAILABLE_LANGUAGES = ALL_LANGUAGES.filter((l) => l.status === "live");

/** Langues à venir (chapitre suivant ou plus tard). */
export const COMING_SOON = ALL_LANGUAGES.filter((l) => l.status !== "live");

/** Recherche par id, fallback deutsch (langue de base). */
export function getLanguage(id: string | undefined | null): Language {
  if (!id) return LANGUAGES.deutsch;
  return LANGUAGES[id] ?? LANGUAGES.deutsch;
}

/** Legacy alias — l'ancien registre exportait sous ce nom. */
export type LanguageId = keyof typeof LANGUAGES;
