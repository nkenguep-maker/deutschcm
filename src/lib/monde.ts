// P2 · Helpers Monde · agrège LearningPath + AccessGrant + ModuleProgress
// pour produire l'état d'un étudiant Monde. Aucun IO ici — les callers
// server-side passent les données Prisma déjà chargées.
//
// Convention · les cours A1 sont ceux de src/data/a1-beta-modules.ts :
//   a1-beta-1..5 (5 leçons), chacun avec 5 modules
//     LESSON · HOEREN · CONVERSATION · SCHREIBEN · QUIZ
//
// A2, B1, B2, C1 restent verrouillés (MONDE_LEVEL_AVAILABILITY).

import type { AccessGrant, ModuleProgress } from "@prisma/client";
import { COURSE_TO_MODULE_IDS, COURSE_LABELS, A1_BETA_MODULES } from "@/data/a1-beta-modules";
import { MONDE_LEVEL_AVAILABILITY, type MondeLevel } from "@/lib/discovery";

export type MondeCourseId = keyof typeof COURSE_TO_MODULE_IDS;

// ─── Statut d'accès Monde ───────────────────────────────────────
export type MondeAccessStatus =
  | "ACTIVE"        // grant actif, contenu payant lisible
  | "EXPIRED"       // grant présent mais endsAt < now
  | "NONE";         // aucun grant Monde

export interface MondeAccess {
  status: MondeAccessStatus;
  startsAt: string | null;
  endsAt: string | null;
  daysRemaining: number | null;
  level: MondeLevel | null;
}

/** Calcule le statut d'accès du grant Monde le plus récent. */
export function computeMondeAccess(
  grants: Pick<AccessGrant, "startsAt" | "endsAt" | "status" | "metadata">[],
): MondeAccess {
  const now = Date.now();
  // Ne considère que les grants "Monde" (metadata.universe === "MONDE") ou
  // ceux sans univers explicite (compat future). Le paiement P5 posera un
  // metadata.universe cohérent — pour P2, tout grant ACTIVE du user est OK.
  const eligible = grants
    .filter((g) => g.status === "ACTIVE")
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());

  const active = eligible.find((g) => !g.endsAt || new Date(g.endsAt).getTime() > now);
  if (active) {
    const days = active.endsAt
      ? Math.max(0, Math.ceil((new Date(active.endsAt).getTime() - now) / 86_400_000))
      : null;
    return {
      status: "ACTIVE",
      startsAt: new Date(active.startsAt).toISOString(),
      endsAt: active.endsAt ? new Date(active.endsAt).toISOString() : null,
      daysRemaining: days,
      level: extractLevel(active.metadata),
    };
  }

  // Aucun grant actif · le dernier expiré (si il y en a un) permet
  // d'afficher un dashboard limité + intention de renouveler.
  const expired = eligible.find((g) => g.endsAt && new Date(g.endsAt).getTime() <= now);
  if (expired) {
    return {
      status: "EXPIRED",
      startsAt: new Date(expired.startsAt).toISOString(),
      endsAt: expired.endsAt ? new Date(expired.endsAt).toISOString() : null,
      daysRemaining: 0,
      level: extractLevel(expired.metadata),
    };
  }

  return { status: "NONE", startsAt: null, endsAt: null, daysRemaining: null, level: null };
}

function extractLevel(meta: unknown): MondeLevel | null {
  if (!meta || typeof meta !== "object") return null;
  const lvl = (meta as { level?: string }).level;
  const levels: MondeLevel[] = ["A1", "A2", "B1", "B2", "C1"];
  return levels.includes(lvl as MondeLevel) ? (lvl as MondeLevel) : null;
}

// ─── Cours A1 · liste + progression ─────────────────────────────
export interface MondeCourseSummary {
  id: MondeCourseId;
  index: number;               // 1..5
  label: string;               // "Beta 1 — Willkommen!"
  moduleIds: string[];
  totalModules: number;        // 5
  completedModules: number;
  status: "LOCKED" | "OPEN" | "IN_PROGRESS" | "COMPLETED";
}

/** Liste des 5 cours A1 avec état basé sur ModuleProgress. */
export function buildA1CourseList(
  progressList: Pick<ModuleProgress, "moduleId" | "status">[],
): MondeCourseSummary[] {
  const doneIds = new Set(
    progressList.filter((p) => p.status === "COMPLETED").map((p) => p.moduleId),
  );

  // Ne rend que les cours a1-beta-N (5 cours de découverte complets).
  // "a1-1" est un cours legacy hors track beta — écarté ici.
  const ids: MondeCourseId[] = ["a1-beta-1", "a1-beta-2", "a1-beta-3", "a1-beta-4", "a1-beta-5"];

  const summaries: MondeCourseSummary[] = ids.map((id, idx) => {
    const moduleIds = COURSE_TO_MODULE_IDS[id] ?? [];
    const total = moduleIds.length;
    const done = moduleIds.filter((mid) => doneIds.has(mid)).length;
    return {
      id,
      index: idx + 1,
      label: COURSE_LABELS[id] ?? id,
      moduleIds,
      totalModules: total,
      completedModules: done,
      // status calculé après la boucle (dépend du cours précédent)
      status: "LOCKED",
    };
  });

  // Verrouillage séquentiel · le cours N+1 s'ouvre quand N est complet.
  // Le premier est toujours ouvert (règle "aucun verrouillage punitif").
  let previousCompleted = true;
  for (const s of summaries) {
    if (s.completedModules === s.totalModules && s.totalModules > 0) {
      s.status = "COMPLETED";
    } else if (previousCompleted) {
      s.status = s.completedModules > 0 ? "IN_PROGRESS" : "OPEN";
    } else {
      s.status = "LOCKED";
    }
    previousCompleted = s.status === "COMPLETED";
  }

  return summaries;
}

/** Prochain module à faire pour l'étudiant. null si tout est fait. */
export function nextIncompleteModule(
  progressList: Pick<ModuleProgress, "moduleId" | "status">[],
): { courseId: MondeCourseId; moduleId: string; label: string } | null {
  const summaries = buildA1CourseList(progressList);
  const doneIds = new Set(
    progressList.filter((p) => p.status === "COMPLETED").map((p) => p.moduleId),
  );

  for (const s of summaries) {
    if (s.status === "LOCKED" || s.status === "COMPLETED") continue;
    for (const mid of s.moduleIds) {
      if (!doneIds.has(mid)) {
        const mod = A1_BETA_MODULES[mid];
        return {
          courseId: s.id,
          moduleId: mid,
          label: mod ? mod.title : mid,
        };
      }
    }
  }
  return null;
}

/** Progression globale (pourcentage entier 0-100). */
export function overallProgress(summaries: MondeCourseSummary[]): number {
  const total = summaries.reduce((acc, s) => acc + s.totalModules, 0);
  const done = summaries.reduce((acc, s) => acc + s.completedModules, 0);
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

// ─── Verrous d'accès module · Un module non-payant reste ouvert ─
// Pour P2 : tous les modules a1-beta-* sont payants (courseReady=true,
// purchasable ouvrira en P5). En absence de grant, l'accès est REFUSÉ.

export function canAccessModule(access: MondeAccess): boolean {
  return access.status === "ACTIVE";
}

/** Renvoie true si le contenu Monde A1 est prêt à être vendu/exposé (§4-6). */
export function a1IsCourseReady(): boolean {
  return MONDE_LEVEL_AVAILABILITY.A1.courseReady;
}
