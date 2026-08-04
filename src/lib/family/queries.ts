import "server-only";
import { prisma } from "@/lib/prisma";
import type { FamilyGuardianActor } from "./actor";
import { getFamilySeatSnapshot, type FamilySeatSnapshot } from "./seats";
import { getAdultAccessSummary, type AdultAccessSummary } from "@/lib/entitlements/adult";

// P4.6 Lot 4A · lectures Family (jamais d'écriture ici).
//
// Projections strictes : aucun `pinHash` ne quitte jamais ce module. Aucun
// `parentUserId` d'un autre parent, aucun `childProfileId` d'une autre
// famille. La resolution actor précédente garantit `parentUserId === actor.userId`.

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
  // Lot 7B.1 · source canonique parcours Monde enfant. Null jusqu'à ce
  // qu'une fixture QA ou onboarding enfant l'alimente. resolveMondePath()
  // côté UI mappe cette string libre vers MondePath ou renvoie null.
  learningGoal?: string | null;
}

export interface FamilyDashboardData {
  guardian: {
    userId: string;
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
      pinHash: true, // lu ici pour dériver hasPin, JAMAIS renvoyé au client
      createdAt: true,
      // Lot 7B · universe projeté pour scoper thème Monde Ivory vs Racines
      // côté UI Family (aucun autre champ enfant sensible n'est ajouté).
      universe: true,
      // Lot 7B.1 · projection de l'objectif pédagogique enfant · alimente
      // resolveMondePath côté UI. Null autorisé (état "à préciser" honnête).
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
  const [children, snap, adultAccess] = await Promise.all([
    listFamilyChildren(actor),
    getFamilySeatSnapshot(actor),
    getAdultAccessSummary(actor.userId),
  ]);
  return {
    guardian: {
      userId: actor.userId,
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

// Chargement enfant par ID · vérifie l'ownership avant retour. Retourne null
// si l'enfant n'appartient pas à ce guardian (isolation famille A/B stricte).
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
