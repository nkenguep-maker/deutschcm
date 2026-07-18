import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

// POST /api/lesson/complete
//
// Marque un ModuleProgress complété, incrémente XP, détecte fin de leçon
// (dernier module du Course = fin de lektion) et franchissement de niveau
// côté serveur. Retourne les données pour <LessonComplete/> ou <LevelUp/>.
//
// Idempotence : si le module est déjà "COMPLETED", ceremony="none",
// pas de re-crédit XP, pas de re-cérémonie.
//
// Level-up : détecté quand tous les cours du niveau sont complétés
// et que la moyenne des scores ≥ 70. Crée une LevelHistory avec
// ceremonySeen=false ; le front POSTera /api/ceremony/seen après
// affichage pour éviter la double cérémonie.

interface CompleteRequest {
  moduleId: string;
  xpEarned?: number;
  score?: number; // 0-100
  skills?: Array<{ name: string; score: number; total: number }>;
}

const CEFR_ORDER = ["A1", "A2", "B1", "B2", "C1"];
const YEMA_ORDER = ["É1", "É2", "É3", "É4", "É5"];

function nextLevel(current: string, kind: "cefr" | "yema"): string | null {
  const order = kind === "yema" ? YEMA_ORDER : CEFR_ORDER;
  const idx = order.indexOf(current);
  if (idx < 0 || idx >= order.length - 1) return null;
  return order[idx + 1];
}

function inferKind(level: string): "cefr" | "yema" {
  return level.startsWith("É") ? "yema" : "cefr";
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) =>
          list.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          ),
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true, germanLevel: true },
  });
  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let body: CompleteRequest;
  try {
    body = (await request.json()) as CompleteRequest;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const xp = Math.min(Math.max(body.xpEarned ?? 0, 0), 500);
  const score = typeof body.score === "number" ? Math.min(Math.max(body.score, 0), 100) : null;

  // 1. Récupérer le module + son cours
  const currentModule = await prisma.module.findUnique({
    where: { id: body.moduleId },
    select: {
      id: true,
      title: true,
      sortOrder: true,
      course: {
        select: { id: true, title: true, level: true },
      },
    },
  });
  if (!currentModule) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 });
  }

  // 2. Marquer le ModuleProgress complété (idempotent)
  const existingProgress = await prisma.moduleProgress.findFirst({
    where: { userId: dbUser.id, moduleId: currentModule.id },
    select: { id: true, status: true, completedAt: true },
  });

  const alreadyCompleted = existingProgress?.status === "COMPLETED";

  if (existingProgress) {
    if (!alreadyCompleted) {
      await prisma.moduleProgress.update({
        where: { id: existingProgress.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          score,
        },
      });
    }
  } else {
    await prisma.moduleProgress.create({
      data: {
        userId: dbUser.id,
        moduleId: currentModule.id,
        status: "COMPLETED",
        completedAt: new Date(),
        score,
      },
    });
  }

  // 3. Incrémenter XP (uniquement si première complétion)
  if (!alreadyCompleted && xp > 0) {
    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        xpTotal: { increment: xp },
        lastActiveAt: new Date(),
      },
    });
  }

  if (alreadyCompleted) {
    return NextResponse.json({ ok: true, ceremony: "none" });
  }

  // 4. Détecter fin de lektion : tous les modules du Course sont complétés ?
  const courseModules = await prisma.module.findMany({
    where: { courseId: currentModule.course.id },
    select: { id: true },
  });
  const courseCompleted = await prisma.moduleProgress.findMany({
    where: {
      userId: dbUser.id,
      moduleId: { in: courseModules.map((m) => m.id) },
      status: "COMPLETED",
    },
    select: { moduleId: true, score: true },
  });
  const lektionCompleted = courseCompleted.length === courseModules.length;

  if (!lektionCompleted) {
    return NextResponse.json({
      ok: true,
      ceremony: "none",
      moduleCompleted: true,
    });
  }

  // 5. Récupérer progression dans le niveau (tous les cours de ce niveau)
  const coursesInLevel = await prisma.course.findMany({
    where: { level: currentModule.course.level },
    select: { id: true, modules: { select: { id: true } } },
  });
  const totalModulesInLevel = coursesInLevel.reduce((s, c) => s + c.modules.length, 0);
  const allModuleIds = coursesInLevel.flatMap((c) => c.modules.map((m) => m.id));
  const progressInLevel = await prisma.moduleProgress.findMany({
    where: {
      userId: dbUser.id,
      moduleId: { in: allModuleIds },
    },
    select: { status: true, score: true },
  });
  const completedInLevel = progressInLevel.filter((p) => p.status === "COMPLETED").length;
  const newPct = totalModulesInLevel > 0
    ? Math.round((completedInLevel / totalModulesInLevel) * 100)
    : 0;
  const previousPct = totalModulesInLevel > 0
    ? Math.round(((completedInLevel - courseModules.length) / totalModulesInLevel) * 100)
    : 0;

  // 6. Level-up : niveau à 100% + moyenne des scores ≥ 70
  const avgScore =
    progressInLevel.length > 0
      ? progressInLevel.reduce((s, p) => s + (p.score ?? 0), 0) / progressInLevel.length
      : 0;

  let levelUp: { newLevel: string; kind: "cefr" | "yema"; historyId: string } | null = null;
  if (newPct >= 100 && avgScore >= 70) {
    const currentLevel = dbUser.germanLevel ?? currentModule.course.level;
    const kind = inferKind(currentLevel);
    const next = nextLevel(currentLevel, kind);
    if (next) {
      // Vérifier qu'on n'a pas déjà créé une entrée pour ce passage
      const existing = await prisma.levelHistory.findFirst({
        where: { userId: dbUser.id, oldLevel: currentLevel, newLevel: next },
        select: { id: true },
      });
      if (!existing) {
        const history = await prisma.levelHistory.create({
          data: {
            userId: dbUser.id,
            oldLevel: currentLevel,
            newLevel: next,
            reason: "lesson_completion_avg_score",
            changedBy: "system",
          },
          select: { id: true },
        });
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { germanLevel: next, levelAssignedAt: new Date() },
        });
        levelUp = { newLevel: next, kind, historyId: history.id };
      }
    }
  }

  return NextResponse.json({
    ok: true,
    ceremony: levelUp ? "levelUp" : "lesson",
    lektion: currentModule.course.title,
    skills: body.skills ?? [],
    xpEarned: xp,
    currentLevel: levelUp?.newLevel ?? dbUser.germanLevel ?? currentModule.course.level,
    previousPct,
    newPct,
    levelUp,
  });
}
