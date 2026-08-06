import { describe, expect, it } from "vitest";
import { DE_A1_COURSE, DE_A1_COURSE_ID, assertCourseIntegrity, getCourseLessonIds, getNextCourseLesson } from "@/data/courses/registry";
import { buildA1CourseList, nextIncompleteModule, overallProgress } from "@/lib/monde";

describe("German A1 adult Monde course", () => {
  it("keeps the supplied editorial contract intact", () => {
    expect(() => assertCourseIntegrity(DE_A1_COURSE)).not.toThrow();
    expect(DE_A1_COURSE_ID).toBe("monde-adulte-de-a1");
    expect(DE_A1_COURSE.course.framework).toEqual({ type: "CECRL", level: "A1" });
    expect(DE_A1_COURSE.course.signatureSequence).toEqual(["Comprends", "Pratique", "Produis", "Valide"]);
    expect(DE_A1_COURSE.units).toHaveLength(6);
    expect(getCourseLessonIds(DE_A1_COURSE_ID)).toHaveLength(36);
    expect(DE_A1_COURSE.alternativeStates).toHaveLength(8);
  });

  it("contains the six communicative missions in the supplied order", () => {
    expect(DE_A1_COURSE.units.map((unit) => unit.title)).toEqual([
      "Saluer et se présenter",
      "Parler de sa famille",
      "Commander au café",
      "Décrire sa journée",
      "Se déplacer en ville",
      "Faire des achats et organiser une sortie",
    ]);
    expect(DE_A1_COURSE.units.every((unit) => unit.lessons.length === 6)).toBe(true);
    expect(DE_A1_COURSE.units.every((unit) => unit.lessons[0]?.phase === "Comprends")).toBe(true);
    expect(DE_A1_COURSE.units.every((unit) => unit.lessons[4]?.phase === "Produis")).toBe(true);
    expect(DE_A1_COURSE.units.every((unit) => unit.lessons[5]?.phase === "Valide")).toBe(true);
  });

  it("uses stable sequential progress across all 36 lessons", () => {
    const empty = buildA1CourseList([]);
    expect(empty).toHaveLength(6);
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

  it("links every lesson to the next lesson without crossing the wrong order", () => {
    expect(getNextCourseLesson(DE_A1_COURSE_ID, "de-a1-u1-l6")?.lesson.id).toBe("de-a1-u2-l1");
    expect(getNextCourseLesson(DE_A1_COURSE_ID, "de-a1-u6-l6")).toBeNull();
  });

  it("never mixes Racines scale labels into the Monde course", () => {
    const serialized = JSON.stringify(DE_A1_COURSE);
    expect(serialized).not.toMatch(/É[1-5]/);
    expect(serialized).toContain("A1");
    expect(serialized).toContain("A2");
  });
});
