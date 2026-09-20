import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  MONDE_A1_V2_COURSE_ID,
  getA1V2Card,
  isA1V2PublicReady,
  getA1V2Exercise,
  getA1V2Remediation,
} from "@/content/monde-a1-v2";
import { evaluateA1Exercise } from "@/lib/course-content/a1-v2/evaluation";
import {
  nextCardMemory,
  shouldTriggerRemediation,
  type A1MemoryRow,
} from "@/lib/course-content/a1-v2/memory";
import { isSameOriginRequest } from "@/lib/security/requestOrigin";

function error(code: string, message: string, status: number) {
  return NextResponse.json({ ok: false, code, error: message }, { status });
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return error("ORIGIN_FORBIDDEN", "Cross-origin mutation refused", 403);
  if (process.env.VERCEL_ENV === "production" && !isA1V2PublicReady()) {
    return error("COURSE_NOT_READY", "A1 refonte is not public yet", 404);
  }

  const payload = await request.json().catch(() => null) as {
    exerciseId?: unknown;
    response?: unknown;
  } | null;
  const exerciseId = typeof payload?.exerciseId === "string" ? payload.exerciseId : "";
  const response = typeof payload?.response === "string" || Array.isArray(payload?.response)
    ? payload.response as string | string[]
    : null;
  if (!exerciseId || response === null) return error("INVALID_PAYLOAD", "exerciseId and response are required", 400);

  const resolved = getA1V2Exercise(exerciseId);
  if (!resolved) return error("EXERCISE_NOT_FOUND", "Exercise not found", 404);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return error("UNAUTHORIZED", "Not signed in", 401);

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true },
  });
  if (!dbUser) return error("USER_NOT_FOUND", "User profile missing", 404);

  const learningPath = await prisma.learningPath.findFirst({
    where: {
      userId: dbUser.id,
      universe: "MONDE",
      language: "DEUTSCH",
      status: "ACTIVE",
      OR: [{ currentLevel: null }, { currentLevel: "A1" }],
    },
    select: { id: true },
  });
  if (!learningPath) return error("A1_PATH_REQUIRED", "German A1 learning path required", 403);

  const evaluation = evaluateA1Exercise(resolved.exercise, response);
  if (evaluation.correct === null) {
    return NextResponse.json({
      ok: true,
      exerciseId,
      evaluation,
      persisted: false,
      remediation: null,
    }, { status: 202 });
  }

  const now = new Date();
  const objectiveId = resolved.exercise.objectiveId ?? null;
  const cardIds = resolved.exercise.cardIds ?? [];
  const stateIds = [
    ...cardIds.map((itemId) => ({ itemKind: "CARD", itemId })),
    ...(objectiveId ? [{ itemKind: "OBJECTIVE", itemId: objectiveId }] : []),
  ];

  const existing = stateIds.length === 0 ? [] : await prisma.learningMemoryState.findMany({
    where: {
      userId: dbUser.id,
      courseId: MONDE_A1_V2_COURSE_ID,
      OR: stateIds,
    },
    select: {
      itemId: true,
      itemKind: true,
      intervalIndex: true,
      nextDueAt: true,
      failureStreak: true,
      lastResult: true,
    },
  });
  const byKey = new Map(existing.map((row) => [`${row.itemKind}:${row.itemId}`, row as A1MemoryRow]));

  let objectiveFailureStreak = 0;

  await prisma.$transaction(async (tx) => {
    for (const cardId of cardIds) {
      const card = getA1V2Card(cardId);
      if (!card) throw new Error(`A1_V2_CARD_NOT_FOUND:${cardId}`);
      const current = byKey.get(`CARD:${cardId}`) ?? null;

      if (evaluation.correct === false) {
        await tx.learningMemoryState.upsert({
          where: {
            userId_courseId_itemKind_itemId: {
              userId: dbUser.id,
              courseId: MONDE_A1_V2_COURSE_ID,
              itemKind: "CARD",
              itemId: cardId,
            },
          },
          create: {
            userId: dbUser.id,
            courseId: MONDE_A1_V2_COURSE_ID,
            itemKind: "CARD",
            itemId: cardId,
            intervalIndex: 0,
            nextDueAt: now,
            failureStreak: 1,
            lastResult: false,
            lastSeenAt: now,
            metadata: { lessonId: resolved.lesson.id, exerciseId },
          },
          update: {
            intervalIndex: 0,
            nextDueAt: now,
            failureStreak: { increment: 1 },
            lastResult: false,
            lastSeenAt: now,
            metadata: { lessonId: resolved.lesson.id, exerciseId },
          },
        });
        continue;
      }

      const next = nextCardMemory(card, current, true, now);
      await tx.learningMemoryState.upsert({
        where: {
          userId_courseId_itemKind_itemId: {
            userId: dbUser.id,
            courseId: MONDE_A1_V2_COURSE_ID,
            itemKind: "CARD",
            itemId: cardId,
          },
        },
        create: {
          userId: dbUser.id,
          courseId: MONDE_A1_V2_COURSE_ID,
          itemKind: "CARD",
          itemId: cardId,
          ...next,
          metadata: { lessonId: resolved.lesson.id, exerciseId },
        },
        update: {
          ...next,
          metadata: { lessonId: resolved.lesson.id, exerciseId },
        },
      });
    }

    if (objectiveId) {
      const objectiveState = evaluation.correct
        ? await tx.learningMemoryState.upsert({
            where: {
              userId_courseId_itemKind_itemId: {
                userId: dbUser.id,
                courseId: MONDE_A1_V2_COURSE_ID,
                itemKind: "OBJECTIVE",
                itemId: objectiveId,
              },
            },
            create: {
              userId: dbUser.id,
              courseId: MONDE_A1_V2_COURSE_ID,
              itemKind: "OBJECTIVE",
              itemId: objectiveId,
              intervalIndex: 0,
              nextDueAt: null,
              failureStreak: 0,
              lastResult: true,
              lastSeenAt: now,
              metadata: { lessonId: resolved.lesson.id, exerciseId },
            },
            update: {
              intervalIndex: 0,
              nextDueAt: null,
              failureStreak: 0,
              lastResult: true,
              lastSeenAt: now,
              metadata: { lessonId: resolved.lesson.id, exerciseId },
            },
            select: { failureStreak: true },
          })
        : await tx.learningMemoryState.upsert({
            where: {
              userId_courseId_itemKind_itemId: {
                userId: dbUser.id,
                courseId: MONDE_A1_V2_COURSE_ID,
                itemKind: "OBJECTIVE",
                itemId: objectiveId,
              },
            },
            create: {
              userId: dbUser.id,
              courseId: MONDE_A1_V2_COURSE_ID,
              itemKind: "OBJECTIVE",
              itemId: objectiveId,
              intervalIndex: 0,
              nextDueAt: null,
              failureStreak: 1,
              lastResult: false,
              lastSeenAt: now,
              metadata: { lessonId: resolved.lesson.id, exerciseId },
            },
            update: {
              intervalIndex: 0,
              nextDueAt: null,
              failureStreak: { increment: 1 },
              lastResult: false,
              lastSeenAt: now,
              metadata: { lessonId: resolved.lesson.id, exerciseId },
            },
            select: { failureStreak: true },
          });
      objectiveFailureStreak = objectiveState.failureStreak;
    }
  });

  const remediationRef = evaluation.correct === false ? resolved.exercise.remediationRef : undefined;
  const remediation = objectiveId && shouldTriggerRemediation(objectiveFailureStreak, remediationRef)
    ? getA1V2Remediation(remediationRef!)
    : null;

  return NextResponse.json({
    ok: true,
    exerciseId,
    evaluation,
    persisted: true,
    objectiveFailureStreak,
    remediation,
  });
}
