import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { DifficultyLevel, ModuleType } from "@prisma/client";

const LEVEL_ICONS: Record<string, string> = {
  A1: "👋", A2: "🏙️", B1: "🌍", B2: "📰", C1: "🎭",
};

async function getAuthUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true, role: true },
  });
}

// ── GET: list courses (published for students, all for admin/teacher) ──────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const level = searchParams.get("level");
  const includeUnpublished = searchParams.get("includeUnpublished") === "true";

  if (includeUnpublished) {
    const user = await getAuthUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "TEACHER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const where: Record<string, unknown> = {};
  if (!includeUnpublished) where.isPublished = true;
  if (level && Object.values(DifficultyLevel).includes(level as DifficultyLevel)) {
    where.level = level as DifficultyLevel;
  }

  const courses = await prisma.course.findMany({
    where,
    include: {
      modules: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, title: true, type: true, sortOrder: true, isPublished: true },
      },
    },
    orderBy: [{ level: "asc" }, { sortOrder: "asc" }],
  });

  if (courses.length === 0) {
    return NextResponse.json({ courses: [], fallback: true });
  }

  // Group modules by lektion (sortOrder) → one card per lektion
  const cards = [];
  for (const course of courses) {
    const grouped: Record<number, typeof course.modules> = {};
    for (const mod of course.modules) {
      if (!grouped[mod.sortOrder]) grouped[mod.sortOrder] = [];
      grouped[mod.sortOrder].push(mod);
    }

    for (const [sortOrderStr, mods] of Object.entries(grouped)) {
      const sortOrder = Number(sortOrderStr);
      // "L1 — Guten Tag! (Lesen)" → "Guten Tag!"
      const rawTitle = mods[0].title;
      const match = rawTitle.match(/L\d+ — (.+?) \(/);
      const lektionTitleDE = match ? match[1] : rawTitle;

      cards.push({
        id: `${course.id}-L${sortOrder}`,
        courseId: course.id,
        firstModuleId: mods[0].id,
        lektionNumber: sortOrder,
        titleDE: lektionTitleDE,
        titleFR: course.description,
        level: course.level as string,
        modules: mods.length,
        lektionen: `Lektion ${sortOrder}`,
        icon: LEVEL_ICONS[course.level] ?? "📚",
        locked: false,
        progress: 0,
        isPublished: course.isPublished,
        moduleIds: mods.map(m => m.id),
        tags: course.tags,
      });
    }
  }

  return NextResponse.json({ courses: cards, fallback: false });
}

// ── POST: save generatedData to DB without re-running Gemini ─────────────────
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  const allowed = ["ADMIN", "TEACHER", "CENTER_MANAGER"];
  if (!user || !allowed.includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { generatedData, lektion_number, lektion_title, level, theme, manuel, competences, isPublished, videoUrl } = body;

  if (!generatedData || !lektion_number || !lektion_title || !level || !theme || !manuel || !Array.isArray(competences)) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!Object.values(DifficultyLevel).includes(level as DifficultyLevel)) {
    return NextResponse.json({ error: `Invalid level: ${level}` }, { status: 400 });
  }

  const publish = isPublished === true;

  // Find or create the Course (one per manuel+level)
  let course = await prisma.course.findFirst({
    where: { title: manuel, level: level as DifficultyLevel },
  });
  if (!course) {
    course = await prisma.course.create({
      data: {
        title: manuel,
        description: `Cours basé sur ${manuel} — niveau ${level}`,
        level: level as DifficultyLevel,
        isPublished: publish,
        isFree: false,
        tags: [level, "CEFR", manuel.split(" ")[0]],
        sortOrder: lektion_number,
      },
    });
  } else if (publish && !course.isPublished) {
    await prisma.course.update({ where: { id: course.id }, data: { isPublished: true } });
  }

  const moduleIds: string[] = [];

  // Create VIDEO module first if a URL was provided
  if (videoUrl && typeof videoUrl === "string" && videoUrl.trim()) {
    const videoMod = await prisma.module.create({
      data: {
        courseId: course.id,
        title: `L${lektion_number} — ${lektion_title} (Vidéo)`,
        description: theme,
        type: ModuleType.VIDEO,
        content: { videoUrl: videoUrl.trim() } as object,
        videoUrl: videoUrl.trim(),
        sortOrder: lektion_number,
        isPublished: publish,
        xpReward: 20,
      },
    });
    moduleIds.push(videoMod.id);
  }

  for (const comp of competences as string[]) {
    const compData = generatedData[comp === "lesen" ? "lektion" : comp] ?? null;

    const mod = await prisma.module.create({
      data: {
        courseId: course.id,
        title: `L${lektion_number} — ${lektion_title} (${comp.charAt(0).toUpperCase() + comp.slice(1)})`,
        description: theme,
        type: comp === "sprechen" ? ModuleType.CONVERSATION : ModuleType.LESSON,
        content: compData as object,
        sortOrder: lektion_number,
        isPublished: publish,
        xpReward: 50,
      },
    });
    moduleIds.push(mod.id);

    // Auto-create quiz module from lesen comprehension questions
    if (comp === "lesen") {
      const lektionData = generatedData.lektion as Record<string, unknown> | undefined;
      const lesetext = lektionData?.lesetext as Record<string, unknown> | undefined;
      const questions = lesetext?.questions as unknown[] | undefined;
      if (Array.isArray(questions) && questions.length > 0) {
        const quizMod = await prisma.module.create({
          data: {
            courseId: course.id,
            title: `L${lektion_number} — ${lektion_title} (Quiz Lesen)`,
            description: `Quiz de compréhension — ${theme}`,
            type: ModuleType.QUIZ,
            content: { questions } as object,
            sortOrder: lektion_number,
            isPublished: publish,
            xpReward: 30,
          },
        });
        moduleIds.push(quizMod.id);
      }
    }
  }

  return NextResponse.json({ success: true, courseId: course.id, moduleIds });
}

// ── PATCH: publish or unpublish a course (and all its modules) ────────────────
export async function PATCH(request: NextRequest) {
  const user = await getAuthUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "TEACHER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { courseId, isPublished } = body as { courseId?: string; isPublished?: boolean };

  if (!courseId || typeof isPublished !== "boolean") {
    return NextResponse.json({ error: "Missing courseId or isPublished" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.course.update({ where: { id: courseId }, data: { isPublished } }),
    prisma.module.updateMany({ where: { courseId }, data: { isPublished } }),
  ]);

  return NextResponse.json({ success: true, courseId, isPublished });
}
