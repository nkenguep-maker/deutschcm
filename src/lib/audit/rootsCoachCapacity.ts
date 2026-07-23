// P4.4 closure · émission idempotente ROOTS_COACH_CAPACITY_REACHED.
//
// Contrat · à appeler UNE seule fois par requête refusée, APRÈS que
// `withSerializableRetry` a épuisé ses tentatives ou après l'échec métier
// définitif (CapacityError). Écrit dans une transaction dédiée hors tx
// métier · si l'écriture échoue, on log et on n'affecte pas la réponse.
//
// Metadata · `attemptedCount` désigne explicitement le compte qui aurait
// été atteint si la requête avait abouti (ex · 21 pour un ajout enfant
// alors que le budget est de 20). Ce n'est PAS l'état persisté.

import { CapacityError } from "@/lib/circles/capacity";
import { writeAuditEvent } from "@/lib/audit/events";

type CapacityCaller =
  | "assignCoach"
  | "addChildToCircle"
  | "replaceCoach";

export async function emitCoachCapacityAudit(input: {
  error: unknown;
  actorUserId: string | null;
  actorRole: string | null;
  circleId: string;
  coachUserId: string;
  routeAction: CapacityCaller;
}): Promise<void> {
  const { error, actorUserId, actorRole, circleId, coachUserId, routeAction } = input;
  if (!(error instanceof CapacityError)) return;
  if (
    error.code !== "coach_circle_capacity_reached" &&
    error.code !== "coach_profile_capacity_reached"
  ) {
    return;
  }
  const dim = (error.detail?.dimension as string | undefined) ?? null;
  const limit = (error.detail?.limit as number | undefined) ?? null;
  const attemptedCount = (error.detail?.current as number | undefined) ?? null;
  try {
    await writeAuditEvent({
      actorUserId,
      actorRole,
      action: "ROOTS_COACH_CAPACITY_REACHED",
      targetType: "RootsCoachAssignment",
      targetId: coachUserId,
      scopeType: "Circle",
      scopeId: circleId,
      metadata: {
        reasonCode: "capacity_reached",
        capacityType: dim,
        limit,
        attemptedCount,
        routeAction,
      },
    });
  } catch (err) {
    console.warn(
      "[audit] ROOTS_COACH_CAPACITY_REACHED write failed:",
      (err as Error).message,
    );
  }
}
