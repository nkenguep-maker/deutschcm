import "server-only";
import { prisma } from "@/lib/prisma";
import type { MessagingActor } from "./actor";

const MESSAGE_WINDOW_MS = 5 * 60 * 1000;
const DEFAULT_USER_MESSAGES_PER_WINDOW = 60;
const DEFAULT_CHILD_MESSAGES_PER_WINDOW = 30;

function positiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function messagingRateLimits() {
  return {
    userMessagesPerFiveMinutes: positiveIntEnv(
      "YEMA_MESSAGING_USER_MESSAGES_PER_5_MINUTES",
      DEFAULT_USER_MESSAGES_PER_WINDOW
    ),
    childMessagesPerFiveMinutes: positiveIntEnv(
      "YEMA_MESSAGING_CHILD_MESSAGES_PER_5_MINUTES",
      DEFAULT_CHILD_MESSAGES_PER_WINDOW
    ),
  };
}

export async function hasReachedMessageSendQuota(actor: MessagingActor): Promise<boolean> {
  const since = new Date(Date.now() - MESSAGE_WINDOW_MS);
  const limits = messagingRateLimits();

  if (actor.actorType === "USER") {
    const count = await prisma.messagingMessage.count({
      where: { senderUserId: actor.userId!, createdAt: { gte: since } },
    });
    return count >= limits.userMessagesPerFiveMinutes;
  }

  const count = await prisma.messagingMessage.count({
    where: { senderChildProfileId: actor.childProfileId!, createdAt: { gte: since } },
  });
  return count >= limits.childMessagesPerFiveMinutes;
}
