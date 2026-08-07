import { describe, expect, it } from "vitest";
import { childCourses, getChildCourse, getNextChildLesson } from "@/content/child-courses";

const expected = {
  "monde-child-de-a1": ["Écoute", "Choisis", "Répète", "Parle"],
  "racines-child-byv-e1": ["Écoute", "Reconnais", "Répète", "Réponds"],
  "racines-child-ln-e1": ["Écoute", "Reconnais", "Répète", "Réponds"],
} as const;

describe("YEMA child production test courses", () => {
  it("loads the three uploaded child courses", () => {
    expect(childCourses.map((course) => course.course.id).sort()).toEqual(Object.keys(expected).sort());
  });

  it.each(Object.entries(expected))("%s keeps 8 units, 32 lessons and 96 exercises", (courseId, sequence) => {
    const course = getChildCourse(courseId);
    expect(course).not.toBeNull();
    expect(course?.units).toHaveLength(8);
    const lessons = course?.units.flatMap((unit) => unit.lessons) ?? [];
    expect(lessons).toHaveLength(32);
    expect(lessons.flatMap((lesson) => lesson.exercises)).toHaveLength(96);
    expect(course?.alternativeStates).toHaveLength(8);
    expect(course?.course.signatureSequence).toEqual(sequence);
    for (const unit of course?.units ?? []) {
      expect(unit.lessons).toHaveLength(4);
      expect(unit.lessons.map((lesson) => lesson.stage)).toEqual(sequence);
      for (const lesson of unit.lessons) expect(lesson.exercises).toHaveLength(3);
    }
  });

  it("keeps the source editorial statuses visible instead of pretending native review is complete", () => {
    expect(getChildCourse("monde-child-de-a1")?.status).toBe("editorial-ready-native-audio-review-required");
    expect(getChildCourse("racines-child-byv-e1")?.status).toBe("editorial-draft-native-review-required");
    expect(getChildCourse("racines-child-ln-e1")?.status).toBe("editorial-ready-lingalaphone-review-required");
  });

  it("preserves 480 XP per complete child course", () => {
    for (const course of childCourses) {
      expect(course.units.flatMap((unit) => unit.lessons).reduce((sum, lesson) => sum + lesson.xp, 0)).toBe(480);
    }
  });

  it("resolves progression across unit boundaries", () => {
    const course = getChildCourse("monde-child-de-a1");
    expect(course).not.toBeNull();
    const lastLessonUnit1 = course!.units[0].lessons[3];
    const next = getNextChildLesson(course!.course.id, lastLessonUnit1.id);
    expect(next?.unit.id).toBe(course!.units[1].id);
    expect(next?.lesson.id).toBe(course!.units[1].lessons[0].id);
  });
});
