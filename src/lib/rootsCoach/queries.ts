// P4.4 · Services Prisma Coach Racines · scope strict via CircleMembership
// COACH ACTIVE du coach courant.
//
// Convention · chaque fonction reçoit un `coachUserId` **résolu serveur** via
// `resolveRootsCoachActor`. Aucun `coachId`/`circleId`/`childProfileId`
// client. Pagination bornée. Projections **minimales** conformes §9 spec ·
// jamais de nom légal complet, email, téléphone, adresse, école, date de
// naissance complète, contact parent, données Household, autres Circles.
//
// L'âge est projeté en **tranche** (§9) · jamais l'âge exact ni la date de
// naissance. Bandes · 4–6, 7–9, 10–12, 13–15, 16–17.

import { prisma } from "@/lib/prisma";

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

export interface PageArgs {
  page?: number;
  pageSize?: number;
  query?: string;
}

function normPage(args: PageArgs) {
  const page = Math.max(1, Math.floor(Number(args.page ?? 1) || 1));
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Math.floor(Number(args.pageSize ?? DEFAULT_PAGE_SIZE) || DEFAULT_PAGE_SIZE)),
  );
  const q = typeof args.query === "string" ? args.query.trim().slice(0, 80) : "";
  return { page, pageSize, q, skip: (page - 1) * pageSize };
}

export type AgeBand = "4-6" | "7-9" | "10-12" | "13-15" | "16-17" | "unknown";

/**
 * Convertit un âge Int en tranche stable. Ne jamais retourner l'âge exact.
 * Enfants < 4 ou > 17 = "unknown" (borne hors spec, ne devrait pas
 * survenir en production).
 */
export function toAgeBand(age: number | null | undefined): AgeBand {
  if (age == null || !Number.isFinite(age)) return "unknown";
  if (age >= 4 && age <= 6) return "4-6";
  if (age >= 7 && age <= 9) return "7-9";
  if (age >= 10 && age <= 12) return "10-12";
  if (age >= 13 && age <= 15) return "13-15";
  if (age >= 16 && age <= 17) return "16-17";
  return "unknown";
}

// ── Dashboard aggregates ────────────────────────────────────────────────
export interface RootsCoachDashboardStats {
  activeCircleCount: number;
  activeChildProfileCount: number;
  circleCapacityMax: number;
  profileCapacityMax: number;
  languageBreakdown: Array<{ language: string; count: number }>;
}

export async function getRootsCoachDashboard(
  coachUserId: string,
): Promise<RootsCoachDashboardStats> {
  const { MAX_ACTIVE_CIRCLES_PER_COACH, MAX_ACTIVE_CHILDREN_PER_COACH } =
    await import("@/lib/circles/capacity");
  const activeCircles = await prisma.circleMembership.findMany({
    where: {
      userId: coachUserId,
      role: "COACH",
      status: "ACTIVE",
      circle: { status: "ACTIVE" },
    },
    select: { circle: { select: { id: true, language: true } } },
  });
  const activeCircleCount = activeCircles.length;
  const circleIds = activeCircles.map((c) => c.circle.id);
  const activeChildProfileCount = circleIds.length === 0 ? 0 :
    await prisma.circleMembership.count({
      where: { circleId: { in: circleIds }, role: "CHILD", status: "ACTIVE" },
    });
  const languageBreakdownMap = new Map<string, number>();
  for (const { circle } of activeCircles) {
    const key = String(circle.language);
    languageBreakdownMap.set(key, (languageBreakdownMap.get(key) ?? 0) + 1);
  }
  const languageBreakdown = [...languageBreakdownMap.entries()]
    .map(([language, count]) => ({ language, count }))
    .sort((a, b) => b.count - a.count);
  return {
    activeCircleCount,
    activeChildProfileCount,
    circleCapacityMax: MAX_ACTIVE_CIRCLES_PER_COACH,
    profileCapacityMax: MAX_ACTIVE_CHILDREN_PER_COACH,
    languageBreakdown,
  };
}

