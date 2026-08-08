import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { computeMondeAccess } from "@/lib/monde";
import { getCourseContent, getCourseLessonIds } from "@/data/courses/registry";
import type { MondePathwayVariant } from "@/data/courses/types";
import { resolveMondePathwayVariant } from "@/lib/course-content/pathway";
import { isTechnicalBetaCourseAccessEnabled } from "@/lib/release/technicalBeta";

export type CourseViewer = {
  userId: string;
  fullName: string;
  accessStatus: "ACTIVE" | "EXPIRED" | "NONE";
  pathwayVariant: MondePathwayVariant;
  progress: Array<{
    moduleId: string;
    status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
    score: number | null;
    completedAt: Date | null;
  }>;
};

export async function loadCourseViewer(courseId: string, locale: string): Promise<CourseViewer> {
  const course = getCourseContent(courseId);
  if (!course) redirect(`/${locale}/dashboard`);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true, fullName: true },
  });
  if (!dbUser) redirect(`/${locale}/onboarding`);

  const learningPath = await prisma.learningPath.findFirst({
    where: {
      userId: dbUser.id,
      universe: "MONDE",
      language: "DEUTSCH",
      status: "ACTIVE",
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, currentLevel: true, onboardingAnswers: true },
  });
  if (!learningPath) redirect(`/${locale}/onboarding`);

  const grants = await prisma.accessGrant.findMany({
    where: {
      OR: [
        { beneficiaryType: "USER", beneficiaryId: dbUser.id },
        { beneficiaryType: "LEARNING_PATH", beneficiaryId: learningPath.id },
      ],
    },
    select: { startsAt: true, endsAt: true, status: true, metadata: true },
  });
  const betaEligible =
    courseId === "monde-adulte-de-a1" &&
    (learningPath.currentLevel === null || learningPath.currentLevel === "A1") &&
    isTechnicalBetaCourseAccessEnabled();
  const access = computeMondeAccess(grants, { technicalBetaA1: betaEligible });

  const lessonIds = getCourseLessonIds(courseId);
  const progress = lessonIds.length === 0 ? [] : await prisma.moduleProgress.findMany({
    where: { userId: dbUser.id, moduleId: { in: lessonIds } },
    select: { moduleId: true, status: true, score: true, completedAt: true },
  });

  return {
    userId: dbUser.id,
    fullName: dbUser.fullName,
    accessStatus: access.status,
    pathwayVariant: resolveMondePathwayVariant(learningPath.onboardingAnswers),
    progress,
  };
}
