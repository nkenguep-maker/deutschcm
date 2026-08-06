import { DE_A1_COURSE } from "@/data/courses/registry";
import { buildA1CourseList, nextIncompleteModule, overallProgress } from "@/lib/monde";
import { decideLessonProgress, getLessonPassScore } from "@/lib/course-content/validation";

export type A1AuditCheck = {
  name: string;
  ok: boolean;
  details?: Record<string, unknown>;
};

type AuditProgress = {
  moduleId: string;
  status: "IN_PROGRESS" | "COMPLETED";
};

function check(name: string, condition: boolean, details?: Record<string, unknown>): A1AuditCheck {
  return { name, ok: condition, ...(details ? { details } : {}) };
}

function setProgress(progress: AuditProgress[], moduleId: string, status: AuditProgress["status"]) {
  const existing = progress.find((item) => item.moduleId === moduleId);
  if (existing) {
    existing.status = status;
    return;
  }
  progress.push({ moduleId, status });
}

function failingCorrectCount(totalCount: number, passScore: number): number {
  if (totalCount <= 0) return 0;
  const minimumPassingCorrect = Math.ceil((passScore / 100) * totalCount);
  return Math.max(0, minimumPassingCorrect - 1);
}

export function runA1ValidationAudit() {
  const checks: A1AuditCheck[] = [];
  const progress: AuditProgress[] = [];
  let xpAwarded = 0;

  const expectedXp = DE_A1_COURSE.units
    .flatMap((unit) => unit.lessons)
    .reduce((sum, lesson) => sum + lesson.xp, 0);

  checks.push(check("course-has-six-units", DE_A1_COURSE.units.length === 6, {
    unitCount: DE_A1_COURSE.units.length,
  }));
  checks.push(check(
    "course-has-thirty-six-lessons",
    DE_A1_COURSE.units.every((unit) => unit.lessons.length === 6),
    { lessonCount: DE_A1_COURSE.units.reduce((sum, unit) => sum + unit.lessons.length, 0) },
  ));

  for (const [unitIndex, unit] of DE_A1_COURSE.units.entries()) {
    const listBefore = buildA1CourseList(progress);
    checks.push(check(`unit-${unit.order}-open-in-sequence`, listBefore[unitIndex]?.status === "OPEN", {
      status: listBefore[unitIndex]?.status,
    }));

    for (const lesson of unit.lessons.slice(0, -1)) {
      const expectedNext = nextIncompleteModule(progress)?.moduleId ?? null;
      checks.push(check(`next-${lesson.id}`, expectedNext === lesson.id, { expectedNext }));

      const correctCount = Math.max(0, lesson.exercises.length - 1);
      const decision = decideLessonProgress(lesson, {
        attemptedCount: lesson.exercises.length,
        correctCount,
      });
      checks.push(check(
        `normal-${lesson.id}-completes-after-all-attempted`,
        decision.readyToSubmit && decision.passed && decision.status === "COMPLETED",
        { score: decision.score, status: decision.status },
      ));
      checks.push(check(`normal-${lesson.id}-has-no-pass-threshold`, getLessonPassScore(lesson) === 0, {
        passScore: getLessonPassScore(lesson),
      }));

      xpAwarded += decision.xpAwarded;
      setProgress(progress, lesson.id, decision.status);
    }

    const finalLesson = unit.lessons.at(-1);
    if (!finalLesson) {
      checks.push(check(`unit-${unit.order}-has-final`, false));
      continue;
    }

    const passScore = getLessonPassScore(finalLesson);
    checks.push(check(`unit-${unit.order}-final-pass-score-70`, passScore === 70, { passScore }));
    checks.push(check(
      `unit-${unit.order}-final-is-next`,
      nextIncompleteModule(progress)?.moduleId === finalLesson.id,
      { nextModuleId: nextIncompleteModule(progress)?.moduleId ?? null },
    ));

    const failed = decideLessonProgress(finalLesson, {
      attemptedCount: finalLesson.exercises.length,
      correctCount: failingCorrectCount(finalLesson.exercises.length, passScore),
    });
    setProgress(progress, finalLesson.id, failed.status);

    checks.push(check(
      `unit-${unit.order}-failed-final-stays-in-progress`,
      failed.score < passScore && failed.status === "IN_PROGRESS" && failed.reviewRecommended && failed.xpAwarded === 0,
      {
        score: failed.score,
        passScore,
        status: failed.status,
        xpAwarded: failed.xpAwarded,
      },
    ));
    checks.push(check(
      `unit-${unit.order}-failed-final-remains-next`,
      nextIncompleteModule(progress)?.moduleId === finalLesson.id,
      { nextModuleId: nextIncompleteModule(progress)?.moduleId ?? null },
    ));

    const passed = decideLessonProgress(
      finalLesson,
      { attemptedCount: finalLesson.exercises.length, correctCount: finalLesson.exercises.length },
      { status: failed.status, score: failed.persistedScore },
    );
    setProgress(progress, finalLesson.id, passed.status);
    xpAwarded += passed.xpAwarded;

    checks.push(check(
      `unit-${unit.order}-final-retry-validates`,
      passed.status === "COMPLETED" && passed.firstCompletion && passed.xpAwarded === finalLesson.xp,
      { status: passed.status, firstCompletion: passed.firstCompletion, xpAwarded: passed.xpAwarded },
    ));

    const duplicate = decideLessonProgress(
      finalLesson,
      { attemptedCount: finalLesson.exercises.length, correctCount: finalLesson.exercises.length },
      { status: "COMPLETED", score: passed.persistedScore },
    );
    checks.push(check(
      `unit-${unit.order}-duplicate-final-awards-no-xp`,
      !duplicate.firstCompletion && duplicate.xpAwarded === 0,
      { firstCompletion: duplicate.firstCompletion, xpAwarded: duplicate.xpAwarded },
    ));

    const listAfter = buildA1CourseList(progress);
    checks.push(check(`unit-${unit.order}-completed`, listAfter[unitIndex]?.status === "COMPLETED", {
      status: listAfter[unitIndex]?.status,
    }));

    const nextUnit = DE_A1_COURSE.units[unitIndex + 1];
    if (nextUnit) {
      checks.push(check(
        `unit-${nextUnit.order}-unlocked`,
        listAfter[unitIndex + 1]?.status === "OPEN" && nextIncompleteModule(progress)?.moduleId === nextUnit.lessons[0]?.id,
        {
          status: listAfter[unitIndex + 1]?.status,
          nextModuleId: nextIncompleteModule(progress)?.moduleId ?? null,
        },
      ));
    }
  }

  const finalList = buildA1CourseList(progress);
  checks.push(check("all-a1-units-completed", finalList.every((unit) => unit.status === "COMPLETED"), {
    statuses: finalList.map((unit) => unit.status),
  }));
  checks.push(check("a1-overall-progress-100", overallProgress(finalList) === 100, {
    overallProgress: overallProgress(finalList),
  }));
  checks.push(check("a1-has-no-next-module", nextIncompleteModule(progress) === null, {
    nextModuleId: nextIncompleteModule(progress)?.moduleId ?? null,
  }));
  checks.push(check("a1-xp-total", xpAwarded === expectedXp, { xpAwarded, expectedXp }));

  const failedChecks = checks.filter((item) => !item.ok);
  return {
    ok: failedChecks.length === 0,
    courseId: DE_A1_COURSE.course.id,
    checksPassed: checks.length - failedChecks.length,
    checksTotal: checks.length,
    xpAwarded,
    expectedXp,
    overallProgress: overallProgress(finalList),
    completedUnits: finalList.filter((unit) => unit.status === "COMPLETED").length,
    totalUnits: finalList.length,
    nextModuleId: nextIncompleteModule(progress)?.moduleId ?? null,
    checks,
  };
}
