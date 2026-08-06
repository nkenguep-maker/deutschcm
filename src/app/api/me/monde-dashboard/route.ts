// P2 · GET /api/me/monde-dashboard · état complet du dashboard étudiant Monde.

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  buildA1CourseList,
  computeMondeAccess,
  nextIncompleteModule,
  overallProgress,
} from "@/lib/monde";
import {
  INTERNAL_TEST_COOKIE_NAME,
  isInternalPersonaId,
  isInternalTesterEmail,
} from "@/lib/internalTest";
import { hasInternalTestMarker } from "@/lib/internalTestProvisioning";

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
      select: {
        id: true, fullName: true, xpTotal: true,
        learningGoal: true,
        city: true,
      },
    });
    if (!dbUser) return err("NOT_FOUND", "user profile missing", 404);

    const studentRole = await prisma.userRole.findFirst({
      where: { userId: dbUser.id, role: "STUDENT", status: "ACTIVE" },
      select: { id: true },
    });
    if (!studentRole) return err("FORBIDDEN_NOT_STUDENT", "STUDENT role required", 403);

    const candidates = await prisma.learningPath.findMany({
      where: { userId: dbUser.id, status: "ACTIVE", universe: "MONDE" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, universe: true, language: true, currentLevel: true,
        onboardingAnswers: true, createdAt: true,
      },
    });
    const jar = await cookies();
    const rawPersona = jar.get(INTERNAL_TEST_COOKIE_NAME)?.value;
    const persona = isInternalPersonaId(rawPersona) ? rawPersona : null;
    const useInternal = isInternalTesterEmail(user.email) && persona === "student_monde";
    const lp = useInternal
      ? candidates.find((path) => hasInternalTestMarker(path.onboardingAnswers)) ?? candidates[0]
      : candidates.find((path) => !hasInternalTestMarker(path.onboardingAnswers)) ?? candidates[0];

    if (!lp) {
      return NextResponse.json({
        universe: "MONDE",
        hasLearningPath: false,
        access: { status: "NONE", startsAt: null, endsAt: null, daysRemaining: null, level: null },
        courses: [],
        overallPct: 0,
        nextModule: null,
        greetingName: dbUser.fullName ?? null,
        onboarding: {
          learningGoal: dbUser.learningGoal ?? null,
          targetCity: dbUser.city ?? null,
        },
      });
    }

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

    const progressList = await prisma.moduleProgress.findMany({
      where: {
        userId: dbUser.id,
        moduleId: { startsWith: "de-a1-" },
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
      onboarding: {
        learningGoal: dbUser.learningGoal ?? null,
        targetCity: dbUser.city ?? null,
      },
    });
  } catch (e) {
    console.error("[monde-dashboard] FAIL", e);
    return err("INTERNAL", "internal error", 500);
  }
}
