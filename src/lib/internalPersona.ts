export const INTERNAL_TEST_COOKIE_NAME = "yema_internal_persona";
export const INTERNAL_TEST_COOKIE_MAX_AGE = 60 * 60 * 8;

const INTERNAL_TEST_P1_REF = "kzzagbojjkivdzzcrmxn";
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
export type InternalPersonaAuthKind = "session" | "child_session";
export type InternalPersonaAppRole =
  | "LEARNER"
  | "PARENT"
  | "TEACHER"
  | "CENTER_ADMIN"
  | "YEMA_ADMIN"
  | "RACINES_COACH"
  | null;

export interface InternalPersonaAttributes {
  id: InternalPersonaId;
  spaceRole: InternalPersonaSpaceRole;
  /** Compatibility alias used by the proxy's stale-session overlay. */
  requiredSpaceRole: InternalPersonaSpaceRole;
  appRole: InternalPersonaAppRole;
  universe: InternalPersonaUniverse;
  destinationPath: "/admin" | "/teacher" | "/coach/racines" | "/center" | "/dashboard" | "/family";
  authKind: InternalPersonaAuthKind;
  requiredAttributes: readonly string[];
}

export const INTERNAL_PERSONA_ATTRIBUTES = {
  super_admin: {
    id: "super_admin",
    spaceRole: "ADMIN",
    requiredSpaceRole: "ADMIN",
    appRole: "YEMA_ADMIN",
    universe: null,
    destinationPath: "/admin",
    authKind: "session",
    requiredAttributes: ["ADMIN", "YEMA_ADMIN", "global admin dashboard"],
  },
  teacher: {
    id: "teacher",
    spaceRole: "TEACHER",
    requiredSpaceRole: "TEACHER",
    appRole: "TEACHER",
    universe: "MONDE",
    destinationPath: "/teacher",
    authKind: "session",
    requiredAttributes: ["TEACHER", "verified teacher", "center binding", "DEUTSCH"],
  },
  coach: {
    id: "coach",
    spaceRole: "STUDENT",
    requiredSpaceRole: "STUDENT",
    appRole: "RACINES_COACH",
    universe: "RACINES",
    destinationPath: "/coach/racines",
    authKind: "session",
    requiredAttributes: ["RACINES_COACH", "RACINES", "coach workspace"],
  },
  center_admin: {
    id: "center_admin",
    spaceRole: "CENTER",
    requiredSpaceRole: "CENTER",
    appRole: "CENTER_ADMIN",
    universe: null,
    destinationPath: "/center",
    authKind: "session",
    requiredAttributes: ["CENTER", "CENTER_ADMIN", "verified center binding"],
  },
  student_monde: {
    id: "student_monde",
    spaceRole: "STUDENT",
    requiredSpaceRole: "STUDENT",
    appRole: "LEARNER",
    universe: "MONDE",
    destinationPath: "/dashboard",
    authKind: "session",
    requiredAttributes: ["STUDENT", "LEARNER", "MONDE", "DEUTSCH", "A1"],
  },
  student_racines: {
    id: "student_racines",
    spaceRole: "STUDENT",
    requiredSpaceRole: "STUDENT",
    appRole: "LEARNER",
    universe: "RACINES",
    destinationPath: "/dashboard",
    authKind: "session",
    requiredAttributes: ["STUDENT", "LEARNER", "RACINES", "WOLOF", "E1"],
  },
  family: {
    id: "family",
    spaceRole: "STUDENT",
    requiredSpaceRole: "STUDENT",
    appRole: "PARENT",
    universe: null,
    destinationPath: "/family",
    authKind: "session",
    requiredAttributes: ["PARENT", "active household", "Monde child seat", "Racines family seats"],
  },
  child_monde: {
    id: "child_monde",
    spaceRole: "STUDENT",
    requiredSpaceRole: "STUDENT",
    appRole: null,
    universe: "MONDE",
    destinationPath: "/dashboard",
    authKind: "child_session",
    requiredAttributes: ["signed child session", "MONDE child", "DEUTSCH", "M1"],
  },
  child_racines: {
    id: "child_racines",
    spaceRole: "STUDENT",
    requiredSpaceRole: "STUDENT",
    appRole: null,
    universe: "RACINES",
    destinationPath: "/dashboard",
    authKind: "child_session",
    requiredAttributes: ["signed child session", "RACINES child", "WOLOF", "E1"],
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

export const getInternalPersonaContract = getInternalPersonaAttributes;

export function internalPersonaRequiredSpaceRole(persona: InternalPersonaId): InternalPersonaSpaceRole {
  return INTERNAL_PERSONA_ATTRIBUTES[persona].spaceRole;
}

export function internalPersonaDestination(persona: InternalPersonaId, locale: string): string {
  const loc = locale === "en" ? "en" : "fr";
  return `/${loc}${INTERNAL_PERSONA_ATTRIBUTES[persona].destinationPath}`;
}

function isCanonicalP1SupabaseUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    return (
      url.protocol === "https:" &&
      url.hostname === `${INTERNAL_TEST_P1_REF}.supabase.co` &&
      url.port === "" &&
      url.username === "" &&
      url.password === "" &&
      url.pathname === "/"
    );
  } catch {
    return false;
  }
}

/**
 * A persona cookie is an authorization overlay. Even a historically valid
 * cookie must become inert outside the canonical P-1 environment.
 */
export function isInternalPersonaRuntimeAllowed(): boolean {
  if (process.env.VERCEL_ENV === "production") return false;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return (
    isCanonicalP1SupabaseUrl(supabaseUrl) &&
    (process.env.VERCEL_ENV === "preview" || process.env.P1_BASELINE_CONFIRMED_NOT_PRODUCTION === "true")
  );
}

export function resolveInternalPersona(
  rawPersona: unknown,
  email: string | null | undefined,
): { id: InternalPersonaId; attributes: InternalPersonaAttributes } | null {
  if (!isInternalPersonaRuntimeAllowed()) return null;
  if (!isInternalTesterEmail(email) || !isInternalPersonaId(rawPersona)) return null;
  return { id: rawPersona, attributes: getInternalPersonaAttributes(rawPersona) };
}
