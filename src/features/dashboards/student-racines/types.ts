// Types miroir de /api/me/racines-dashboard (source : src/lib/racines.ts).
// Copie minimale pour éviter d'importer côté client des modules Prisma.

export type RacinesMode = "SOLO" | "FAMILY" | "NO_ACCESS" | "UNKNOWN";
export type RacinesLangStatus = "READY" | "PARTIAL" | "MISSING";
export type RacinesStepKey = "E1" | "E2" | "E3" | "E4" | "E5";

export interface RacinesStep {
  key: RacinesStepKey;
  labelFr: string;
  labelEn: string;
  descriptionFr: string;
  descriptionEn: string;
}

export interface RacinesChild {
  id: string;
  prenom: string;
  avatarAnimal: string;
  age: number;
  activeLangue: string | null;
  langues: unknown[];
}

export interface RacinesDashboardData {
  universe: "RACINES";
  hasLearningPath: boolean;
  learningPath?: { id: string; language: string; currentLevel: string | null };
  mode: RacinesMode;
  household: {
    childrenCount: number;
    householdConfigured: boolean;
    incoherent: boolean;
  };
  langStatus: RacinesLangStatus | null;
  anyLanguageReady: boolean;
  racinesStep: string | null;
  steps: RacinesStep[];
  children: RacinesChild[];
  activeChildId: string | null;
  greetingName: string | null;
}
