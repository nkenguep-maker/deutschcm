import unit1Reference from "./u1.reference.json";
import unit2Reference from "./u2.reference.json";
import unit3Reference from "./u3.reference.json";
import unit4Reference from "./u4.reference.json";
import unit5Reference from "./u5.reference.json";
import unit6Reference from "./u6.reference.json";
import unit7Reference from "./u7.reference.json";
import type { A1RefonteManifest, A1UnitReference } from "./types";
export { A1_V2_SYLLABUS, A1_V2_SYLLABUS_TOTALS } from "./syllabus";

export const MONDE_A1_V2_COURSE_ID = "monde-solo-de-a1" as const;

export const MONDE_A1_V2_MANIFEST: A1RefonteManifest = {
  courseId: MONDE_A1_V2_COURSE_ID,
  schemaVersion: "2.0",
  status: "REFONTE_IN_PROGRESS",
  target: {
    units: 12,
    lessons: 60,
    exercises: 180,
    guidedHoursMin: 35,
    guidedHoursMax: 40,
    lexicalItemsMin: 450,
    lexicalItemsMax: 600,
  },
  integratedUnits: ["de-a1-u1", "de-a1-u2", "de-a1-u3", "de-a1-u4", "de-a1-u5", "de-a1-u6", "de-a1-u7"],
  readiness: {
    fullLevelIntegrated: false,
    criticalNativeAudioReady: false,
    mockExamsReady: false,
  },
};

export const A1_V2_UNIT_1 = unit1Reference as A1UnitReference;
export const A1_V2_UNIT_2 = unit2Reference as A1UnitReference;
export const A1_V2_UNIT_3 = unit3Reference as A1UnitReference;
export const A1_V2_UNIT_4 = unit4Reference as A1UnitReference;
export const A1_V2_UNIT_5 = unit5Reference as A1UnitReference;
export const A1_V2_UNIT_6 = unit6Reference as A1UnitReference;
export const A1_V2_UNIT_7 = unit7Reference as A1UnitReference;
export const A1_V2_UNITS: A1UnitReference[] = [A1_V2_UNIT_1, A1_V2_UNIT_2, A1_V2_UNIT_3, A1_V2_UNIT_4, A1_V2_UNIT_5, A1_V2_UNIT_6, A1_V2_UNIT_7];

export function getA1V2Unit(unitId: string) {
  return A1_V2_UNITS.find((unit) => unit.id === unitId) ?? null;
}

export function getA1V2LessonContext(lessonId: string) {
  for (const unit of A1_V2_UNITS) {
    const lesson = unit.lessons.find((item) => item.id === lessonId);
    if (lesson) return { unit, lesson };
  }
  return null;
}

export function getA1V2Lesson(lessonId: string) {
  return getA1V2LessonContext(lessonId)?.lesson ?? null;
}

export function getA1V2Exercise(exerciseId: string) {
  for (const unit of A1_V2_UNITS) {
    for (const lesson of unit.lessons) {
      const exercise = lesson.exercises.find((item) => item.id === exerciseId);
      if (exercise) return { unit, lesson, exercise };
    }
  }
  return null;
}

export function getA1V2Card(cardId: string) {
  for (const unit of A1_V2_UNITS) {
    const card = unit.cards.find((item) => item.id === cardId);
    if (card) return card;
  }
  return null;
}

export function getA1V2Remediation(remediationId: string) {
  for (const unit of A1_V2_UNITS) {
    const remediation = unit.remediations.find((item) => item.id === remediationId);
    if (remediation) return remediation;
  }
  return null;
}

export function getA1V2CardsAvailableForLesson(lessonId: string) {
  const context = getA1V2LessonContext(lessonId);
  if (!context) return [];
  return A1_V2_UNITS
    .filter((unit) => unit.order <= context.unit.order)
    .flatMap((unit) => unit.cards);
}
