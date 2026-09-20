import unit1Reference from "./u1.reference.json";
import type { A1RefonteManifest, A1UnitReference } from "./types";

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
  integratedUnits: ["de-a1-u1"],
  readiness: {
    fullLevelIntegrated: false,
    criticalNativeAudioReady: false,
    mockExamsReady: false,
  },
};

export const A1_V2_UNIT_1 = unit1Reference as A1UnitReference;

export function getA1V2Lesson(lessonId: string) {
  return A1_V2_UNIT_1.lessons.find((lesson) => lesson.id === lessonId) ?? null;
}

export function getA1V2Exercise(exerciseId: string) {
  for (const lesson of A1_V2_UNIT_1.lessons) {
    const exercise = lesson.exercises.find((item) => item.id === exerciseId);
    if (exercise) return { lesson, exercise };
  }
  return null;
}

export function getA1V2Card(cardId: string) {
  return A1_V2_UNIT_1.cards.find((card) => card.id === cardId) ?? null;
}

export function getA1V2Remediation(remediationId: string) {
  return A1_V2_UNIT_1.remediations.find((item) => item.id === remediationId) ?? null;
}
