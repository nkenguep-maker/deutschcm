export type A1PromptLang = "de" | "fr" | "bi";
export type A1NormalizationRule = "case" | "punct" | "umlaut" | "eszett" | "space";
export type A1CardKind = "lexical" | "structure" | "chunk";

export type A1Card = {
  id: string;
  kind: A1CardKind;
  de: string;
  fr: string;
  audioRef?: string;
  introducedIn: string;
  srs: { intervals: [number, number, number, number] };
};

export type A1Objective = {
  id: string;
  label: string;
};

export type A1Choice = {
  id: string;
  text: string;
  correct: boolean;
  feedback: string;
};

export type A1NearMiss = {
  pattern: string;
  accept: boolean;
  note: string;
};

export type A1Exercise = {
  id: string;
  type: string;
  objectiveId?: string;
  cardIds?: string[];
  promptLang: A1PromptLang;
  prompt: string;
  audioRef?: string;
  choices?: A1Choice[];
  tokens?: string[];
  answer?: string | string[];
  acceptedAnswers?: string[];
  normalization?: A1NormalizationRule[];
  nearMisses?: A1NearMiss[];
  remediationRef?: string;
  feedbackIncorrect?: string;
  minimumWords?: number;
  successCriteria?: string[];
  autoCheck?: string[];
  targets?: Array<{ id: string; de: string; audioRef: string; maxSeconds: number }>;
  scoring?: {
    engine: string;
    mode: string;
    metric: string;
    passThreshold: number;
  };
  note?: string;
};

export type A1Block = {
  id: string;
  type: string;
  title?: string;
  text?: string;
  textDe?: string;
  textFr?: string;
  dialogueId?: string;
  speeds?: string[];
  instruction?: string;
};

export type A1WakeConfig = {
  cardIds: string[];
  note?: string;
  itemCount?: number;
  maxSeconds?: number;
  selection?: string;
};

export type A1LessonV2 = {
  id: string;
  order: number;
  phase: "Comprends" | "Pratique" | "Produis" | "Valide";
  title: string;
  objectiveIds: string[];
  durationMinutes: number;
  reveil: A1WakeConfig;
  blocks: A1Block[];
  exercises: A1Exercise[];
  completionMessage: string;
};

export type A1RemediationItem = {
  id: string;
  type: string;
  promptLang: A1PromptLang;
  prompt: string;
  tokens?: string[];
  answer?: string | string[];
  acceptedAnswers?: string[];
  normalization?: A1NormalizationRule[];
};

export type A1Remediation = {
  id: string;
  objectiveId: string;
  durationSeconds: number;
  explanation: string;
  contrast: Array<{ de: string; fr: string; ok: boolean; why?: string }>;
  items: A1RemediationItem[];
};

export type A1UnitReference = {
  schemaVersion: "2.0";
  contentVersion: string;
  status: string;
  note: string;
  cards: A1Card[];
  objectives: A1Objective[];
  remediations: A1Remediation[];
  lessons: A1LessonV2[];
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

export type A1RefonteManifest = {
  courseId: "monde-solo-de-a1";
  schemaVersion: "2.0";
  status: "REFONTE_IN_PROGRESS" | "READY";
  target: {
    units: 12;
    lessons: 60;
    exercises: 180;
    guidedHoursMin: number;
    guidedHoursMax: number;
    lexicalItemsMin: number;
    lexicalItemsMax: number;
  };
  integratedUnits: string[];
};
