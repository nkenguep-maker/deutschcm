export const PRECONFIRMATION_DRAFT_KEY = "yema.preconfirmation.journey";
export const PRECONFIRMATION_IDENTITY_KEY = "yema.preconfirmation.identity";

const PRECONFIRMATION_VERSION = 1 as const;
const PRECONFIRMATION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

export type PreconfirmationIdentity = {
  version: typeof PRECONFIRMATION_VERSION;
  authUserId: string;
  createdAt: number;
};

export type PreconfirmationJourneyDraft = {
  version: typeof PRECONFIRMATION_VERSION;
  authUserId: string | null;
  createdAt: number;
  persona: string;
  pathwayVariant?: string;
  languageId?: string | null;
};

type JourneySelection = Pick<PreconfirmationJourneyDraft, "persona" | "pathwayVariant" | "languageId">;

function parseJsonObject(serialized: string | null): Record<string, unknown> | null {
  if (!serialized) return null;
  try {
    const value: unknown = JSON.parse(serialized);
    return value && typeof value === "object" && !Array.isArray(value)
      ? value as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

function isFreshTimestamp(createdAt: unknown, now: number): createdAt is number {
  return typeof createdAt === "number"
    && Number.isFinite(createdAt)
    && createdAt >= now - PRECONFIRMATION_MAX_AGE_MS
    && createdAt <= now + MAX_CLOCK_SKEW_MS;
}

export function createPreconfirmationIdentity(
  authUserId: string,
  now = Date.now(),
): PreconfirmationIdentity {
  return { version: PRECONFIRMATION_VERSION, authUserId, createdAt: now };
}

export function parsePreconfirmationIdentity(
  serialized: string | null,
  now = Date.now(),
): PreconfirmationIdentity | null {
  const value = parseJsonObject(serialized);
  if (!value
    || value.version !== PRECONFIRMATION_VERSION
    || typeof value.authUserId !== "string"
    || value.authUserId.length === 0
    || !isFreshTimestamp(value.createdAt, now)) {
    return null;
  }
  return {
    version: PRECONFIRMATION_VERSION,
    authUserId: value.authUserId,
    createdAt: value.createdAt,
  };
}

export function createPreconfirmationJourneyDraft(
  identity: PreconfirmationIdentity | null,
  selection: JourneySelection,
  now = Date.now(),
): PreconfirmationJourneyDraft {
  return {
    version: PRECONFIRMATION_VERSION,
    authUserId: identity?.authUserId ?? null,
    createdAt: now,
    persona: selection.persona,
    ...(selection.pathwayVariant ? { pathwayVariant: selection.pathwayVariant } : {}),
    ...(selection.languageId !== undefined ? { languageId: selection.languageId } : {}),
  };
}

export function parsePreconfirmationJourneyDraft(
  serialized: string | null,
  expectedAuthUserId: string,
  now = Date.now(),
): PreconfirmationJourneyDraft | null {
  const value = parseJsonObject(serialized);
  if (!value
    || value.version !== PRECONFIRMATION_VERSION
    || value.authUserId !== expectedAuthUserId
    || typeof value.persona !== "string"
    || value.persona.length === 0
    || !isFreshTimestamp(value.createdAt, now)
    || (value.pathwayVariant !== undefined && typeof value.pathwayVariant !== "string")
    || (value.languageId !== undefined && value.languageId !== null && typeof value.languageId !== "string")) {
    return null;
  }
  return {
    version: PRECONFIRMATION_VERSION,
    authUserId: expectedAuthUserId,
    createdAt: value.createdAt,
    persona: value.persona,
    ...(typeof value.pathwayVariant === "string" ? { pathwayVariant: value.pathwayVariant } : {}),
    ...(value.languageId === null || typeof value.languageId === "string"
      ? { languageId: value.languageId }
      : {}),
  };
}
