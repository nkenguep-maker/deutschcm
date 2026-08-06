export type LearningPhase = "Comprends" | "Pratique" | "Produis" | "Valide";

export type CourseBlock = {
  type: string;
  title?: string;
  text?: string;
  textDe?: string;
  textFr?: string;
  instruction?: string;
  [key: string]: unknown;
};

export type CourseExercise = {
  id: string;
  type: string;
  prompt: string;
  choices?: string[];
  tokens?: string[];
  answer?: string | string[];
  acceptedAnswers?: string[];
  hint?: string;
  feedbackCorrect?: string;
  feedbackIncorrect?: string;
  minimumWords?: number;
  minimumSeconds?: number;
  maximumSeconds?: number;
  successCriteria?: string[];
  passScore?: number;
  rubricRef?: string;
};

export type CourseLesson = {
  id: string;
  order: number;
  phase: LearningPhase;
  title: string;
  objective: string;
  durationMinutes: number;
  xp: number;
  primaryCta: string;
  blocks: CourseBlock[];
  exercises: CourseExercise[];
  completionMessage: string;
};

export type CourseUnit = {
  id: string;
  order: number;
  title: string;
  shortTitle: string;
  communicativeObjective: string;
  canDo: string;
  situation: string;
  estimatedMinutes: number;
  skills: string[];
  finalMission: string;
  hero: { eyebrow: string; title: string; description: string };
  coreDialogue: {
    id: string;
    title: string;
    context: string;
    audioScript: Array<{ speaker: string; de: string; fr: string }>;
  };
  vocabulary: Array<{ de: string; fr: string; exampleDe: string; exampleFr: string }>;
  grammar: Array<{
    title: string;
    explanation: string;
    formula?: string;
    examples: Array<{ de: string; fr: string }>;
  }>;
  pronunciation: { focus: string; tips: string[]; drills: string[] };
  culture: { title: string; text: string };
  lessons: CourseLesson[];
};

export type CourseMeta = {
  schemaVersion: string;
  contentVersion: string;
  status: string;
  course: {
    id: string;
    track: "monde" | "racines";
    persona: "adulte" | "enfant";
    learningLanguage: { code: string; labelFr: string; labelNative: string };
    interfaceLanguage: string;
    framework: { type: string; level: string };
    title: string;
    shortTitle: string;
    subtitle: string;
    description: string;
    signatureSequence: LearningPhase[];
    primaryCta: string;
    estimatedTotalMinutes: number;
    estimatedWeeks: number;
    unitCount: number;
    lessonCount: number;
    completionRule: string;
    courseHero: {
      eyebrow: string;
      title: string;
      description: string;
      progressLabel: string;
      continueLabel: string;
    };
    dashboardStrings: Record<string, string>;
    levelOutcomes: string[];
  };
  globalUiTexts: Record<string, string>;
  levelReview: {
    title: string;
    description: string;
    sections: Array<{ title: string; prompts: string[] }>;
    finalChecklist: string[];
  };
  alternativeStates: Array<{ id: string; title: string; message: string; cta: string | null }>;
  editorialNotes: Record<string, unknown>;
};

export type CourseContent = CourseMeta & { units: CourseUnit[] };

export type CourseProgressRecord = {
  moduleId: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  score: number | null;
  completedAt: string | Date | null;
};
