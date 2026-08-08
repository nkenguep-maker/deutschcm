// Lot 7C · matrice canonique des 9 personas · source unique de vérité.
//
// Ce fichier NE crée aucune permission. Il documente et fige
// structurellement les intersections rôle × entitlement × univers × route
// telles qu'elles existent déjà dans le repo (proxy PROTECTED_ROUTES,
// getAdultAccessSummary, getFamilySeatSnapshot, resolveTeacherActor, etc.).
//
// Consommé par ·
//   - src/lib/__tests__/personasMatrix7C.test.ts (structurel)
//   - scripts/orchestrate-personas-p1.mjs (API-level checks)
//   - scripts/orchestrate-personas-capture.mjs (Playwright per persona)

export type PersonaId =
  | "super_admin"
  | "teacher"
  | "coach"
  | "center_admin"
  | "student_monde"
  | "student_racines"
  | "family"
  | "child_monde"
  | "child_racines";

export type SpaceRole = "STUDENT" | "TEACHER" | "CENTER" | "ADMIN";
export type Universe = "MONDE" | "RACINES" | null;
export type AuthKind = "session" | "child_pin";

export interface PersonaEntry {
  id: PersonaId;
  qaEmail: string | null; // null = enfant (auth via avatar + PIN)
  spaceRole: SpaceRole | null; // null = enfant (aucun SpaceRole)
  appRole: string | null;
  universe: Universe;
  homeRoute: string;
  // Routes API "must-pass" · au moins 1 doit répondre 200 (ownership scoped).
  allowedApi: readonly string[];
  // Routes API "must-fail" · doivent répondre 401/403/404 (jamais 200).
  forbiddenApi: readonly string[];
  // Types de messagerie autorisés côté persona (canonique P4.6).
  messaging: {
    realtime: boolean;
    polling: boolean;
    audio: boolean;
    freeText: boolean;
    parentCopy: boolean;
  };
  authKind: AuthKind;
}

export const PERSONA_MATRIX: readonly PersonaEntry[] = [
  {
    id: "super_admin",
    qaEmail: "test_yema_qa_super_admin@example.com",
    spaceRole: "ADMIN",
    appRole: "YEMA_ADMIN",
    universe: null,
    homeRoute: "/fr/admin",
    allowedApi: ["/api/me"],
    forbiddenApi: ["/api/teacher/students"],
    messaging: { realtime: true, polling: true, audio: true, freeText: true, parentCopy: false },
    authKind: "session",
  },
  {
    id: "teacher",
    qaEmail: "test_yema_qa_teacher@example.com",
    spaceRole: "TEACHER",
    appRole: null,
    universe: "MONDE",
    homeRoute: "/fr/teacher",
    allowedApi: ["/api/teacher/dashboard", "/api/teacher/classes", "/api/teacher/students"],
    forbiddenApi: ["/api/family/dashboard"],
    messaging: { realtime: true, polling: true, audio: true, freeText: true, parentCopy: false },
    authKind: "session",
  },
  {
    id: "coach",
    qaEmail: "test_yema_qa_coach@example.com",
    spaceRole: "STUDENT",
    appRole: "RACINES_COACH",
    universe: "RACINES",
    homeRoute: "/fr/dashboard",
    allowedApi: ["/api/me"],
    forbiddenApi: ["/api/teacher/students"],
    messaging: { realtime: true, polling: true, audio: true, freeText: true, parentCopy: false },
    authKind: "session",
  },
  {
    id: "center_admin",
    qaEmail: "test_yema_qa_center_admin@example.com",
    spaceRole: "CENTER",
    appRole: "CENTER_ADMIN",
    universe: null,
    homeRoute: "/fr/center",
    allowedApi: ["/api/me"],
    forbiddenApi: ["/api/teacher/students", "/api/family/dashboard"],
    messaging: { realtime: true, polling: true, audio: true, freeText: true, parentCopy: false },
    authKind: "session",
  },
  {
    id: "student_monde",
    qaEmail: "test_yema_qa_student_monde@example.com",
    spaceRole: "STUDENT",
    appRole: "LEARNER",
    universe: "MONDE",
    homeRoute: "/fr/dashboard",
    allowedApi: ["/api/me", "/api/me/monde-dashboard"],
    forbiddenApi: ["/api/teacher/students", "/api/family/dashboard"],
    messaging: { realtime: true, polling: true, audio: true, freeText: true, parentCopy: false },
    authKind: "session",
  },
  {
    id: "student_racines",
    qaEmail: "test_yema_qa_student_racines@example.com",
    spaceRole: "STUDENT",
    appRole: "LEARNER",
    universe: "RACINES",
    homeRoute: "/fr/dashboard",
    allowedApi: ["/api/me"],
    forbiddenApi: ["/api/teacher/students", "/api/family/dashboard"],
    messaging: { realtime: true, polling: true, audio: true, freeText: true, parentCopy: false },
    authKind: "session",
  },
  {
    id: "family",
    qaEmail: "test_yema_qa_family@example.com",
    spaceRole: "STUDENT",
    appRole: "PARENT",
    universe: null,
    homeRoute: "/fr/family",
    allowedApi: ["/api/family/dashboard", "/api/family/children"],
    forbiddenApi: ["/api/teacher/students"],
    messaging: { realtime: true, polling: true, audio: true, freeText: true, parentCopy: true },
    authKind: "session",
  },
  {
    id: "child_monde",
    qaEmail: null,
    spaceRole: null,
    appRole: null,
    universe: "MONDE",
    homeRoute: "/fr/family",
    allowedApi: ["/api/child-session"],
    forbiddenApi: ["/api/teacher/students", "/api/family/dashboard"],
    messaging: { realtime: false, polling: true, audio: true, freeText: false, parentCopy: false },
    authKind: "child_pin",
  },
  {
    id: "child_racines",
    qaEmail: null,
    spaceRole: null,
    appRole: null,
    universe: "RACINES",
    homeRoute: "/fr/family",
    allowedApi: ["/api/child-session"],
    forbiddenApi: ["/api/teacher/students", "/api/family/dashboard"],
    messaging: { realtime: false, polling: true, audio: true, freeText: false, parentCopy: false },
    authKind: "child_pin",
  },
];

export function getPersona(id: PersonaId): PersonaEntry {
  const p = PERSONA_MATRIX.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown persona ${id}`);
  return p;
}
