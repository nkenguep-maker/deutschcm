// Types miroir de /api/family/dashboard — copies minimales pour éviter
// d'importer server-only Prisma types côté client.

export interface FamilyChildRow {
  id: string;
  prenom: string;
  avatarAnimal: string;
  age: number;
  activeLangue: string | null;
  langues: unknown[];
  hasPin: boolean;
  createdAt: string;
  // Lot 7B · universe projeté depuis ChildProfile pour permettre à
  // Family UI de scoper le thème Monde Ivory vs Racines. AUCUN autre
  // champ enfant sensible (pinHash, pinUpdatedAt, cookie) n'est exposé.
  universe?: "MONDE" | "RACINES" | null;
  // Lot 7B.1 · objectif pédagogique enfant · projeté depuis
  // ChildProfile.learningGoal (source canonique ajoutée dans ce lot).
  // Null tant qu'aucune fixture QA ou onboarding ne l'alimente.
  learningGoal?: string | null;
}

export interface FamilySeatSnapshot {
  universe: "MONDE" | "RACINES";
  productCode: string;
  seatsTotal: number;
  seatsUsed: number;
  seatsAvailable: number;
  grantEndsAt: string | null;
}

export interface AdultAccessSummary {
  monde: boolean;
  racines: boolean;
  hasAnyAdultAccess: boolean;
}

export interface FamilyDashboardResponse {
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
