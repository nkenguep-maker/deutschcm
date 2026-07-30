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
