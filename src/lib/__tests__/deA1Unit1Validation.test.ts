import { describe, expect, it } from "vitest";
import { DE_A1_COURSE } from "@/data/courses/registry";
import { buildA1CourseList, nextIncompleteModule } from "@/lib/monde";
import { decideLessonProgress, evaluateLessonAttempt, getLessonPassScore } from "@/lib/course-content/validation";

const unitOne = DE_A1_COURSE.units[0];

describe("German A1 unit 1 validation flow", () => {
  it("completes normal lessons after every activity is attempted without requiring 100 percent", () => {
    const lesson = unitOne.lessons[0];
    const decision = decideLessonProgress(lesson, {
      attemptedCount: lesson.exercises.length,
      correctCount: lesson.exercises.length - 1,
    });

    expect(decision.score).toBe(67);
    expect(decision.readyToSubmit).toBe(true);
    expect(decision.passed).toBe(true);
    expect(decision.status).toBe("COMPLETED");
    expect(decision.xpAwarded).toBe(20);
  });

  it("requires every activity to be attempted before a result can be submitted", () => {
    const lesson = unitOne.lessons[1];
    const attempt = evaluateLessonAttempt(lesson, lesson.exercises.length - 1, lesson.exercises.length - 1);

    expect(attempt.countsValid).toBe(true);
    expect(attempt.readyToSubmit).toBe(false);
    expect(attempt.passed).toBe(false);
  });

  it("applies the supplied 70 percent rule only to the final validation lesson", () => {
    const finalLesson = unitOne.lessons[5];
    expect(getLessonPassScore(finalLesson)).toBe(70);
    expect(unitOne.lessons.slice(0, 5).every((lesson) => getLessonPassScore(lesson) === 0)).toBe(true);

    const failed = decideLessonProgress(finalLesson, { attemptedCount: 3, correctCount: 2 });
    expect(failed.score).toBe(67);
    expect(failed.passed).toBe(false);
    expect(failed.reviewRecommended).toBe(true);
    expect(failed.status).toBe("IN_PROGRESS");
    expect(failed.xpAwarded).toBe(0);

    const passed = decideLessonProgress(
      finalLesson,
      { attemptedCount: 3, correctCount: 3 },
      { status: "IN_PROGRESS", score: failed.persistedScore },
    );
    expect(passed.score).toBe(100);
    expect(passed.passed).toBe(true);
    expect(passed.status).toBe("COMPLETED");
    expect(passed.firstCompletion).toBe(true);
    expect(passed.xpAwarded).toBe(40);
  });

  it("runs the complete unit 1 sequence, unlocks unit 2 and awards XP only once", () => {
    const progress: Array<{ moduleId: string; status: "IN_PROGRESS" | "COMPLETED" }> = [];
    let xpAwarded = 0;

    for (const lesson of unitOne.lessons.slice(0, 5)) {
      expect(nextIncompleteModule(progress)?.moduleId).toBe(lesson.id);
      const decision = decideLessonProgress(lesson, {
        attemptedCount: lesson.exercises.length,
        correctCount: Math.max(0, lesson.exercises.length - 1),
      });
      expect(decision.status).toBe("COMPLETED");
      xpAwarded += decision.xpAwarded;
      progress.push({ moduleId: lesson.id, status: decision.status });
    }

    const finalLesson = unitOne.lessons[5];
    expect(nextIncompleteModule(progress)?.moduleId).toBe(finalLesson.id);

    const failedFinal = decideLessonProgress(finalLesson, { attemptedCount: 3, correctCount: 2 });
    progress.push({ moduleId: finalLesson.id, status: failedFinal.status });
    expect(buildA1CourseList(progress)[0]?.status).not.toBe("COMPLETED");
    expect(nextIncompleteModule(progress)?.moduleId).toBe(finalLesson.id);
    expect(failedFinal.xpAwarded).toBe(0);

    const passedFinal = decideLessonProgress(
      finalLesson,
      { attemptedCount: 3, correctCount: 3 },
      { status: failedFinal.status, score: failedFinal.persistedScore },
    );
    progress[progress.length - 1] = { moduleId: finalLesson.id, status: passedFinal.status };
    xpAwarded += passedFinal.xpAwarded;

    const courseList = buildA1CourseList(progress);
    expect(courseList[0]?.status).toBe("COMPLETED");
    expect(courseList[1]?.status).toBe("OPEN");
    expect(nextIncompleteModule(progress)?.moduleId).toBe("de-a1-u2-l1");
    expect(xpAwarded).toBe(140);

    const duplicateSubmission = decideLessonProgress(
      finalLesson,
      { attemptedCount: 3, correctCount: 3 },
      { status: "COMPLETED", score: passedFinal.persistedScore },
    );
    expect(duplicateSubmission.firstCompletion).toBe(false);
    expect(duplicateSubmission.xpAwarded).toBe(0);
  });

  it("rejects impossible activity counts instead of silently accepting them", () => {
    const lesson = unitOne.lessons[0];
    const attempt = evaluateLessonAttempt(lesson, lesson.exercises.length + 1, lesson.exercises.length + 1);

    expect(attempt.countsValid).toBe(false);
    expect(attempt.readyToSubmit).toBe(false);
    expect(attempt.passed).toBe(false);
  });
});
