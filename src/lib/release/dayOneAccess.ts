import "server-only";

export const DAY_ONE_ACCESS_MODEL = "FREE_DISCOVERY_PAID_FULL_ACCESS" as const;

export const FREE_DISCOVERY_RESOURCES = {
  MONDE: new Set(["de-a1-u1-l1"]),
  RACINES: new Set(["bas-e1-u1-l1"]),
} as const;

export function isFreeDiscoveryCourseResource(
  universe: "MONDE" | "RACINES",
  resourceId: string | undefined,
): boolean {
  if (!resourceId) return false;
  return FREE_DISCOVERY_RESOURCES[universe].has(resourceId);
}
