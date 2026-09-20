import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  MONDE_A1_V2_COURSE_ID,
  getA1V2CardsAvailableForLesson,
  isA1V2PublicReady,
  getA1V2Lesson,
} from "@/content/monde-a1-v2";
import { selectWakeCards } from "@/lib/course-content/a1-v2/memory";

function error(code: string, message: string, status: number) {
  return NextResponse.json({ ok: false, code, error: message }, { status });
}

export async function GET(request: NextRequest) {
  if (process.env.VERCEL_ENV === "production" && !isA1V2PublicReady()) {
    return error("COURSE_NOT_READY", "A1 refonte is not public yet", 404);
  }

  const lessonId = request.nextUrl.searchParams.get("lessonId") ?? "";
  const lesson = getA1V2Lesson(lessonId);
  if (!lesson) return error("LESSON_NOT_FOUND", "Lesson not found", 404);

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

  const states = await prisma.learningMemoryState.findMany({
    where: {
      userId: dbUser.id,
      courseId: MONDE_A1_V2_COURSE_ID,
      itemKind: "CARD",
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

  const cards = selectWakeCards({
    lesson,
    cards: getA1V2CardsAvailableForLesson(lessonId),
    states,
  });

  return NextResponse.json({
    ok: true,
    lessonId,
    maxSeconds: lesson.reveil.maxSeconds ?? 90,
    cards: cards.map((card) => ({
      id: card.id,
      kind: card.kind,
      de: card.de,
      fr: card.fr,
    })),
  });
}
