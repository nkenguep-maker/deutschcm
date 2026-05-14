export interface VocabItem {
  de: string;
  fr: string;
  example: string;
}

export interface GrammarRow {
  pronoun: string;
  form: string;
  example: string;
}

export interface GrammarSection {
  title: string;
  explanation: string;
  conjugation?: GrammarRow[];
  examples: string[];
}

export interface ExampleSentence {
  de: string;
  fr: string;
}

export interface LessonContent {
  introduction: string;
  grammar: GrammarSection;
  vocabulary: VocabItem[];
  sentences: ExampleSentence[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface QuizContent {
  questions: QuizQuestion[];
}

export type ModuleType = "lesson" | "quiz" | "conversation";

export interface CourseModule {
  id: string;
  courseId: string;
  type: ModuleType;
  title: string;
  description: string;
  xp: number;
  duration: number;
  lessonContent?: LessonContent;
  quizContent?: QuizContent;
  conversationScenario?: string;
}
