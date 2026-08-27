import "server-only";
import prisma from "@/lib/prisma";

const ONE_HOUR_MS = 60 * 60 * 1000;
const DEFAULT_JOIN_REQUESTS_PER_HOUR = 10;
const DEFAULT_GROUP_INVITES_PER_HOUR = 20;

function positiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function socialRateLimits() {
  return {
    joinRequestsPerHour: positiveIntEnv(
      "YEMA_SOCIAL_JOIN_REQUESTS_PER_HOUR",
      DEFAULT_JOIN_REQUESTS_PER_HOUR
    ),
    groupInvitesPerHour: positiveIntEnv(
      "YEMA_SOCIAL_GROUP_INVITES_PER_HOUR",
      DEFAULT_GROUP_INVITES_PER_HOUR
    ),
  };
}

export async function hasReachedJoinRequestQuota(userId: string): Promise<boolean> {
  const since = new Date(Date.now() - ONE_HOUR_MS);
  const count = await prisma.classJoinRequest.count({
    where: { fromUserId: userId, createdAt: { gte: since } },
  });
  return count >= socialRateLimits().joinRequestsPerHour;
}

export async function hasReachedGroupInviteQuota(userId: string): Promise<boolean> {
  const since = new Date(Date.now() - ONE_HOUR_MS);
  const count = await prisma.studyGroupInvite.count({
    where: { fromUserId: userId, createdAt: { gte: since } },
  });
  return count >= socialRateLimits().groupInvitesPerHour;
}
