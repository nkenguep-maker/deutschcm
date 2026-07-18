// Échelle YEMA · framework pédagogique pour les langues natales africaines.
//
// Conçue à partir de trois sources :
//   1. ACTFL Proficiency Guidelines 2024 (Novice/Intermediate/Advanced/
//      Superior/Distinguished) — cadre standard dans les universités US
//      pour Wolof, Swahili, Zoulou, etc.
//   2. Peace Corps Language Proficiency Interview — focus oral functional.
//   3. AOTS Framework (African Oral Traditional Storytelling) + ELAN-Afrique
//      (OIF/AFD, 2010) — approche communautaire, immersion, storytelling,
//      proverbes, palabres comme marqueurs.
//
// Cinq paliers, chacun ancré dans un moment de vie observable où la langue
// se pratique naturellement. Nom éditorial (voix YEMA), can-do statements
// concrets (3 par niveau), et équivalence ACTFL discrète pour crédibilité
// professionnelle. Approche oral-first, écriture introduite au É3.

export type YemaLevelId = "E1" | "E2" | "E3" | "E4" | "E5";

export interface YemaLevel {
  id: YemaLevelId;
  /** Notation courte affichée dans les puces (É1…É5) */
  code: string;
  /** Nom éditorial FR (mot unique, poétique mais concret) */
  name: string;
  /** Nom éditorial EN */
  nameEn: string;
  /** Une phrase — l'ancre culturelle, le moment de vie */
  anchor: string;
  anchorEn: string;
  /** Équivalence ACTFL (pour recruteurs, universités) */
  actfl: string;
  /** 3 can-do statements concrets (verbes d'action) — FR */
  canDo: readonly string[];
  /** 3 can-do statements concrets — EN */
  canDoEn: readonly string[];
  /** Modalités travaillées à ce palier (oral/écrit) */
  modalities: string;
  modalitiesEn: string;
}

export const YEMA_LEVELS: readonly YemaLevel[] = [
  {
    id: "E1",
    code: "É1",
    name: "Écoute",
    nameEn: "Listen",
    anchor: "La salutation du matin. Tu entres dans la langue par l'oreille.",
    anchorEn: "The morning greeting. You enter the language through the ear.",
    actfl: "ACTFL Novice Mid",
    canDo: [
      "Reconnaître les salutations et formules de politesse",
      "Comprendre les nombres, les jours, les moments de la journée",
      "Répondre à ton prénom, ton âge, ton origine",
    ],
    canDoEn: [
      "Recognize greetings and courtesy formulas",
      "Understand numbers, days, times of day",
      "Respond about your name, age, origin",
    ],
    modalities: "Oral · écoute + réponse courte",
    modalitiesEn: "Oral · listening + short reply",
  },
  {
    id: "E2",
    code: "É2",
    name: "Voix",
    nameEn: "Voice",
    anchor: "Le marché du dimanche. Tu échanges, tu négocies, tu demandes ton chemin.",
    anchorEn: "The Sunday market. You trade, you negotiate, you ask directions.",
    actfl: "ACTFL Novice High → Intermediate Low",
    canDo: [
      "Nommer ta famille, ta maison, ce que tu manges",
      "Demander un prix, une direction, un rendez-vous",
      "Décrire ta journée en phrases courtes",
    ],
    canDoEn: [
      "Name your family, your home, what you eat",
      "Ask a price, a direction, an appointment",
      "Describe your day in short sentences",
    ],
    modalities: "Oral · phrases produites · lecture de mots familiers",
    modalitiesEn: "Oral · produced sentences · reading familiar words",
  },
  {
    id: "E3",
    code: "É3",
    name: "Récit",
    nameEn: "Story",
    anchor: "Le conte du soir. Tu racontes, tu écoutes, tu suis le fil.",
    anchorEn: "The evening tale. You tell, you listen, you follow the thread.",
    actfl: "ACTFL Intermediate Mid → High",
    canDo: [
      "Raconter un souvenir, un voyage, un événement vécu",
      "Comprendre un conte court, une chanson, une radio locale",
      "Exprimer une préférence et la justifier simplement",
    ],
    canDoEn: [
      "Tell a memory, a trip, a lived event",
      "Understand a short tale, a song, a local radio show",
      "Express a preference and justify it simply",
    ],
    modalities: "Oral suivi · écrit court · lecture d'un texte court",
    modalitiesEn: "Sustained oral · short writing · reading a short text",
  },
  {
    id: "E4",
    code: "É4",
    name: "Palabre",
    nameEn: "Palaver",
    anchor: "L'arbre à palabres. Tu débats, tu nuances, tu prends position.",
    anchorEn: "The palaver tree. You debate, you nuance, you take a stand.",
    actfl: "ACTFL Advanced Low → Mid",
    canDo: [
      "Argumenter en réunion familiale ou communautaire",
      "Comprendre un débat, une émission d'analyse",
      "Écrire une lettre, un message développé, un compte rendu",
    ],
    canDoEn: [
      "Argue in a family or community meeting",
      "Understand a debate, an analytical broadcast",
      "Write a letter, a developed message, a report",
    ],
    modalities: "Discours étendu · lecture longue · écrit argumenté",
    modalitiesEn: "Extended discourse · long-form reading · argued writing",
  },
  {
    id: "E5",
    code: "É5",
    name: "Foyer",
    nameEn: "Home",
    anchor: "Le foyer familial. Tu parles comme chez toi — humour, proverbes, silences.",
    anchorEn: "The family hearth. You speak as at home — humor, proverbs, silences.",
    actfl: "ACTFL Advanced High → Superior",
    canDo: [
      "Manier les proverbes, jouer avec les registres, comprendre l'implicite",
      "Basculer avec fluidité entre la langue natale et le français",
      "Transmettre — enseigner, raconter à un enfant, animer une assemblée",
    ],
    canDoEn: [
      "Wield proverbs, play with registers, catch the unspoken",
      "Code-switch fluidly between the native language and French",
      "Pass on — teach, tell a child, host an assembly",
    ],
    modalities: "Toute modalité · maîtrise culturelle",
    modalitiesEn: "All modalities · cultural mastery",
  },
] as const;

/** Ordre bas → haut des codes courts ("É1"…"É5") — utile pour les UI. */
export const YEMA_CODES: readonly string[] = YEMA_LEVELS.map((l) => l.code);

/** Lookup par code court. */
export function getYemaLevel(code: string): YemaLevel | undefined {
  return YEMA_LEVELS.find((l) => l.code === code);
}

/** Ordre lexicographique (index). */
export function yemaLevelIndex(code: string): number {
  return YEMA_LEVELS.findIndex((l) => l.code === code);
}
