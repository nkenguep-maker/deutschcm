// ─── Rôles et permissions Yema ───────────────────────

export type UserRole = "STUDENT" | "TEACHER" | "CENTER_MANAGER" | "ADMIN"

export type Permission =
  // Cours
  | "courses:read"
  | "courses:write"
  | "courses:delete"
  | "courses:generate"
  // Modules
  | "modules:read"
  | "modules:complete"
  // Simulateur
  | "simulateur:use"
  | "simulateur:unlimited"
  // Quiz
  | "quiz:take"
  | "quiz:create"
  // Classes
  | "classroom:join"
  | "classroom:create"
  | "classroom:manage"
  | "classroom:validate_students"
  // Élèves
  | "students:view"
  | "students:manage"
  | "students:grade"
  // Centre
  | "center:view"
  | "center:manage"
  | "center:billing"
  | "center:invite_teachers"
  // Admin
  | "admin:dashboard"
  | "admin:users"
  | "admin:courses"
  | "admin:validations"
  | "admin:system"
  // Profil
  | "profile:read"
  | "profile:write"
  // Notifications
  | "notifications:read"
  | "notifications:send"

// Permissions par rôle
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  STUDENT: [
    "courses:read",
    "modules:read",
    "modules:complete",
    "simulateur:use",
    "quiz:take",
    "classroom:join",
    "profile:read",
    "profile:write",
    "notifications:read",
  ],
  TEACHER: [
    "courses:read",
    "modules:read",
    "modules:complete",
    "simulateur:use",
    "simulateur:unlimited",
    "quiz:take",
    "quiz:create",
    "classroom:join",
    "classroom:create",
    "classroom:manage",
    "classroom:validate_students",
    "students:view",
    "students:manage",
    "students:grade",
    "profile:read",
    "profile:write",
    "notifications:read",
    "notifications:send",
  ],
  CENTER_MANAGER: [
    "courses:read",
    "modules:read",
    "simulateur:use",
    "simulateur:unlimited",
    "quiz:take",
    "classroom:create",
    "classroom:manage",
    "classroom:validate_students",
    "students:view",
    "students:manage",
    "center:view",
    "center:manage",
    "center:billing",
    "center:invite_teachers",
    "profile:read",
    "profile:write",
    "notifications:read",
    "notifications:send",
  ],
  ADMIN: [
    "courses:read",
    "courses:write",
    "courses:delete",
    "courses:generate",
    "modules:read",
    "modules:complete",
    "simulateur:use",
    "simulateur:unlimited",
    "quiz:take",
    "quiz:create",
    "classroom:join",
    "classroom:create",
    "classroom:manage",
    "classroom:validate_students",
    "students:view",
    "students:manage",
    "students:grade",
    "center:view",
    "center:manage",
    "center:billing",
    "center:invite_teachers",
    "admin:dashboard",
    "admin:users",
    "admin:courses",
    "admin:validations",
    "admin:system",
    "profile:read",
    "profile:write",
    "notifications:read",
    "notifications:send",
  ]
}

// Limites par plan
export const PLAN_LIMITS = {
  FREE: {
    simulateur_sessions_per_month: 3,
    lessons_per_day: 3,
    max_level: "A1",
    quiz_attempts: 2,
    classroom_join: false,
    group_create: false,
  },
  BASIC: {
    simulateur_sessions_per_month: 300,
    lessons_per_day: 999,
    max_level: "A2",
    quiz_attempts: 999,
    classroom_join: true,
    group_create: false,
  },
  PREMIUM: {
    simulateur_sessions_per_month: 999,
    lessons_per_day: 999,
    max_level: "C1",
    quiz_attempts: 999,
    classroom_join: true,
    group_create: true,
  },
  ANNUAL: {
    simulateur_sessions_per_month: 999,
    lessons_per_day: 999,
    max_level: "C1",
    quiz_attempts: 999,
    classroom_join: true,
    group_create: true,
  }
}

// Routes protégées par rôle
export const PROTECTED_ROUTES: Record<string, UserRole[]> = {
  "/admin": ["ADMIN"],
  "/admin/courses/generate": ["ADMIN"],
  "/teacher": ["TEACHER", "ADMIN"],
  "/teacher/classroom": ["TEACHER", "ADMIN"],
  "/teacher/students": ["TEACHER", "ADMIN"],
  "/center": ["CENTER_MANAGER", "ADMIN"],
  "/center/teachers": ["CENTER_MANAGER", "ADMIN"],
  "/center/students": ["CENTER_MANAGER", "ADMIN"],
  "/center/billing": ["CENTER_MANAGER", "ADMIN"],
  "/dashboard": ["STUDENT", "TEACHER", "CENTER_MANAGER", "ADMIN"],
  "/courses": ["STUDENT", "TEACHER", "CENTER_MANAGER", "ADMIN"],
  "/simulateur": ["STUDENT", "TEACHER", "CENTER_MANAGER", "ADMIN"],
  "/progress": ["STUDENT", "TEACHER", "CENTER_MANAGER", "ADMIN"],
  "/discover": ["STUDENT", "TEACHER", "CENTER_MANAGER", "ADMIN"],
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole)
}

export function canAccessRoute(userRole: UserRole, pathname: string): boolean {
  const allowedRoles = PROTECTED_ROUTES[pathname]
  if (!allowedRoles) return true
  return hasRole(userRole, allowedRoles)
}

export function getDefaultRedirect(role: UserRole): string {
  switch (role) {
    case "ADMIN": return "/admin"
    case "TEACHER": return "/teacher"
    case "CENTER_MANAGER": return "/center"
    default: return "/dashboard"
  }
}

export function getOnboardingRoute(role: UserRole): string {
  switch (role) {
    case "TEACHER": return "/onboarding/teacher"
    case "CENTER_MANAGER": return "/onboarding/center"
    default: return "/onboarding/student"
  }
}
