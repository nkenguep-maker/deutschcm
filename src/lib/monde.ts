// Helpers Monde · agrège LearningPath + AccessGrant + ModuleProgress
// pour produire l'état d'un étudiant Monde. Aucun IO ici : les callers
// server-side passent les données Prisma déjà chargées.
//
// Le catalogue A1 officiel provient du registre de cours YEMA :
// 6 unités communicatives × 6 leçons, séquence
// Comprends → Pratique → Produis → Valide.

import type { AccessGrant, ModuleProgress } from "@prisma/client";
import { DE_A1_COURSE, getCourseLessonById } from "@/data/courses/registry";
import { MONDE_LEVEL_AVAILABILITY, type MondeLevel } from "@/lib/discovery";

export type MondeCourseId = string;

export type MondeAccessStatus = "ACTIVE" | "EXPIRED" | "NONE";

export interface MondeAccess {
  status: MondeAccessStatus;
  startsAt: string | null;
  endsAt: string | null;
  daysRemaining: number | null;
  level: MondeLevel | null;
  source?: "GRANT" | "TECHNICAL_BETA";
}

export function computeMondeAccess(
  grants: Pick<AccessGrant, "startsAt" | "endsAt" | "status" | "metadata">[],
  options?: { technicalBetaA1?: boolean },
): MondeAccess {
  const now = Date.now();
  const eligible = grants
    .filter((grant) => grant.status === "ACTIVE")
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());

  const active = eligible.find((grant) => !grant.endsAt || new Date(grant.endsAt).getTime() > now);
  if (active) {
    const daysRemaining = active.endsAt
      ? Math.max(0, Math.ceil((new Date(active.endsAt).getTime() - now) / 86_400_000))
      : null;
    return {
      status: "ACTIVE",
      startsAt: new Date(active.startsAt).toISOString(),
      endsAt: active.endsAt ? new Date(active.endsAt).toISOString() : null,
      daysRemaining,
      level: extractLevel(active.metadata),
      source: "GRANT",
    };
  }

  // Bêta technique : ouvre uniquement le niveau A1 réellement prêt, sans
  // écrire un entitlement commercial en base. Cette branche est calculée à
  // la lecture et disparaît immédiatement lorsque le flag serveur est coupé.
  if (options?.technicalBetaA1) {
    return {
      status: "ACTIVE",
      startsAt: null,
      endsAt: null,
      daysRemaining: null,
      level: "A1",
      source: "TECHNICAL_BETA",
    };
  }

  const expired = eligible.find((grant) => grant.endsAt && new Date(grant.endsAt).getTime() <= now);
  if (expired) {
    return {
      status: "EXPIRED",
      startsAt: new Date(expired.startsAt).toISOString(),
      endsAt: expired.endsAt ? new Date(expired.endsAt).toISOString() : null,
      daysRemaining: 0,
      level: extractLevel(expired.metadata),
      source: "GRANT",
    };
  }

  return { status: "NONE", startsAt: null, endsAt: null, daysRemaining: null, level: null };
}

function extractLevel(metadata: unknown): MondeLevel | null {
  if (!metadata || typeof metadata !== "object") return null;
  const level = (metadata as { level?: string }).level;
  const levels: MondeLevel[] = ["A1", "A2", "B1", "B2", "C1"];
  return levels.includes(level as MondeLevel) ? (level as MondeLevel) : null;
}

export interface MondeCourseSummary {
  id: MondeCourseId;
  index: number;
  label: string;
  moduleIds: string[];
  totalModules: number;
  completedModules: number;
  status: "LOCKED" | "OPEN" | "IN_PROGRESS" | "COMPLETED";
}

export function buildA1CourseList(
  progressList: Pick<ModuleProgress, "moduleId" | "status">[],
): MondeCourseSummary[] {
  const completedIds = new Set(
    progressList.filter((progress) => progress.status === "COMPLETED").map((progress) => progress.moduleId),
  );

  const summaries: MondeCourseSummary[] = DE_A1_COURSE.units.map((unit) => {
    const moduleIds = unit.lessons.map((lesson) => lesson.id);
    return {
      id: unit.id,
      index: unit.order,
      label: unit.title,
      moduleIds,
      totalModules: moduleIds.length,
      completedModules: moduleIds.filter((moduleId) => completedIds.has(moduleId)).length,
      status: "LOCKED",
    };
  });

  let previousCompleted = true;
  for (const summary of summaries) {
    if (summary.totalModules > 0 && summary.completedModules === summary.totalModules) {
      summary.status = "COMPLETED";
    } else if (previousCompleted) {
      summary.status = summary.completedModules > 0 ? "IN_PROGRESS" : "OPEN";
    } else {
      summary.status = "LOCKED";
    }
    previousCompleted = summary.status === "COMPLETED";
  }

  return summaries;
}

export function nextIncompleteModule(
  progressList: Pick<ModuleProgress, "moduleId" | "status">[],
): { courseId: MondeCourseId; moduleId: string; label: string } | null {
  const summaries = buildA1CourseList(progressList);
  const completedIds = new Set(
    progressList.filter((progress) => progress.status === "COMPLETED").map((progress) => progress.moduleId),
  );

  for (const summary of summaries) {
    if (summary.status === "LOCKED" || summary.status === "COMPLETED") continue;
    for (const moduleId of summary.moduleIds) {
      if (completedIds.has(moduleId)) continue;
      return {
        courseId: summary.id,
        moduleId,
        label: getCourseLessonById(DE_A1_COURSE.course.id, moduleId)?.lesson.title ?? moduleId,
      };
    }
  }
  return null;
}

export function overallProgress(summaries: MondeCourseSummary[]): number {
  const total = summaries.reduce((sum, summary) => sum + summary.totalModules, 0);
  const completed = summaries.reduce((sum, summary) => sum + summary.completedModules, 0);
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}

export function canAccessModule(access: MondeAccess): boolean {
  return access.status === "ACTIVE";
}

export function a1IsCourseReady(): boolean {
  return MONDE_LEVEL_AVAILABILITY.A1.courseReady;
}
