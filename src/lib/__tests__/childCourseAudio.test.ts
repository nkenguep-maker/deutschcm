import { describe, expect, it } from "vitest";
import { childCourses } from "@/content/child-courses";
import { resolveChildExerciseSpeech } from "@/lib/child-course-audio";

describe("YEMA child listening audio", () => {
  it("resolves the listening scene in every unit of all three child courses", () => {
    for (const course of childCourses) {
      for (const unit of course.units) {
        const listeningLesson = unit.lessons[0];
        const listeningExercise = listeningLesson.exercises[0];
        const target = resolveChildExerciseSpeech(
          course.course.id,
          unit.id,
          listeningLesson.id,
          listeningExercise.id,
        );

        expect(target, `${course.course.id}/${unit.id}`).not.toBeNull();
        expect(target?.kind).toBe("scene");
        expect(target?.text.length).toBeGreaterThan(2);
        expect(target?.text).toContain(unit.audioScene.lines[0].target);
        expect(target?.languageCode).toBe(course.course.learningLanguage.code);
      }
    }
  });

  it("resolves a model sound beyond the scene for every child course", () => {
    for (const course of childCourses) {
      const unit = course.units[0];
      const candidates = unit.lessons.slice(1).flatMap((lesson) =>
        lesson.exercises.map((exercise) => ({ lesson, exercise })),
      );
      const target = candidates
        .map(({ lesson, exercise }) => resolveChildExerciseSpeech(course.course.id, unit.id, lesson.id, exercise.id))
        .find(Boolean);

      expect(target, course.course.id).toBeTruthy();
      expect(target?.text.length).toBeGreaterThan(0);
    }
  });

  it("never resolves arbitrary IDs outside the course registry", () => {
    expect(resolveChildExerciseSpeech("unknown", "u", "l", "e")).toBeNull();
  });
});
