import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { computeMondeAccess } from "@/lib/monde";
import { getCourseContent, getCourseLessonById } from "@/data/courses/registry";
import { decideLessonProgress, type CourseProgressStatus } from "@/lib/course-content/validation";

function error(code: string, message: string, status: number) {
  return NextResponse.json({ ok: false, code, error: message }, { status });
}

function scoreValue(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function countValue(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

export async function POST(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const { courseId } = await params;
    const course = getCourseContent(courseId);
    if (!course) return error("COURSE_NOT_FOUND", "Course not found", 404);

    const payload = await request.json().catch(() => null) as {
      lessonId?: unknown;
      attemptedCount?: unknown;
      correctCount?: unknown;
      score?: unknown;
    } | null;
    const lessonId = typeof payload?.lessonId === "string" ? payload.lessonId : "";
    const resolved = getCourseLessonById(courseId, lessonId);
    if (!resolved) return error("LESSON_NOT_FOUND", "Lesson not found", 404);

    const totalCount = resolved.lesson.exercises.length;
    const legacyScore = scoreValue(payload?.score);
    const attemptedCount = countValue(payload?.attemptedCount) ?? (legacyScore !== null ? totalCount : Number.NaN);
    const correctCount = countValue(payload?.correctCount) ?? (legacyScore !== null
      ? totalCount === 0 ? 0 : Math.round((legacyScore / 100) * totalCount)
      : Number.NaN);

    const preliminary = decideLessonProgress(resolved.lesson, { attemptedCount, correctCount });
    if (!preliminary.countsValid) return error("INVALID_ATTEMPT", "Invalid lesson attempt counts", 400);
    if (!preliminary.readyToSubmit) return error("ATTEMPT_INCOMPLETE", "Complete every activity before submitting the lesson", 422);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return error("UNAUTHORIZED", "Not signed in", 401);

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id }, select: { id: true } });
    if (!dbUser) return error("USER_NOT_FOUND", "User profile missing", 404);

    const learningPath = await prisma.learningPath.findFirst({
      where: { userId: dbUser.id, universe: "MONDE", language: "DEUTSCH", status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (!learningPath) return error("LEARNING_PATH_REQUIRED", "German Monde learning path required", 403);

    const grants = await prisma.accessGrant.findMany({
      where: {
        OR: [
          { beneficiaryType: "USER", beneficiaryId: dbUser.id },
          { beneficiaryType: "LEARNING_PATH", beneficiaryId: learningPath.id },
        ],
      },
      select: { startsAt: true, endsAt: true, status: true, metadata: true },
    });
    if (computeMondeAccess(grants).status !== "ACTIVE") return error("COURSE_ACCESS_REQUIRED", "Active course access required", 403);

    const flatLessons = course.units.flatMap((unit) => unit.lessons);
    const requestedIndex = flatLessons.findIndex((lesson) => lesson.id === lessonId);
    const previousIds = flatLessons.slice(0, requestedIndex).map((lesson) => lesson.id);
    if (previousIds.length > 0) {
      const previousCompleted = await prisma.moduleProgress.count({
        where: { userId: dbUser.id, moduleId: { in: previousIds }, status: "COMPLETED" },
      });
      if (previousCompleted !== previousIds.length) return error("LESSON_LOCKED", "Complete previous lessons first", 409);
    }

    const moduleRecord = await prisma.module.findUnique({ where: { id: lessonId }, select: { id: true } });
    if (!moduleRecord) return error("COURSE_NOT_PROVISIONED", "Course content is not provisioned in the database", 503);

    const existing = await prisma.moduleProgress.findUnique({
      where: { userId_moduleId: { userId: dbUser.id, moduleId: lessonId } },
      select: { status: true, score: true, startedAt: true, completedAt: true },
    });
    const decision = decideLessonProgress(
      resolved.lesson,
      { attemptedCount, correctCount },
      existing ? { status: existing.status as CourseProgressStatus, score: existing.score } : null,
    );
    const now = new Date();
    const completedAt = decision.status === "COMPLETED" ? existing?.completedAt ?? now : null;

    await prisma.$transaction(async (tx) => {
      await tx.moduleProgress.upsert({
        where: { userId_moduleId: { userId: dbUser.id, moduleId: lessonId } },
        create: {
          userId: dbUser.id,
          moduleId: lessonId,
          status: decision.status,
          score: decision.persistedScore,
          startedAt: now,
          completedAt,
        },
        update: {
          status: decision.status,
          score: decision.persistedScore,
          startedAt: existing?.startedAt ?? now,
          completedAt,
        },
      });
      if (decision.xpAwarded > 0) {
        await tx.user.update({ where: { id: dbUser.id }, data: { xpTotal: { increment: decision.xpAwarded } } });
      }
    });

    const completionMessage = decision.completed
      ? resolved.lesson.completionMessage
      : `Tu as obtenu ${decision.score} %. Reprends les points à corriger pour atteindre ${decision.passScore} % et valider cette unité.`;

    return NextResponse.json({
      ok: true,
      courseId,
      lessonId,
      score: decision.score,
      passScore: decision.passScore,
      attemptedCount: decision.attemptedCount,
      correctCount: decision.correctCount,
      totalCount: decision.totalCount,
      status: decision.status,
      completed: decision.completed,
      passed: decision.passed,
      reviewRecommended: decision.reviewRecommended,
      firstCompletion: decision.firstCompletion,
      xpAwarded: decision.xpAwarded,
      completionMessage,
    });
  } catch (cause) {
    console.error("[course-progress] FAIL", cause);
    return error("INTERNAL", "Unable to save course progress", 500);
  }
}
