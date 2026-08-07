import { inflateSync } from "node:zlib";
import { CHILD_COURSES_PAYLOAD } from "./payload";
import type { ChildLesson, ChildUnit, YemaChildCourseContent } from "./types";

const EXPECTED_SEQUENCE: Record<"monde" | "racines", string[]> = {
  monde: ["Écoute", "Choisis", "Répète", "Parle"],
  racines: ["Écoute", "Reconnais", "Répète", "Réponds"],
};

function decodePayload(): YemaChildCourseContent[] {
  const json = inflateSync(Buffer.from(CHILD_COURSES_PAYLOAD, "base64")).toString("utf8");
  const parsed = JSON.parse(json) as Record<string, YemaChildCourseContent>;
  return Object.values(parsed);
}

function assertCourse(course: YemaChildCourseContent) {
  if (course.course.persona !== "enfant" || course.course.audience !== "enfant") {
    throw new Error(`${course.course.id}: invalid child persona`);
  }
  if (course.units.length !== 8 || course.course.unitCount !== 8) {
    throw new Error(`${course.course.id}: expected 8 units`);
  }
  if (course.alternativeStates.length !== 8) {
    throw new Error(`${course.course.id}: expected 8 alternative states`);
  }

  const lessons = course.units.flatMap((unit) => unit.lessons);
  const exercises = lessons.flatMap((lesson) => lesson.exercises);
  if (lessons.length !== 32 || course.course.lessonCount !== 32) {
    throw new Error(`${course.course.id}: expected 32 lessons`);
  }
  if (exercises.length !== 96 || course.course.exerciseCount !== 96) {
    throw new Error(`${course.course.id}: expected 96 exercises`);
  }

  const expected = EXPECTED_SEQUENCE[course.course.track];
  for (const unit of course.units) {
    if (unit.lessons.length !== 4) throw new Error(`${unit.id}: expected 4 lessons`);
    const stages = unit.lessons.map((lesson) => lesson.stage);
    if (stages.some((stage, index) => stage !== expected[index])) {
      throw new Error(`${unit.id}: invalid child learning sequence`);
    }
    for (const lesson of unit.lessons) {
      if (lesson.exercises.length !== 3) throw new Error(`${lesson.id}: expected 3 exercises`);
      if (lesson.exercises.some((exercise) => !exercise.prompt?.trim())) {
        throw new Error(`${lesson.id}: every exercise needs a prompt`);
      }
    }
  }
}

const decodedCourses = decodePayload();
for (const course of decodedCourses) assertCourse(course);

export const childCourses = decodedCourses.sort((a, b) => a.course.id.localeCompare(b.course.id));

export function getChildCourse(courseId: string): YemaChildCourseContent | null {
  return childCourses.find((course) => course.course.id === courseId) ?? null;
}

export function getChildUnit(courseId: string, unitId: string): ChildUnit | null {
  return getChildCourse(courseId)?.units.find((unit) => unit.id === unitId) ?? null;
}

export function getChildLesson(courseId: string, unitId: string, lessonId: string): ChildLesson | null {
  return getChildUnit(courseId, unitId)?.lessons.find((lesson) => lesson.id === lessonId) ?? null;
}

export function getNextChildLesson(courseId: string, lessonId: string): { unit: ChildUnit; lesson: ChildLesson } | null {
  const course = getChildCourse(courseId);
  if (!course) return null;
  const flattened = course.units.flatMap((unit) => unit.lessons.map((lesson) => ({ unit, lesson })));
  const index = flattened.findIndex((entry) => entry.lesson.id === lessonId);
  return index >= 0 ? flattened[index + 1] ?? null : null;
}

export type { ChildExercise, ChildLesson, ChildUnit, YemaChildCourseContent } from "./types";
