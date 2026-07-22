// P2 · GET /api/me/monde-dashboard · état complet du dashboard étudiant Monde.
// Uniquement STUDENT authentifié · retourne 200 même sans grant (le client
// rend un état "aucun accès" honnête).

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  buildA1CourseList,
  computeMondeAccess,
  nextIncompleteModule,
  overallProgress,
} from "@/lib/monde";

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: message, code }, { status });
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err("UNAUTHORIZED", "Not signed in", 401);

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true, fullName: true, xpTotal: true },
    });
    if (!dbUser) return err("NOT_FOUND", "user profile missing", 404);

    // Rôle · STUDENT strict pour rester cohérent avec /api/funnel.
    const studentRole = await prisma.userRole.findFirst({
      where: { userId: dbUser.id, role: "STUDENT", status: "ACTIVE" },
      select: { id: true },
    });
    if (!studentRole) return err("FORBIDDEN_NOT_STUDENT", "STUDENT role required", 403);

    // LearningPath Monde le plus récent
    const lp = await prisma.learningPath.findFirst({
      where: { userId: dbUser.id, status: "ACTIVE", universe: "MONDE" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, universe: true, language: true, currentLevel: true,
        onboardingAnswers: true, createdAt: true,
      },
    });
    if (!lp) {
      return NextResponse.json({
        universe: "MONDE",
        hasLearningPath: false,
        access: { status: "NONE", startsAt: null, endsAt: null, daysRemaining: null, level: null },
        courses: [],
        overallPct: 0,
        nextModule: null,
        greetingName: dbUser.fullName ?? null,
      });
    }

    // Grants actifs du user OU du learning path
    const grants = await prisma.accessGrant.findMany({
      where: {
        OR: [
          { beneficiaryType: "USER", beneficiaryId: dbUser.id },
          { beneficiaryType: "LEARNING_PATH", beneficiaryId: lp.id },
        ],
      },
      select: { startsAt: true, endsAt: true, status: true, metadata: true },
    });
    const access = computeMondeAccess(grants);

    // Progression sur les modules a1-beta-*
    const progressList = await prisma.moduleProgress.findMany({
      where: {
        userId: dbUser.id,
        moduleId: { startsWith: "a1-beta-" },
      },
      select: { moduleId: true, status: true, completedAt: true, score: true },
    });

    const courses = buildA1CourseList(progressList);
    const next = nextIncompleteModule(progressList);
    const overallPct = overallProgress(courses);

    return NextResponse.json({
      universe: "MONDE",
      hasLearningPath: true,
      learningPath: {
        id: lp.id,
        language: lp.language,
        currentLevel: lp.currentLevel,
      },
      access,
      courses,
      overallPct,
      nextModule: next,
      greetingName: dbUser.fullName ?? null,
      xpTotal: dbUser.xpTotal ?? 0,
    });
  } catch (e) {
    console.error("[monde-dashboard] FAIL", e);
    return err("INTERNAL", "internal error", 500);
  }
}
