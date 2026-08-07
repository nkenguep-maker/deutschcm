import { gunzipSync } from "node:zlib";
import medumbaMeta from "./byv/meta.json";
import medumbaU1 from "./byv/u1.json";
import medumbaU2 from "./byv/u2.json";
import medumbaU3 from "./byv/u3.json";
import medumbaU4 from "./byv/u4.json";
import medumbaU5 from "./byv/u5.json";
import medumbaU6 from "./byv/u6.json";
import medumbaU7 from "./byv/u7.json";
import medumbaU8 from "./byv/u8.json";
import { LINGALA_E1_GZIP_BASE64 } from "./ln/encoded";
import {
  RACINES_E1_SEQUENCE,
  type RacinesEditorialGate,
  type RacinesLesson,
  type RacinesUnit,
  type YemaRacinesCourseContent,
} from "./types";

function combineCourse(meta: unknown, units: unknown[]): YemaRacinesCourseContent {
  return { ...(meta as object), units } as unknown as YemaRacinesCourseContent;
}

function decodeCourse(encoded: string): YemaRacinesCourseContent {
  const compressed = Buffer.from(encoded, "base64");
  return JSON.parse(gunzipSync(compressed).toString("utf8")) as YemaRacinesCourseContent;
}

export const medumbaE1 = combineCourse(medumbaMeta, [
  medumbaU1, medumbaU2, medumbaU3, medumbaU4,
  medumbaU5, medumbaU6, medumbaU7, medumbaU8,
]);

// Lingala is kept as the exact uploaded source archive. Decoding happens only
// on the server/build side; learner renderers receive a sanitized course view.
export const lingalaE1 = decodeCourse(LINGALA_E1_GZIP_BASE64);

export const racinesSoloCourses = {
  "racines-solo-byv-e1": medumbaE1,
  "racines-solo-ln-e1": lingalaE1,
} as const;

export type RacinesSoloCourseId = keyof typeof racinesSoloCourses;

export function isRacinesSoloCourseId(value: string): value is RacinesSoloCourseId {
  return Object.prototype.hasOwnProperty.call(racinesSoloCourses, value);
}

export function getRacinesSoloCourse(id: string): YemaRacinesCourseContent | null {
  return isRacinesSoloCourseId(id) ? racinesSoloCourses[id] : null;
}

export function getRacinesUnit(courseId: string, unitId: string): RacinesUnit | null {
  return getRacinesSoloCourse(courseId)?.units.find((unit) => unit.id === unitId) ?? null;
}

export function getRacinesLesson(courseId: string, unitId: string, lessonId: string): RacinesLesson | null {
  return getRacinesUnit(courseId, unitId)?.lessons.find((lesson) => lesson.id === lessonId) ?? null;
}

export function getRacinesLessonById(courseId: string, lessonId: string): { unit: RacinesUnit; lesson: RacinesLesson } | null {
  const course = getRacinesSoloCourse(courseId);
  if (!course) return null;
  for (const unit of course.units) {
    const lesson = unit.lessons.find((candidate) => candidate.id === lessonId);
    if (lesson) return { unit, lesson };
  }
  return null;
}

export function getNextRacinesLesson(courseId: string, lessonId: string): { unit: RacinesUnit; lesson: RacinesLesson } | null {
  const course = getRacinesSoloCourse(courseId);
  if (!course) return null;
  const flat = course.units.flatMap((unit) => unit.lessons.map((lesson) => ({ unit, lesson })));
  const index = flat.findIndex((item) => item.lesson.id === lessonId);
  return index >= 0 ? flat[index + 1] ?? null : null;
}

export function getRacinesLessonIds(courseId: string): string[] {
  const course = getRacinesSoloCourse(courseId);
  return course ? course.units.flatMap((unit) => unit.lessons.map((lesson) => lesson.id)) : [];
}

export function getRacinesEditorialGate(course: YemaRacinesCourseContent): RacinesEditorialGate {
  return course.status.includes("review-required") ? "REVIEW_REQUIRED" : "READY";
}

