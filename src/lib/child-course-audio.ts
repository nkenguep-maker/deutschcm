import { getChildCourse, getChildLesson, getChildUnit } from "@/content/child-courses";
import type { ChildExercise } from "@/content/child-courses/types";

export type ChildSpeechTarget = {
  courseId: string;
  unitId: string;
  lessonId: string;
  exerciseId: string;
  languageCode: string;
  languageLabel: string;
  track: "monde" | "racines";
  text: string;
  kind: "scene" | "model";
};

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
    : [];
}

function quotedTarget(prompt: string): string {
  const frenchQuote = prompt.match(/«\s*([^»]+?)\s*»/u)?.[1]?.trim();
  if (frenchQuote) return frenchQuote;
  const straightQuote = prompt.match(/["“]\s*([^"”]+?)\s*["”]/u)?.[1]?.trim();
  return straightQuote ?? "";
}

function pairWords(exercise: ChildExercise): string[] {
  if (!Array.isArray(exercise.pairs)) return [];
  return exercise.pairs
    .map((pair) => {
      if (!pair || typeof pair !== "object" || Array.isArray(pair)) return "";
      return asString((pair as Record<string, unknown>).word) || asString((pair as Record<string, unknown>).target);
    })
    .filter(Boolean);
}

function resolveModelText(exercise: ChildExercise): string {
  const direct = [
    exercise.targetText,
    exercise.target,
    exercise.modelAnswer,
    exercise.childModelAnswer,
    exercise.speakModel,
  ].map(asString).find(Boolean);
  if (direct) return direct;

  const sequence = stringArray(exercise.sequence);
  if (sequence.length) return sequence.join(". ");

  const rounds = stringArray(exercise.rounds);
  if (rounds.length) return rounds.join(". ");

  const pairs = pairWords(exercise);
  if (pairs.length) return pairs.join(". ");

  return quotedTarget(asString(exercise.prompt));
}

export function resolveChildExerciseSpeech(
  courseId: string,
  unitId: string,
  lessonId: string,
  exerciseId: string,
): ChildSpeechTarget | null {
  const course = getChildCourse(courseId);
  const unit = getChildUnit(courseId, unitId);
  const lesson = getChildLesson(courseId, unitId, lessonId);
  if (!course || !unit || !lesson) return null;

  const exercise = lesson.exercises.find((candidate) => candidate.id === exerciseId);
  if (!exercise) return null;

  const audioSceneId = asString(exercise.audioSceneId);
  if (audioSceneId && unit.audioScene?.id === audioSceneId) {
    const text = unit.audioScene.lines.map((line) => asString(line.target)).filter(Boolean).join(". ");
    if (!text) return null;
    return {
      courseId,
      unitId,
      lessonId,
      exerciseId,
      languageCode: course.course.learningLanguage.code,
      languageLabel: course.course.learningLanguage.labelFr,
      track: course.course.track,
      text,
      kind: "scene",
    };
  }

  const text = resolveModelText(exercise);
  if (!text) return null;
  return {
    courseId,
    unitId,
    lessonId,
    exerciseId,
    languageCode: course.course.learningLanguage.code,
    languageLabel: course.course.learningLanguage.labelFr,
    track: course.course.track,
    text,
    kind: "model",
  };
}
