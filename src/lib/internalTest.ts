import "server-only";

export const INTERNAL_TEST_COOKIE_NAME = "yema_internal_persona";
export const INTERNAL_TEST_COOKIE_MAX_AGE = 60 * 60 * 8;

export type InternalPersonaId =
  | "super_admin"
  | "teacher"
  | "coach"
  | "center_admin"
  | "student_monde"
  | "student_racines"
  | "family"
  | "child_monde"
  | "child_racines";

export type InternalSpaceRole = "STUDENT" | "TEACHER" | "CENTER" | "ADMIN";
export type InternalUniverse = "MONDE" | "RACINES" | null;
export type InternalAuthKind = "session" | "child_session";

export interface InternalPersonaContract {
  id: InternalPersonaId;
  spaceRole: InternalSpaceRole;
  appRole: "YEMA_ADMIN" | "TEACHER" | "RACINES_COACH" | "CENTER_ADMIN" | "LEARNER" | "PARENT" | null;
  universe: InternalUniverse;
  authKind: InternalAuthKind;
  destinationPath: "/admin" | "/teacher" | "/coach/racines" | "/center" | "/dashboard" | "/family";
  requiredAttributes: readonly string[];
}

const INTERNAL_TEST_OWNER_EMAILS = new Set([
  "nkengue.p@gmail.com",
]);

export const INTERNAL_PERSONA_CONTRACTS: Record<InternalPersonaId, InternalPersonaContract> = {
  super_admin: {
    id: "super_admin",
    spaceRole: "ADMIN",
    appRole: "YEMA_ADMIN",
    universe: null,
    authKind: "session",
    destinationPath: "/admin",
    requiredAttributes: ["ADMIN role", "YEMA_ADMIN app role", "global admin dashboard"],
  },
  teacher: {
    id: "teacher",
    spaceRole: "TEACHER",
    appRole: "TEACHER",
    universe: "MONDE",
    authKind: "session",
    destinationPath: "/teacher",
    requiredAttributes: ["TEACHER role", "verified Teacher binding", "center binding", "DEUTSCH language"],
  },
  coach: {
    id: "coach",
    spaceRole: "STUDENT",
    appRole: "RACINES_COACH",
    universe: "RACINES",
    authKind: "session",
    destinationPath: "/coach/racines",
    requiredAttributes: ["RACINES_COACH app role", "Racines workspace", "coach scope"],
  },
  center_admin: {
    id: "center_admin",
    spaceRole: "CENTER",
    appRole: "CENTER_ADMIN",
    universe: null,
    authKind: "session",
    destinationPath: "/center",
    requiredAttributes: ["CENTER role", "CENTER_ADMIN app role", "verified center binding"],
  },
  student_monde: {
    id: "student_monde",
    spaceRole: "STUDENT",
    appRole: "LEARNER",
    universe: "MONDE",
    authKind: "session",
    destinationPath: "/dashboard",
    requiredAttributes: ["STUDENT role", "LEARNER app role", "MONDE path", "DEUTSCH", "A1"],
  },
  student_racines: {
    id: "student_racines",
    spaceRole: "STUDENT",
    appRole: "LEARNER",
    universe: "RACINES",
    authKind: "session",
    destinationPath: "/dashboard",
    requiredAttributes: ["STUDENT role", "LEARNER app role", "RACINES path", "WOLOF", "E1"],
  },
  family: {
    id: "family",
    spaceRole: "STUDENT",
    appRole: "PARENT",
    universe: null,
    authKind: "session",
    destinationPath: "/family",
    requiredAttributes: ["PARENT app role", "active household", "Monde child seat", "Racines family seats"],
  },
  child_monde: {
    id: "child_monde",
    spaceRole: "STUDENT",
    appRole: null,
    universe: "MONDE",
    authKind: "child_session",
    destinationPath: "/dashboard",
    requiredAttributes: ["signed child session", "MONDE child profile", "DEUTSCH", "M1"],
  },
  child_racines: {
    id: "child_racines",
    spaceRole: "STUDENT",
    appRole: null,
    universe: "RACINES",
    authKind: "child_session",
    destinationPath: "/dashboard",
    requiredAttributes: ["signed child session", "RACINES child profile", "WOLOF", "E1"],
  },
};

const PERSONAS = Object.keys(INTERNAL_PERSONA_CONTRACTS) as InternalPersonaId[];

export function isInternalTesterEmail(email: string | null | undefined): boolean {
  return typeof email === "string" && INTERNAL_TEST_OWNER_EMAILS.has(email.trim().toLowerCase());
}

export function isInternalPersonaId(value: unknown): value is InternalPersonaId {
  return typeof value === "string" && (PERSONAS as readonly string[]).includes(value);
}

export function getInternalPersonaContract(persona: InternalPersonaId): InternalPersonaContract {
  return INTERNAL_PERSONA_CONTRACTS[persona];
}

export function internalPersonaDestination(persona: InternalPersonaId, locale: string): string {
  const loc = locale === "en" ? "en" : "fr";
  return `/${loc}${getInternalPersonaContract(persona).destinationPath}`;
}
