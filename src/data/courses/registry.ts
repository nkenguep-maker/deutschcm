import deA1Meta from "@/data/courses/monde/adulte/de-a1/meta.json";
import deA1Unit1 from "@/data/courses/monde/adulte/de-a1/u1.json";
import deA1Unit2 from "@/data/courses/monde/adulte/de-a1/u2.json";
import deA1Unit3 from "@/data/courses/monde/adulte/de-a1/u3.json";
import deA1Unit4 from "@/data/courses/monde/adulte/de-a1/u4.json";
import deA1Unit5 from "@/data/courses/monde/adulte/de-a1/u5.json";
import deA1Unit6 from "@/data/courses/monde/adulte/de-a1/u6.json";
import type { CourseContent, CourseLesson, CourseUnit } from "@/data/courses/types";
import { assertPathwayPersonalizationIntegrity } from "@/lib/course-content/pathway";

const deA1 = {
  ...deA1Meta,
  units: [deA1Unit1, deA1Unit2, deA1Unit3, deA1Unit4, deA1Unit5, deA1Unit6],
} as unknown as CourseContent;

const COURSE_REGISTRY: Record<string, CourseContent> = {
  [deA1.course.id]: deA1,
};

export const DE_A1_COURSE_ID = deA1.course.id;
export const DE_A1_COURSE = deA1;

export function getCourseContent(courseId: string): CourseContent | null {
  return COURSE_REGISTRY[courseId] ?? null;
}

export function getCourseUnit(courseId: string, unitId: string): CourseUnit | null {
  return getCourseContent(courseId)?.units.find((unit) => unit.id === unitId) ?? null;
}

export function getCourseLesson(courseId: string, unitId: string, lessonId: string): CourseLesson | null {
  return getCourseUnit(courseId, unitId)?.lessons.find((lesson) => lesson.id === lessonId) ?? null;
}

export function getCourseLessonIds(courseId: string): string[] {
  return getCourseContent(courseId)?.units.flatMap((unit) => unit.lessons.map((lesson) => lesson.id)) ?? [];
}

export function getCourseLessonById(courseId: string, lessonId: string): { unit: CourseUnit; lesson: CourseLesson } | null {
  const course = getCourseContent(courseId);
  if (!course) return null;
  for (const unit of course.units) {
    const lesson = unit.lessons.find((item) => item.id === lessonId);
    if (lesson) return { unit, lesson };
  }
  return null;
}

export function getNextCourseLesson(courseId: string, lessonId: string): { unit: CourseUnit; lesson: CourseLesson } | null {
  const course = getCourseContent(courseId);
  if (!course) return null;
  const flat = course.units.flatMap((unit) => unit.lessons.map((lesson) => ({ unit, lesson })));
  const index = flat.findIndex((item) => item.lesson.id === lessonId);
  return index >= 0 ? flat[index + 1] ?? null : null;
}

export function assertCourseIntegrity(course: CourseContent): void {
  const units = [...course.units].sort((a, b) => a.order - b.order);
  const lessonIds = units.flatMap((unit) => unit.lessons.map((lesson) => lesson.id));
  if (units.length !== course.course.unitCount) throw new Error(`COURSE_UNIT_COUNT_MISMATCH:${course.course.id}`);
  if (lessonIds.length !== course.course.lessonCount) throw new Error(`COURSE_LESSON_COUNT_MISMATCH:${course.course.id}`);
  if (new Set(lessonIds).size !== lessonIds.length) throw new Error(`COURSE_DUPLICATE_LESSON_ID:${course.course.id}`);
  for (const unit of units) {
    if (unit.lessons.length !== 6) throw new Error(`COURSE_UNIT_LESSON_COUNT:${unit.id}`);
    for (const lesson of unit.lessons) {
      if (lesson.exercises.length === 0) throw new Error(`COURSE_EMPTY_LESSON:${lesson.id}`);
    }
  }
  assertPathwayPersonalizationIntegrity(course);
}

assertCourseIntegrity(deA1);
