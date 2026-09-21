// Types miroir des réponses /api/center/*.
export interface CenterDashboardResponse {
  center: { id: string; name: string | null; city?: string | null } | null;
  stats: {
    teacherCount: number;
    classroomCount: number;
    studentCount: number;
    pendingEnrollmentCount: number;
  };
}

export interface CenterStudentRow {
  id: string;
  fullName: string | null;
  level: string | null;
  isActive: boolean;
}

export interface CenterTeacherRow {
  id: string;
  fullName: string | null;
  isVerified?: boolean;
  isActive?: boolean;
}

export interface CenterClassRow {
  id: string;
  name: string | null;
  level: string | null;
  activeStudentCount: number;
  maxStudents?: number;
  code?: string | null;
}

export interface CenterPendingRow {
  id: string;
  fromUserId: string;
  fromUserFullName: string;
  toClassroomId: string;
  toClassroomName: string;
  createdAt: string;
}
