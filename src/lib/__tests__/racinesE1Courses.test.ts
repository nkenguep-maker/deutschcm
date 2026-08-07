import { describe, expect, it } from "vitest";
import {
  RACINES_E1_SEQUENCE,
} from "@/content/racines-e1-solo/types";
import {
  assertRacinesCourseIntegrity,
  getRacinesEditorialGate,
  getRacinesLessonIds,
  isRacinesCoursePubliclyReady,
  lingalaE1,
  medumbaE1,
} from "@/content/racines-e1-solo";

const courses = [medumbaE1, lingalaE1];

describe("Racines adult solo E1 pilot courses", () => {
  it("keeps both uploaded course contracts intact", () => {
    expect(() => assertRacinesCourseIntegrity(medumbaE1)).not.toThrow();
    expect(() => assertRacinesCourseIntegrity(lingalaE1)).not.toThrow();
    expect(medumbaE1.course.id).toBe("racines-solo-byv-e1");
    expect(lingalaE1.course.id).toBe("racines-solo-ln-e1");
  });

  it.each(courses.map((course) => [course.course.id, course] as const))(
    "%s contains 8 missions, 40 lessons and 120 exercises",
    (_id, course) => {
      expect(course.units).toHaveLength(8);
      expect(getRacinesLessonIds(course.course.id)).toHaveLength(40);
      expect(course.units.flatMap((unit) => unit.lessons.flatMap((lesson) => lesson.exercises))).toHaveLength(120);
      expect(course.alternativeStates).toHaveLength(8);
    },
  );

  it("uses the Racines E1 sequence in every mission, never the Monde CEFR sequence", () => {
    for (const course of courses) {
      expect(course.course.framework).toMatchObject({ type: "YEMA_RACINES", stage: "É1" });
      expect(course.course.signatureSequence).toEqual(RACINES_E1_SEQUENCE);
      for (const unit of course.units) {
        expect(unit.lessons.map((lesson) => lesson.stage)).toEqual(RACINES_E1_SEQUENCE);
      }
    }
  });

  it("requires 6/8 for every oral mission validation", () => {
    for (const course of courses) {
      for (const unit of course.units) {
        const transmits = unit.lessons.find((lesson) => lesson.stage === "Transmets");
        const validation = transmits?.exercises.find((exercise) => exercise.type === "unitValidation");
        expect(validation?.passingScore).toBe(6);
        expect(validation?.maxScore).toBe(8);
      }
    }
  });

  it("keeps both courses behind editorial and native-audio gates", () => {
    expect(getRacinesEditorialGate(medumbaE1)).toBe("REVIEW_REQUIRED");
    expect(getRacinesEditorialGate(lingalaE1)).toBe("REVIEW_REQUIRED");
    expect(medumbaE1.audioManifest.status).toBe("scripts-ready-audio-not-produced");
    expect(lingalaE1.audioManifest.status).toBe("scripts-ready-audio-not-produced");
    expect(isRacinesCoursePubliclyReady(medumbaE1)).toBe(false);
    expect(isRacinesCoursePubliclyReady(lingalaE1)).toBe(false);
  });

  it("preserves the Medumba native-review warning and does not invent one for Lingala", () => {
    expect(JSON.stringify(medumbaE1)).toContain("constructed-from-attested-pattern");
    expect(JSON.stringify(lingalaE1)).not.toContain("constructed-from-attested-pattern");
  });
});
