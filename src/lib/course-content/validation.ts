import type { CourseLesson } from "@/data/courses/types";

export type CourseProgressStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export type LessonAttemptSummary = {
  totalCount: number;
  attemptedCount: number;
  correctCount: number;
  score: number;
  passScore: number;
  isFinalValidation: boolean;
  countsValid: boolean;
  readyToSubmit: boolean;
  passed: boolean;
  reviewRecommended: boolean;
};

export type LessonProgressDecision = LessonAttemptSummary & {
  status: CourseProgressStatus;
  completed: boolean;
  firstCompletion: boolean;
  persistedScore: number;
  xpAwarded: number;
};

export const DEFAULT_FINAL_PASS_SCORE = 70;

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function configuredPassScore(lesson: CourseLesson): number | null {
  for (const exercise of lesson.exercises) {
    if (typeof exercise.passScore === "number" && Number.isFinite(exercise.passScore)) {
      return clampScore(exercise.passScore);
    }
  }

  for (const block of lesson.blocks) {
    const value = block.passScore;
    if (typeof value === "number" && Number.isFinite(value)) {
      return clampScore(value);
    }
  }

  return null;
}

export function getLessonPassScore(lesson: CourseLesson): number {
  if (lesson.phase !== "Valide") return 0;
  return configuredPassScore(lesson) ?? DEFAULT_FINAL_PASS_SCORE;
}

export function evaluateLessonAttempt(
  lesson: CourseLesson,
  attemptedCount: number,
  correctCount: number,
): LessonAttemptSummary {
  const totalCount = lesson.exercises.length;
  const countsValid =
    Number.isInteger(attemptedCount) &&
    Number.isInteger(correctCount) &&
    attemptedCount >= 0 &&
    attemptedCount <= totalCount &&
    correctCount >= 0 &&
    correctCount <= attemptedCount;

  const safeAttempted = countsValid ? attemptedCount : 0;
  const safeCorrect = countsValid ? correctCount : 0;
  const score = totalCount === 0 ? 100 : clampScore((safeCorrect / totalCount) * 100);
  const isFinalValidation = lesson.phase === "Valide";
  const passScore = getLessonPassScore(lesson);
  const readyToSubmit = countsValid && safeAttempted === totalCount;
  const passed = readyToSubmit && (!isFinalValidation || score >= passScore);

  return {
    totalCount,
    attemptedCount: safeAttempted,
    correctCount: safeCorrect,
    score,
    passScore,
    isFinalValidation,
    countsValid,
    readyToSubmit,
    passed,
    reviewRecommended: readyToSubmit && isFinalValidation && !passed,
  };
}

export function decideLessonProgress(
  lesson: CourseLesson,
  attempt: { attemptedCount: number; correctCount: number },
  existing?: { status: CourseProgressStatus; score: number | null } | null,
): LessonProgressDecision {
  const summary = evaluateLessonAttempt(lesson, attempt.attemptedCount, attempt.correctCount);
  const existingCompleted = existing?.status === "COMPLETED";
  const completed = existingCompleted || summary.passed;
  const firstCompletion = !existingCompleted && summary.passed;
  const persistedScore = existing?.score == null
    ? summary.score
    : Math.max(existing.score, summary.score);

  return {
    ...summary,
    status: completed ? "COMPLETED" : "IN_PROGRESS",
    completed,
    firstCompletion,
    persistedScore,
    xpAwarded: firstCompletion ? lesson.xp : 0,
    reviewRecommended: summary.reviewRecommended && !existingCompleted,
  };
}
