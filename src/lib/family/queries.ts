import "server-only";
import { prisma } from "@/lib/prisma";
import type { FamilyGuardianActor } from "./actor";
import { getFamilySeatSnapshot, type FamilySeatSnapshot } from "./seats";
import { getAdultAccessSummary, type AdultAccessSummary } from "@/lib/entitlements/adult";

export interface FamilyChildRow {
  id: string;
  prenom: string;
  avatarAnimal: string;
  age: number;
  activeLangue: string | null;
  langues: unknown[];
  hasPin: boolean;
  createdAt: string;
  universe?: "MONDE" | "RACINES" | null;
  learningGoal?: string | null;
}

export interface FamilyDashboardData {
  guardian: {
    userId: string;
    fullName: string | null;
    city: string | null;
    hasParentRole: boolean;
    hasHousehold: boolean;
  };
  children: FamilyChildRow[];
  seats: FamilySeatSnapshot[];
  totalChildSeatsAvailable: number;
  totalChildrenLinked: number;
  canAddChild: boolean;
  adultAccess: AdultAccessSummary;
}

export async function listFamilyChildren(actor: FamilyGuardianActor): Promise<FamilyChildRow[]> {
  const rows = await prisma.childProfile.findMany({
    where: { parentUserId: actor.userId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      prenom: true,
      avatarAnimal: true,
      age: true,
      activeLangue: true,
      langues: true,
      pinHash: true,
      createdAt: true,
      universe: true,
      learningGoal: true,
    },
  });
  return rows.map((r) => ({
    id: r.id,
    prenom: r.prenom,
    avatarAnimal: r.avatarAnimal,
    age: r.age,
    activeLangue: r.activeLangue,
    langues: (r.langues as unknown[]) ?? [],
    hasPin: Boolean(r.pinHash),
    createdAt: r.createdAt.toISOString(),
    universe: r.universe ?? null,
    learningGoal: r.learningGoal ?? null,
  }));
}

export async function getFamilyDashboard(
  actor: FamilyGuardianActor,
): Promise<FamilyDashboardData> {
  const [children, snap, adultAccess, guardian] = await Promise.all([
    listFamilyChildren(actor),
    getFamilySeatSnapshot(actor),
    getAdultAccessSummary(actor.userId),
    prisma.user.findUnique({
      where: { id: actor.userId },
      select: { fullName: true, city: true },
    }),
  ]);
  return {
    guardian: {
      userId: actor.userId,
      fullName: guardian?.fullName ?? null,
      city: guardian?.city ?? null,
      hasParentRole: actor.hasParentRole,
      hasHousehold: actor.householdIdsOwned.length + actor.householdIdsMember.length > 0,
    },
    children,
    seats: snap.seats,
    totalChildSeatsAvailable: snap.totalChildSeatsAvailable,
    totalChildrenLinked: snap.totalChildrenActuallyLinked,
    canAddChild: snap.totalChildSeatsAvailable > 0,
    adultAccess,
  };
}

export async function loadOwnedChild(
  actor: FamilyGuardianActor,
  childId: string,
): Promise<FamilyChildRow | null> {
  const row = await prisma.childProfile.findFirst({
    where: { id: childId, parentUserId: actor.userId },
    select: {
      id: true,
      prenom: true,
      avatarAnimal: true,
      age: true,
      activeLangue: true,
      langues: true,
      pinHash: true,
      createdAt: true,
    },
  });
  if (!row) return null;
  return {
    id: row.id,
    prenom: row.prenom,
    avatarAnimal: row.avatarAnimal,
    age: row.age,
    activeLangue: row.activeLangue,
    langues: (row.langues as unknown[]) ?? [],
    hasPin: Boolean(row.pinHash),
    createdAt: row.createdAt.toISOString(),
  };
}