export function isRacinesCoursePubliclyReady(course: YemaRacinesCourseContent): boolean {
  const audioStatus = typeof course.audioManifest.status === "string" ? course.audioManifest.status : "";
  return getRacinesEditorialGate(course) === "READY" && audioStatus !== "scripts-ready-audio-not-produced";
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[racines-course] ${message}`);
}

export function assertRacinesCourseIntegrity(course: YemaRacinesCourseContent): void {
  assert(course.course.track === "racines", `${course.course.id}: track must be racines`);
  assert(course.course.persona === "solo", `${course.course.id}: persona must be solo`);
  assert(course.course.audience === "adulte", `${course.course.id}: audience must be adulte`);
  assert(course.course.framework.type === "YEMA_RACINES", `${course.course.id}: framework must be YEMA_RACINES`);
  assert(course.course.framework.stage === "É1", `${course.course.id}: stage must be É1`);
  assert(JSON.stringify(course.course.signatureSequence) === JSON.stringify(RACINES_E1_SEQUENCE), `${course.course.id}: invalid signature sequence`);
  assert(course.units.length === 8, `${course.course.id}: expected 8 units`);
  assert(course.alternativeStates.length === 8, `${course.course.id}: expected 8 alternative states`);

  const unitIds = new Set<string>();
  const lessonIds = new Set<string>();
  const exerciseIds = new Set<string>();

  course.units.forEach((unit, unitIndex) => {
    assert(unit.order === unitIndex + 1, `${course.course.id}: unit order mismatch at ${unit.id}`);
    assert(!unitIds.has(unit.id), `${course.course.id}: duplicate unit ${unit.id}`);
    unitIds.add(unit.id);
    assert(unit.lessons.length === 5, `${course.course.id}/${unit.id}: expected 5 lessons`);
    assert(unit.coreAudioScene.lines.length > 0, `${course.course.id}/${unit.id}: audio scene must contain lines`);
    assert(unit.phrases.length >= 3, `${course.course.id}/${unit.id}: expected at least 3 phrases`);

    unit.lessons.forEach((lesson, lessonIndex) => {
      assert(lesson.order === lessonIndex + 1, `${course.course.id}/${lesson.id}: lesson order mismatch`);
      assert(lesson.stage === RACINES_E1_SEQUENCE[lessonIndex], `${course.course.id}/${lesson.id}: unexpected stage ${lesson.stage}`);
      assert(!lessonIds.has(lesson.id), `${course.course.id}: duplicate lesson ${lesson.id}`);
      lessonIds.add(lesson.id);
      assert(lesson.exercises.length === 3, `${course.course.id}/${lesson.id}: expected 3 exercises`);
      lesson.exercises.forEach((exercise) => {
        assert(typeof exercise.prompt === "string" && exercise.prompt.trim().length > 0, `${course.course.id}/${exercise.id}: prompt required`);
        assert(!exerciseIds.has(exercise.id), `${course.course.id}: duplicate exercise ${exercise.id}`);
        exerciseIds.add(exercise.id);
      });

      if (lesson.stage === "Transmets") {
        const validation = lesson.exercises.find((exercise) => exercise.type === "unitValidation");
        assert(validation, `${course.course.id}/${lesson.id}: Transmets requires unitValidation`);
        assert(validation.passingScore === 6, `${course.course.id}/${lesson.id}: unit validation must pass at 6/8`);
        assert(validation.maxScore === 8, `${course.course.id}/${lesson.id}: unit validation max must be 8`);
      }
    });
  });

  assert(lessonIds.size === 40, `${course.course.id}: expected 40 lessons`);
  assert(exerciseIds.size === 120, `${course.course.id}: expected 120 exercises`);
  assert(course.course.unitCount === 8, `${course.course.id}: metadata unitCount mismatch`);
  assert(course.course.lessonCount === 40, `${course.course.id}: metadata lessonCount mismatch`);
  assert(course.course.exerciseCount === 120, `${course.course.id}: metadata exerciseCount mismatch`);
}

assertRacinesCourseIntegrity(medumbaE1);
assertRacinesCourseIntegrity(lingalaE1);

export type { RacinesExercise, RacinesLesson, RacinesUnit, YemaRacinesCourseContent } from "./types";
