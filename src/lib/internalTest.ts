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

const INTERNAL_TEST_OWNER_EMAILS = new Set([
  "nkengue.p@gmail.com",
]);

const PERSONAS: readonly InternalPersonaId[] = [
  "super_admin",
  "teacher",
  "coach",
  "center_admin",
  "student_monde",
  "student_racines",
  "family",
  "child_monde",
  "child_racines",
];

export function isInternalTesterEmail(email: string | null | undefined): boolean {
  return typeof email === "string" && INTERNAL_TEST_OWNER_EMAILS.has(email.trim().toLowerCase());
}

export function isInternalPersonaId(value: unknown): value is InternalPersonaId {
  return typeof value === "string" && (PERSONAS as readonly string[]).includes(value);
}

export function internalPersonaDestination(persona: InternalPersonaId, locale: string): string {
  const loc = locale === "en" ? "en" : "fr";
  switch (persona) {
    case "super_admin":
      return `/${loc}/admin`;
    case "teacher":
      return `/${loc}/teacher`;
    case "coach":
      return `/${loc}/coach/racines`;
    case "center_admin":
      return `/${loc}/center`;
    case "family":
      return `/${loc}/family`;
    case "student_monde":
    case "student_racines":
    case "child_monde":
    case "child_racines":
      return `/${loc}/dashboard`;
  }
}