// ── Circles ─────────────────────────────────────────────────────────────
export interface RootsCoachCircleRow {
  id: string;
  language: string;
  status: "ACTIVE" | "ARCHIVED" | "SUSPENDED";
  activeChildCount: number;
  joinedAt: Date | null;
}

export async function getRootsCoachCircles(coachUserId: string, args: PageArgs = {}) {
  const { page, pageSize, skip } = normPage(args);
  const where = {
    userId: coachUserId,
    role: "COACH" as const,
    status: "ACTIVE" as const,
    circle: { status: "ACTIVE" as const },
  };
  const [total, memberships] = await Promise.all([
    prisma.circleMembership.count({ where }),
    prisma.circleMembership.findMany({
      where,
      orderBy: { joinedAt: "desc" },
      skip,
      take: pageSize,
      select: {
        joinedAt: true,
        circle: {
          select: {
            id: true, language: true, status: true,
            _count: {
              select: {
                memberships: { where: { role: "CHILD", status: "ACTIVE" } },
              },
            },
          },
        },
      },
    }),
  ]);
  const items: RootsCoachCircleRow[] = memberships.map((m) => ({
    id: m.circle.id,
    language: String(m.circle.language),
    status: m.circle.status as "ACTIVE" | "ARCHIVED" | "SUSPENDED",
    activeChildCount: m.circle._count.memberships,
    joinedAt: m.joinedAt,
  }));
  return { items, total, page, pageSize };
}

// ── Circle detail (single) ─────────────────────────────────────────────
export interface RootsCoachCircleDetail {
  id: string;
  language: string;
  status: "ACTIVE" | "ARCHIVED" | "SUSPENDED";
  activeChildCount: number;
  joinedAt: Date | null;
  createdAt: Date;
}

/**
 * Retourne le détail d'un Circle du coach. `circleId` doit avoir été validé
 * en amont par `assertRootsCoachCircleAccess`.
 */
export async function getRootsCoachCircle(
  coachUserId: string,
  circleId: string,
): Promise<RootsCoachCircleDetail | null> {
  const m = await prisma.circleMembership.findFirst({
    where: {
      userId: coachUserId,
      circleId,
      role: "COACH",
      status: "ACTIVE",
      circle: { status: "ACTIVE" },
    },
    select: {
      joinedAt: true,
      circle: {
        select: {
          id: true, language: true, status: true, createdAt: true,
          _count: {
            select: {
              memberships: { where: { role: "CHILD", status: "ACTIVE" } },
            },
          },
        },
      },
    },
  });
  if (!m) return null;
  return {
    id: m.circle.id,
    language: String(m.circle.language),
    status: m.circle.status as "ACTIVE" | "ARCHIVED" | "SUSPENDED",
    activeChildCount: m.circle._count.memberships,
    joinedAt: m.joinedAt,
    createdAt: m.circle.createdAt,
  };
}

// ── Profiles (children in coach's circles · projection MINIMALE) ────────
export interface RootsCoachChildRow {
  id: string;
  displayName: string;
  avatarAnimal: string;
  ageBand: AgeBand;
  activeLangue: string | null;
  circleId: string;
  circleLanguage: string;
  joinedAt: Date | null;
}

