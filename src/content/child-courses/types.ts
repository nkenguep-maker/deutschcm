export type ChildExercise = {
  id: string;
  type: string;
  prompt: string;
  [key: string]: unknown;
};

export type ChildLesson = {
  id: string;
  order: number;
  stage: string;
  title: string;
  objective: string;
  durationMinutes: number;
  xp: number;
  primaryCta: string;
  blocks: Array<Record<string, unknown>>;
  exercises: ChildExercise[];
  completionMessage: string;
  [key: string]: unknown;
};

export type ChildAudioLine = {
  speaker: string;
  target: string;
  fr: string;
  [key: string]: unknown;
};

export type ChildAudioScene = {
  id: string;
  title: string;
  context: string;
  lines: ChildAudioLine[];
};

export type ChildUnit = {
  id: string;
  order: number;
  title: string;
  mission: string;
  objective: string;
  estimatedMinutes: number;
  audioScene: ChildAudioScene;
  lessons: ChildLesson[];
  [key: string]: unknown;
};

export type ChildCourseDescriptor = {
  id: string;
  track: "monde" | "racines";
  persona: "enfant";
  audience: "enfant";
  ageRange: string;
  learningLanguage: {
    code: string;
    labelFr: string;
    labelNative: string;
  };
  interfaceLanguage: string;
  framework: Record<string, unknown>;
  title: string;
  shortTitle: string;
  subtitle: string;
  description: string;
  signatureSequence: string[];
  primaryCta: string;
  unitCount: number;
  lessonCount: number;
  exerciseCount: number;
  estimatedTotalMinutes: number;
  pedagogy: Record<string, unknown>;
  courseHero: Record<string, unknown>;
  [key: string]: unknown;
};

export type YemaChildCourseContent = {
  schemaVersion: string;
  contentVersion: string;
  status: string;
  course: ChildCourseDescriptor;
  globalUiTexts: Record<string, string>;
  units: ChildUnit[];
  levelReview?: Record<string, unknown>;
  alternativeStates: Array<Record<string, unknown>>;
  audioManifest?: Record<string, unknown>;
  sourceManifest?: Record<string, unknown>;
  editorialNotes?: Record<string, unknown>;
  [key: string]: unknown;
};
