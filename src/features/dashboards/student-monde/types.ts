// Types miroir de la réponse /api/me/monde-dashboard (source : src/lib/monde.ts).
// On duplique intentionnellement les shapes minimales dont l'UI a besoin plutôt
// que d'importer les types serveur — évite d'entraîner les dépendances Prisma
// dans le bundle client.

export type MondeAccessStatus = "ACTIVE" | "EXPIRED" | "NONE";

export interface MondeAccess {
  status: MondeAccessStatus;
  startsAt: string | null;
  endsAt: string | null;
  daysRemaining: number | null;
  level: string | null;
}

export type MondeCourseStatus = "LOCKED" | "OPEN" | "IN_PROGRESS" | "COMPLETED";

export interface MondeCourseSummary {
  id: string;
  index: number;
  label: string;
  status: MondeCourseStatus;
  totalModules: number;
  completedModules: number;
  moduleIds: string[];
}

export interface MondeDashboardData {
  universe: "MONDE";
  hasLearningPath: boolean;
  learningPath?: { id: string; language: string; currentLevel: string | null };
  access: MondeAccess;
  courses: MondeCourseSummary[];
  overallPct: number;
  nextModule: { courseId: string; moduleId: string; label: string } | null;
  greetingName: string | null;
  xpTotal?: number;
}

export type MondeAssignmentStatus = "PUBLISHED" | "CLOSED";

export interface MondeStudentAssignment {
  id: string;
  classroomId: string;
  title: string;
  type: string;
  status: MondeAssignmentStatus;
  publishedAt: string | null;
  closedAt: string | null;
  dueDate: string | null;
}

export type AssignmentsAvailability =
  | { kind: "available"; assignments: MondeStudentAssignment[] }
  | { kind: "unavailable" }
  | { kind: "error" };
