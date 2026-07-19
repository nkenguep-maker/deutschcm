// Échelles enfants · Sprint « Famille » — natales ET étrangères.
//
// NATALES · échelle YEMA É1 → É5 (Écoute · Voix · Récit · Palabre ·
// Foyer). Réutilisée depuis le foyer adulte pour la cohérence, mais
// côté enfant les libellés restent doux et illustrés — jamais
// techniques.
//
// ÉTRANGÈRES · échelle DOUCE non-certifiante M1 → M4. Aucune
// référence CECRL (A1/A2/B1/…), aucun examen, aucune attestation.
// Paliers imagés qui décrivent ce que l'enfant SAIT FAIRE :
//   M1 · Premiers mots        · reconnaît un mot, le répète
//   M2 · Petites phrases      · assemble deux ou trois mots
//   M3 · Petites histoires    · comprend un conte simple
//   M4 · On se raconte        · dit ce qu'il a fait, ce qu'il aime
//
// Les enfants ne voient PAS ces codes. Ils voient l'illustration et
// le libellé. Le parent voit le nom du palier dans /famille.

export type ChildLangueType = "native" | "foreign";

export interface ChildLangue {
  langue: string;             // id du registre languages (bassa, deutsch…)
  type: ChildLangueType;
  echelle: string;            // clé du palier · natale "E1..E5" · étrangère "M1..M4"
  etoiles: number;            // douces, jamais un score
  motsAppris: string[];       // mots réels appris, preuve de transmission
}

export const NATAL_STEPS = ["E1", "E2", "E3", "E4", "E5"] as const;
export type NatalStep = (typeof NATAL_STEPS)[number];

export const FOREIGN_STEPS = ["M1", "M2", "M3", "M4"] as const;
export type ForeignStep = (typeof FOREIGN_STEPS)[number];

export const NATAL_LABEL_FR: Record<NatalStep, string> = {
  E1: "Écoute",
  E2: "Voix",
  E3: "Récit",
  E4: "Palabre",
  E5: "Foyer",
};
export const NATAL_LABEL_EN: Record<NatalStep, string> = {
  E1: "Listen",
  E2: "Voice",
  E3: "Tale",
  E4: "Talk",
  E5: "Home",
};

export const FOREIGN_LABEL_FR: Record<ForeignStep, string> = {
  M1: "Premiers mots",
  M2: "Petites phrases",
  M3: "Petites histoires",
  M4: "On se raconte",
};
export const FOREIGN_LABEL_EN: Record<ForeignStep, string> = {
  M1: "First words",
  M2: "Little sentences",
  M3: "Little stories",
  M4: "We tell stories",
};

export function stepLabel(langue: ChildLangue, locale: "fr" | "en"): string {
  if (langue.type === "native") {
    const key = (NATAL_STEPS as readonly string[]).includes(langue.echelle)
      ? (langue.echelle as NatalStep)
      : "E1";
    return locale === "en" ? NATAL_LABEL_EN[key] : NATAL_LABEL_FR[key];
  }
  const key = (FOREIGN_STEPS as readonly string[]).includes(langue.echelle)
    ? (langue.echelle as ForeignStep)
    : "M1";
  return locale === "en" ? FOREIGN_LABEL_EN[key] : FOREIGN_LABEL_FR[key];
}

export function initialStep(type: ChildLangueType): string {
  return type === "native" ? "E1" : "M1";
}
