export interface CoachLanguageBreakdown {
  language: string;
  activeCircleCount: number;
  activeChildCount: number;
}

export interface CoachDashboardStats {
  activeCircleCount: number;
  activeChildProfileCount: number;
  circleCapacityMax: number;
  profileCapacityMax: number;
  languageBreakdown: CoachLanguageBreakdown[];
}

export interface CoachDashboardResponse {
  actorRole: "RACINES_COACH";
  profile: {
    fullName: string | null;
    city: string | null;
    qualifications: string | null;
  };
  stats: CoachDashboardStats;
}

export type CoachAgeBand = "4-6" | "7-9" | "10-12" | "13-15" | "16-17" | "unknown";

export interface CoachChildProfileRow {
  id: string;
  displayName: string;
  avatarAnimal: string;
  ageBand: CoachAgeBand;
  activeLangue: string | null;
  circleId: string | null;
  circleLanguage: string | null;
  joinedAt: string | null;
}

export interface CoachProfilesResponse {
  items: CoachChildProfileRow[];
  total: number;
  page: number;
  pageSize: number;
}
