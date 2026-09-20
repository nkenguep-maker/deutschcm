export type RefonteNormalizationRule = "case" | "punct" | "umlaut" | "eszett" | "space";

export type RefonteChoice = {
  id: string;
  text: string;
  correct: boolean;
  feedback: string;
};

export type RefonteNearMiss = {
  pattern: string;
  accept: boolean;
  note: string;
};

export type RefonteExercise = {
  id: string;
  type: string;
  objectiveId: string;
  cardIds?: string[];
  promptLang: "de" | "fr" | "bi";
  prompt: string;
  audioRef?: string;
  choices?: RefonteChoice[];
  tokens?: string[];
  answer?: string | string[];
  acceptedAnswers?: string[];
  normalization?: RefonteNormalizationRule[];
  nearMisses?: RefonteNearMiss[];
  remediationRef?: string;
  feedbackIncorrect?: string;
  targets?: Array<{ id: string; de: string; audioRef?: string; maxSeconds?: number }>;
  scoring?: { engine: string; mode: string; metric: string; passThreshold: number };
  note?: string;
  minimumWords?: number;
  successCriteria?: string[];
  autoCheck?: string[];
};

export type RefonteCard = {
  id: string;
  kind: "lexical" | "structure" | "chunk";
  de: string;
  fr: string;
  audioRef?: string;
  introducedIn: string;
  srs: { intervals: number[] };
};

export type RefonteObjective = {
  id: string;
  label: string;
};

export type RefonteRemediation = {
  id: string;
  objectiveId: string;
  durationSeconds: number;
  explanation: string;
  contrast: Array<{ de: string; fr: string; ok: boolean; why?: string }>;
  items: RefonteExercise[];
};

export type RefonteLesson = {
  id: string;
  order: number;
  phase: "Comprends" | "Pratique" | "Produis" | "Valide";
  title: string;
  objectiveIds: string[];
  durationMinutes: number;
  reveil: {
    cardIds: string[];
    note?: string;
    itemCount?: number;
    maxSeconds?: number;
    selection?: string;
  };
  blocks: Array<Record<string, unknown> & { id: string; type: string }>;
  exercises: RefonteExercise[];
  completionMessage: string;
};

export type GermanA1RefonteUnit = {
  schemaVersion: string;
  contentVersion: string;
  status: string;
  note: string;
  cards: RefonteCard[];
  objectives: RefonteObjective[];
  remediations: RefonteRemediation[];
  lessons: RefonteLesson[];
  qualityGates: {
    exerciseMix: {
      recognitionMax: number;
      productiveWrittenMin: number;
      structureMin: number;
      oralMin: number;
    };
    promptLang: { deMin: number; note: string };
    spacedRecall: { minCardsRevisitedPerLesson: number };
    feedback: { distinctPerDistractor: boolean };
    normalization: { requiredOn: string[] };
  };
};