export async function getRootsCoachProfiles(coachUserId: string, args: PageArgs = {}) {
  const { page, pageSize, q, skip } = normPage(args);
  const where = {
    role: "CHILD" as const,
    status: "ACTIVE" as const,
    circle: {
      status: "ACTIVE" as const,
      memberships: {
        some: { userId: coachUserId, role: "COACH" as const, status: "ACTIVE" as const },
      },
    },
    ...(q
      ? { childProfile: { prenom: { contains: q, mode: "insensitive" as const } } }
      : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.circleMembership.count({ where }),
    prisma.circleMembership.findMany({
      where,
      orderBy: { joinedAt: "desc" },
      skip,
      take: pageSize,
      select: {
        joinedAt: true,
        circle: { select: { id: true, language: true } },
        childProfile: {
          select: {
            id: true,
            prenom: true,
            avatarAnimal: true,
            age: true,
            activeLangue: true,
          },
        },
      },
    }),
  ]);
  const items: RootsCoachChildRow[] = rows
    .filter((r) => r.childProfile !== null)
    .map((r) => ({
      id: r.childProfile!.id,
      // "displayName" = prénom d'usage · jamais nom légal complet.
      displayName: r.childProfile!.prenom,
      avatarAnimal: r.childProfile!.avatarAnimal,
      ageBand: toAgeBand(r.childProfile!.age),
      activeLangue: r.childProfile!.activeLangue,
      circleId: r.circle.id,
      circleLanguage: String(r.circle.language),
      joinedAt: r.joinedAt,
    }));
  return { items, total, page, pageSize };
}

// ── Profile detail (single · projection MINIMALE) ─────────────────────
export interface RootsCoachChildDetail {
  id: string;
  displayName: string;
  avatarAnimal: string;
  ageBand: AgeBand;
  activeLangue: string | null;
  circleId: string;
  circleLanguage: string;
  joinedAt: Date | null;
}

/**
 * `childProfileId` doit avoir été validé en amont par
 * `assertRootsCoachChildAccess`. Le service double-check malgré tout.
 */
export async function getRootsCoachProfile(
  coachUserId: string,
  childProfileId: string,
): Promise<RootsCoachChildDetail | null> {
  const m = await prisma.circleMembership.findFirst({
    where: {
      childProfileId,
      role: "CHILD",
      status: "ACTIVE",
      circle: {
        status: "ACTIVE",
        memberships: {
          some: { userId: coachUserId, role: "COACH", status: "ACTIVE" },
        },
      },
    },
    select: {
      joinedAt: true,
      circle: { select: { id: true, language: true } },
      childProfile: {
        select: {
          id: true,
          prenom: true,
          avatarAnimal: true,
          age: true,
          activeLangue: true,
        },
      },
    },
  });
  if (!m || !m.childProfile) return null;
  return {
    id: m.childProfile.id,
    displayName: m.childProfile.prenom,
    avatarAnimal: m.childProfile.avatarAnimal,
    ageBand: toAgeBand(m.childProfile.age),
    activeLangue: m.childProfile.activeLangue,
    circleId: m.circle.id,
    circleLanguage: String(m.circle.language),
    joinedAt: m.joinedAt,
  };
}

// ── Capacity ────────────────────────────────────────────────────────────
export interface RootsCoachCapacityInfo {
  activeCircles: number;
  activeChildren: number;
  maxCircles: number;
  maxChildren: number;
  circlesRemaining: number;
  childrenRemaining: number;
}

export async function getRootsCoachCapacity(
  coachUserId: string,
): Promise<RootsCoachCapacityInfo> {
  const { MAX_ACTIVE_CIRCLES_PER_COACH, MAX_ACTIVE_CHILDREN_PER_COACH } =
    await import("@/lib/circles/capacity");
  const activeCircles = await prisma.circleMembership.findMany({
    where: {
      userId: coachUserId,
      role: "COACH",
      status: "ACTIVE",
      circle: { status: "ACTIVE" },
    },
    select: { circleId: true },
  });
  const circleIds = activeCircles.map((c) => c.circleId);
  const activeChildren = circleIds.length === 0 ? 0 :
    await prisma.circleMembership.count({
      where: { circleId: { in: circleIds }, role: "CHILD", status: "ACTIVE" },
    });
  return {
    activeCircles: activeCircles.length,
    activeChildren,
    maxCircles: MAX_ACTIVE_CIRCLES_PER_COACH,
    maxChildren: MAX_ACTIVE_CHILDREN_PER_COACH,
    circlesRemaining: Math.max(0, MAX_ACTIVE_CIRCLES_PER_COACH - activeCircles.length),
    childrenRemaining: Math.max(0, MAX_ACTIVE_CHILDREN_PER_COACH - activeChildren),
  };
}
