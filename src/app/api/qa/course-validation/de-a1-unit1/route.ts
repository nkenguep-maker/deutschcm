import { NextResponse } from "next/server";
import { DE_A1_COURSE } from "@/data/courses/registry";
import { buildA1CourseList, nextIncompleteModule } from "@/lib/monde";
import { decideLessonProgress, evaluateLessonAttempt, getLessonPassScore } from "@/lib/course-content/validation";

export const dynamic = "force-dynamic";

function check(name: string, condition: boolean, details?: Record<string, unknown>) {
  return { name, ok: condition, ...(details ? { details } : {}) };
}

export async function GET() {
  if (process.env.VERCEL_ENV === "production") {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }

  const unit = DE_A1_COURSE.units[0];
  const progress: Array<{ moduleId: string; status: "IN_PROGRESS" | "COMPLETED" }> = [];
  const checks: Array<ReturnType<typeof check>> = [];
  let xpAwarded = 0;

  const incompleteAttempt = evaluateLessonAttempt(unit.lessons[0], 2, 2);
  checks.push(check("incomplete-attempt-blocked", !incompleteAttempt.readyToSubmit && !incompleteAttempt.passed, {
    attemptedCount: incompleteAttempt.attemptedCount,
    totalCount: incompleteAttempt.totalCount,
  }));

  for (const lesson of unit.lessons.slice(0, 5)) {
    const expectedNext = nextIncompleteModule(progress)?.moduleId;
    checks.push(check(`next-${lesson.id}`, expectedNext === lesson.id, { expectedNext, lessonId: lesson.id }));

    const decision = decideLessonProgress(lesson, {
      attemptedCount: lesson.exercises.length,
      correctCount: Math.max(0, lesson.exercises.length - 1),
    });
    checks.push(check(`complete-${lesson.id}-without-100`, decision.status === "COMPLETED" && decision.passed, {
      score: decision.score,
      status: decision.status,
    }));
    xpAwarded += decision.xpAwarded;
    progress.push({ moduleId: lesson.id, status: decision.status });
  }

  const finalLesson = unit.lessons[5];
  checks.push(check("final-pass-score-is-70", getLessonPassScore(finalLesson) === 70, {
    passScore: getLessonPassScore(finalLesson),
  }));
  checks.push(check("final-is-next-before-attempt", nextIncompleteModule(progress)?.moduleId === finalLesson.id));

  const failed = decideLessonProgress(finalLesson, { attemptedCount: 3, correctCount: 2 });
  progress.push({ moduleId: finalLesson.id, status: failed.status });
  checks.push(check("final-67-percent-remains-in-progress", failed.score === 67 && failed.status === "IN_PROGRESS" && failed.reviewRecommended && failed.xpAwarded === 0, {
    score: failed.score,
    status: failed.status,
    reviewRecommended: failed.reviewRecommended,
    xpAwarded: failed.xpAwarded,
  }));
  checks.push(check("unit-stays-open-after-failed-final", buildA1CourseList(progress)[0]?.status !== "COMPLETED"));
  checks.push(check("failed-final-remains-next", nextIncompleteModule(progress)?.moduleId === finalLesson.id));

  const passed = decideLessonProgress(
    finalLesson,
    { attemptedCount: 3, correctCount: 3 },
    { status: failed.status, score: failed.persistedScore },
  );
  progress[progress.length - 1] = { moduleId: finalLesson.id, status: passed.status };
  xpAwarded += passed.xpAwarded;

  const courseList = buildA1CourseList(progress);
  checks.push(check("final-retry-validates-unit", passed.status === "COMPLETED" && passed.firstCompletion && passed.xpAwarded === 40, {
    status: passed.status,
    firstCompletion: passed.firstCompletion,
    xpAwarded: passed.xpAwarded,
  }));
  checks.push(check("unit-1-completed", courseList[0]?.status === "COMPLETED", { status: courseList[0]?.status }));
  checks.push(check("unit-2-unlocked", courseList[1]?.status === "OPEN" && nextIncompleteModule(progress)?.moduleId === "de-a1-u2-l1", {
    unit2Status: courseList[1]?.status,
    nextModuleId: nextIncompleteModule(progress)?.moduleId,
  }));
  checks.push(check("unit-1-xp-total", xpAwarded === 140, { xpAwarded }));

  const duplicate = decideLessonProgress(
    finalLesson,
    { attemptedCount: 3, correctCount: 3 },
    { status: "COMPLETED", score: passed.persistedScore },
  );
  checks.push(check("duplicate-completion-awards-no-xp", !duplicate.firstCompletion && duplicate.xpAwarded === 0, {
    firstCompletion: duplicate.firstCompletion,
    xpAwarded: duplicate.xpAwarded,
  }));

  const invalidCounts = evaluateLessonAttempt(unit.lessons[0], 4, 4);
  checks.push(check("invalid-counts-rejected", !invalidCounts.countsValid && !invalidCounts.readyToSubmit));

  const failedChecks = checks.filter((item) => !item.ok);
  return NextResponse.json({
    ok: failedChecks.length === 0,
    courseId: DE_A1_COURSE.course.id,
    unitId: unit.id,
    checksPassed: checks.length - failedChecks.length,
    checksTotal: checks.length,
    xpAwarded,
    nextModuleId: nextIncompleteModule(progress)?.moduleId ?? null,
    checks,
  }, { status: failedChecks.length === 0 ? 200 : 500 });
}
