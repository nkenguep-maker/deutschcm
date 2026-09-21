import { describe, expect, it } from "vitest";
import { A1_V2_SYLLABUS } from "@/content/monde-a1-v2";
import { DE_A1_COURSE, DE_A1_COURSE_ID, assertCourseIntegrity, getCourseLessonIds, getNextCourseLesson } from "@/data/courses/registry";
import { buildA1CourseList, nextIncompleteModule, overallProgress } from "@/lib/monde";

describe("German A1 adult Monde course", () => {
  it("uses refonte v2 as the real platform source while keeping the public id stable", () => {
    expect(() => assertCourseIntegrity(DE_A1_COURSE)).not.toThrow();
    expect(DE_A1_COURSE_ID).toBe("monde-adulte-de-a1");
    expect(DE_A1_COURSE.course.framework).toEqual({ type: "CECRL", level: "A1" });
    expect(DE_A1_COURSE.course.signatureSequence).toEqual(["Comprends", "Pratique", "Produis", "Valide"]);
    expect(DE_A1_COURSE.units).toHaveLength(12);
    expect(getCourseLessonIds(DE_A1_COURSE_ID)).toHaveLength(60);
    expect(DE_A1_COURSE.alternativeStates).toHaveLength(8);
    expect(DE_A1_COURSE.contentVersion).toBe("2026.09.21-a1-v2-platform-r1");
    expect(DE_A1_COURSE.status).toBe("refonte-integration");
    expect(DE_A1_COURSE.units.flatMap((unit) => unit.lessons.flatMap((lesson) => lesson.exercises))).toHaveLength(300);
  });

  it("contains the twelve canonical missions in syllabus order", () => {
    expect(DE_A1_COURSE.units.map((unit) => unit.title)).toEqual(A1_V2_SYLLABUS.map((unit) => unit.title));
    expect(DE_A1_COURSE.units.every((unit) => unit.lessons.length === 5)).toBe(true);
    expect(DE_A1_COURSE.units.every((unit) => unit.lessons[0]?.phase === "Comprends")).toBe(true);
    expect(DE_A1_COURSE.units.every((unit) => unit.lessons[3]?.phase === "Produis")).toBe(true);
    expect(DE_A1_COURSE.units.every((unit) => unit.lessons[4]?.phase === "Valide")).toBe(true);
  });

  it("uses stable sequential progress across all 60 lessons", () => {
    const empty = buildA1CourseList([]);
    expect(empty).toHaveLength(12);
    expect(empty[0]?.status).toBe("OPEN");
    expect(empty.slice(1).every((unit) => unit.status === "LOCKED")).toBe(true);
    expect(nextIncompleteModule([])?.moduleId).toBe("de-a1-u1-l1");
    expect(overallProgress(empty)).toBe(0);

    const firstUnitDone = DE_A1_COURSE.units[0].lessons.map((lesson) => ({ moduleId: lesson.id, status: "COMPLETED" as const }));
    const afterUnitOne = buildA1CourseList(firstUnitDone);
    expect(afterUnitOne[0]?.status).toBe("COMPLETED");
    expect(afterUnitOne[1]?.status).toBe("OPEN");
    expect(nextIncompleteModule(firstUnitDone)?.moduleId).toBe("de-a1-u2-l1");
  });

  it("keeps every platform exercise answerable or human-reviewable", () => {
    const exercises = DE_A1_COURSE.units.flatMap((unit) => unit.lessons.flatMap((lesson) => lesson.exercises));
    for (const exercise of exercises) {
      const hasAnswer =
        exercise.answer !== undefined ||
        (exercise.acceptedAnswers?.length ?? 0) > 0 ||
        (exercise.successCriteria?.length ?? 0) > 0 ||
        Boolean(exercise.rubricRef);
      expect(hasAnswer, exercise.id).toBe(true);
    }
  });

  it("links lessons across the twelve-unit sequence", () => {
    expect(getNextCourseLesson(DE_A1_COURSE_ID, "de-a1-u1-l5")?.lesson.id).toBe("de-a1-u2-l1");
    expect(getNextCourseLesson(DE_A1_COURSE_ID, "de-a1-u12-l5")).toBeNull();
  });

  it("never mixes Racines scale labels into the Monde course", () => {
    const serialized = JSON.stringify(DE_A1_COURSE);
    expect(serialized).not.toMatch(/É[1-5]/);
    expect(serialized).toContain("A1");
    expect(serialized).toContain("A2");
  });
});
