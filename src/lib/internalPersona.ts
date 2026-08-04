export const INTERNAL_TEST_COOKIE_NAME = "yema_internal_persona";
export const INTERNAL_TEST_COOKIE_MAX_AGE = 60 * 60 * 8;

export const INTERNAL_PERSONA_IDS = [
  "super_admin",
  "teacher",
  "coach",
  "center_admin",
  "student_monde",
  "student_racines",
  "family",
  "child_monde",
  "child_racines",
] as const;

export type InternalPersonaId = (typeof INTERNAL_PERSONA_IDS)[number];
export type InternalPersonaSpaceRole = "STUDENT" | "TEACHER" | "CENTER" | "ADMIN";
export type InternalPersonaUniverse = "MONDE" | "RACINES" | null;
export type InternalPersonaAuthKind = "adult_session" | "child_session";
export type InternalPersonaAppRole =
  | "LEARNER"
  | "PARENT"
  | "TEACHER"
  | "CENTER_ADMIN"
  | "YEMA_ADMIN"
  | "RACINES_COACH"
  | null;

export interface InternalPersonaAttributes {
  requiredSpaceRole: InternalPersonaSpaceRole;
  appRole: InternalPersonaAppRole;
  universe: InternalPersonaUniverse;
  destinationPath: string;
  authKind: InternalPersonaAuthKind;
}

export const INTERNAL_PERSONA_ATTRIBUTES = {
  super_admin: {
    requiredSpaceRole: "ADMIN",
    appRole: "YEMA_ADMIN",
    universe: null,
    destinationPath: "/admin",
    authKind: "adult_session",
  },
  teacher: {
    requiredSpaceRole: "TEACHER",
    appRole: "TEACHER",
    universe: "MONDE",
    destinationPath: "/teacher",
    authKind: "adult_session",
  },
  coach: {
    requiredSpaceRole: "STUDENT",
    appRole: "RACINES_COACH",
    universe: "RACINES",
    destinationPath: "/coach/racines",
    authKind: "adult_session",
  },
  center_admin: {
    requiredSpaceRole: "CENTER",
    appRole: "CENTER_ADMIN",
    universe: null,
    destinationPath: "/center",
    authKind: "adult_session",
  },
  student_monde: {
    requiredSpaceRole: "STUDENT",
    appRole: "LEARNER",
    universe: "MONDE",
    destinationPath: "/dashboard",
    authKind: "adult_session",
  },
  student_racines: {
    requiredSpaceRole: "STUDENT",
    appRole: "LEARNER",
    universe: "RACINES",
    destinationPath: "/dashboard",
    authKind: "adult_session",
  },
  family: {
    requiredSpaceRole: "STUDENT",
    appRole: "PARENT",
    universe: null,
    destinationPath: "/family",
    authKind: "adult_session",
  },
  child_monde: {
    requiredSpaceRole: "STUDENT",
    appRole: null,
    universe: "MONDE",
    destinationPath: "/dashboard",
    authKind: "child_session",
  },
  child_racines: {
    requiredSpaceRole: "STUDENT",
    appRole: null,
    universe: "RACINES",
    destinationPath: "/dashboard",
    authKind: "child_session",
  },
} as const satisfies Record<InternalPersonaId, InternalPersonaAttributes>;

const INTERNAL_TEST_OWNER_EMAILS = new Set([
  "nkengue.p@gmail.com",
]);

export function isInternalTesterEmail(email: string | null | undefined): boolean {
  return typeof email === "string" && INTERNAL_TEST_OWNER_EMAILS.has(email.trim().toLowerCase());
}

export function isInternalPersonaId(value: unknown): value is InternalPersonaId {
  return typeof value === "string" && (INTERNAL_PERSONA_IDS as readonly string[]).includes(value);
}

export function getInternalPersonaAttributes(persona: InternalPersonaId): InternalPersonaAttributes {
  return INTERNAL_PERSONA_ATTRIBUTES[persona];
}

export function internalPersonaRequiredSpaceRole(persona: InternalPersonaId): InternalPersonaSpaceRole {
  return INTERNAL_PERSONA_ATTRIBUTES[persona].requiredSpaceRole;
}

export function internalPersonaDestination(persona: InternalPersonaId, locale: string): string {
  const loc = locale === "en" ? "en" : "fr";
  return `/${loc}${INTERNAL_PERSONA_ATTRIBUTES[persona].destinationPath}`;
}

export function resolveInternalPersona(
  rawPersona: unknown,
  email: string | null | undefined,
): { id: InternalPersonaId; attributes: InternalPersonaAttributes } | null {
  if (!isInternalTesterEmail(email) || !isInternalPersonaId(rawPersona)) return null;
  return { id: rawPersona, attributes: getInternalPersonaAttributes(rawPersona) };
}
