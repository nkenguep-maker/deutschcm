// Types miroir des réponses /api/teacher/* — copies minimales pour éviter
// d'importer côté client des modules Prisma.

export interface TeacherDashboardStats {
  classroomCount: number;
  activeStudentCount: number;
  pendingRequestCount: number;
}

export interface TeacherDashboardResponse {
  teacher: { id: string; isVerified: boolean };
  center: { id: string; name: string; city: string; country?: string; plan?: string } | null;
  stats: TeacherDashboardStats;
  actorRole?: string;
}

export interface TeacherClassRow {
  id: string;
  name: string | null;
  level: string | null;
  code: string | null;
  description?: string | null;
  activeStudentCount: number;
  maxStudents?: number;
  isActive?: boolean;
  centerId?: string | null;
  createdAt?: string;
}

export interface TeacherClassesResponse {
  items: TeacherClassRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TeacherStudentRow {
  id: string;
  fullName: string | null;
  level: string | null;
  classroomId: string;
  joinedAt: string | null;
  isActive: boolean;
}

export interface TeacherStudentsResponse {
  items: TeacherStudentRow[];
  total: number;
  page: number;
  pageSize: number;
}

export type TeacherAssignmentStatus = "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";

export interface TeacherAssignmentRow {
  id: string;
  classroomId: string;
  title: string;
  type: string;
  status: TeacherAssignmentStatus;
  publishedAt: string | null;
  closedAt: string | null;
  dueDate: string | null;
  updatedAt: string;
}
