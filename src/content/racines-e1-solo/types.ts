export type YemaRacinesStage = "Écoute" | "Imite" | "Réponds" | "Raconte" | "Transmets";

export const RACINES_E1_SEQUENCE: readonly YemaRacinesStage[] = [
  "Écoute",
  "Imite",
  "Réponds",
  "Raconte",
  "Transmets",
] as const;

export type EvidenceStatus =
  | "attested"
  | "attested-pattern-personalized"
  | "attested-or-original-combination"
  | "original-list-from-attested-lexemes"
  | "constructed-from-attested-pattern"
  | string;

export type RacinesPhrase = {
  target: string;
  fr: string;
  pronunciationGuide: string;
  sourceRef?: string;
  evidenceStatus?: EvidenceStatus;
  usageNote?: string;
  standardVariant?: string;
};

export type RacinesDialogueLine = {
  speaker: string;
  target: string;
  fr: string;
  sourceRef?: string;
  evidenceStatus?: EvidenceStatus;
  note?: string;
};

export type RacinesAudioScene = {
  id: string;
  title: string;
  context: string;
  lines: RacinesDialogueLine[];
};

export type RacinesExercise = {
  id: string;
  type: string;
  prompt: string;
  [key: string]: unknown;
};

export type RacinesLesson = {
  id: string;
  order: number;
  stage: YemaRacinesStage;
  title: string;
  objective: string;
  durationMinutes: number;
  xp: number;
  primaryCta: string;
  blocks: Array<Record<string, unknown>>;
  exercises: RacinesExercise[];
  completionMessage: string;
};

export type RacinesUnit = {
  id: string;
  order: number;
  title: string;
  shortTitle: string;
  oralObjective: string;
  canDo: string;
  relationshipContext: string;
  situation: string;
  estimatedMinutes: number;
  skills: string[];
  finalOralMission: string;
  transmissionPrompt: string;
  hero: Record<string, string>;
  sourceAlignment: Record<string, unknown>;
  coreAudioScene: RacinesAudioScene;
  phrases: RacinesPhrase[];
  listeningFocus: string[];
  pronunciation: Record<string, string>;
  culture: Record<string, string>;
  lessons: RacinesLesson[];
  [key: string]: unknown;
};

export type RacinesCourseDescriptor = {
  id: string;
  track: "racines";
  persona: "solo";
  audience: "adulte";
  learningMode: "solo";
  learningLanguage: {
    code: string;
    labelFr: string;
    labelNative: string;
  };
  interfaceLanguage: string;
  framework: {
    type: "YEMA_RACINES";
    stage: "É1";
    stageName: string;
    principle: string;
  };
  title: string;
  shortTitle: string;
  subtitle: string;
  description: string;
  signatureSequence: YemaRacinesStage[];
  primaryCta: string;
  estimatedTotalMinutes: number;
  estimatedIndependentPracticeMinutes: number;
  estimatedWeeks: number;
  unitCount: number;
  lessonCount: number;
  exerciseCount: number;
  completionRule: string;
  courseHero: Record<string, string>;
  dashboardStrings: Record<string, string>;
  levelOutcomes: string[];
  soloExperience: Record<string, unknown>;
  editorialReview: string[];
};

export type YemaRacinesCourseContent = {
  schemaVersion: string;
  contentVersion: string;
  status: string;
  course: RacinesCourseDescriptor;
  globalUiTexts: Record<string, string>;
  units: RacinesUnit[];
  levelReview: Record<string, unknown>;
  alternativeStates: Array<Record<string, unknown>>;
  audioManifest: Record<string, unknown>;
  sourceManifest: Record<string, unknown>;
  editorialNotes: Record<string, unknown>;
};

export type RacinesEditorialGate = "REVIEW_REQUIRED" | "READY";
