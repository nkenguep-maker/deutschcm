import "server-only";
import { prisma } from "@/lib/prisma";

const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_WINDOW_MINUTES = 15;
const PIN_SCOPE_TYPE = "child_session_pin";

function positiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function childPinRateLimitConfig() {
  return {
    maxAttempts: positiveIntEnv("YEMA_CHILD_PIN_MAX_ATTEMPTS", DEFAULT_MAX_ATTEMPTS),
    windowMinutes: positiveIntEnv("YEMA_CHILD_PIN_WINDOW_MINUTES", DEFAULT_WINDOW_MINUTES),
  };
}

function windowStart(): Date {
  const { windowMinutes } = childPinRateLimitConfig();
  return new Date(Date.now() - windowMinutes * 60 * 1000);
}

function failureWhere(actorUserId: string, childProfileId: string) {
  return {
    actorUserId,
    action: "CHILD_ACCESS_DENIED" as const,
    targetType: "ChildProfile",
    targetId: childProfileId,
    scopeType: PIN_SCOPE_TYPE,
    scopeId: childProfileId,
    createdAt: { gte: windowStart() },
  };
}

export async function isChildPinRateLimited(
  actorUserId: string,
  childProfileId: string,
): Promise<boolean> {
  const count = await prisma.auditEvent.count({
    where: failureWhere(actorUserId, childProfileId),
  });
  return count >= childPinRateLimitConfig().maxAttempts;
}

export async function recordInvalidChildPinAttempt(
  actorUserId: string,
  childProfileId: string,
): Promise<boolean> {
  const { maxAttempts } = childPinRateLimitConfig();
  const lockKey = `child-pin:${actorUserId}:${childProfileId}`;

  return prisma.$transaction(async (tx) => {
    // Sérialise les échecs pour un couple parent/enfant afin qu'un burst de
    // requêtes parallèles ne contourne pas le plafond avant les INSERT.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

    const count = await tx.auditEvent.count({
      where: failureWhere(actorUserId, childProfileId),
    });
    if (count >= maxAttempts) return true;

    await tx.auditEvent.create({
      data: {
        actorUserId,
        actorRole: "PARENT",
        action: "CHILD_ACCESS_DENIED",
        targetType: "ChildProfile",
        targetId: childProfileId,
        scopeType: PIN_SCOPE_TYPE,
        scopeId: childProfileId,
        metadata: { reason: "pin_invalid" },
      },
    });

    return count + 1 >= maxAttempts;
  });
}
