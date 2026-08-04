import "server-only";
import { prisma } from "@/lib/prisma";
import type { ConversationType } from "@prisma/client";
import type { MessagingActor } from "./actor";
import { getRule } from "./matrix";
import { broadcastReadStateUpdated } from "./realtimePublisher";

// P4.6-A · services de résolution des conversations.
//
// Toute création passe par le serveur · les participants sont dérivés,
// jamais fournis par le client. Les IDs de conversation restent opaques.

export type ConversationAccessDenial =
  | "actor_not_allowed"
  | "conversation_not_found"
  | "conversation_closed"
  | "missing_required_context";

export interface CreateConversationInput {
  type: ConversationType;
  centerId?: string | null;
  classroomId?: string | null;
  householdId?: string | null;
  assignmentId?: string | null;
  submissionId?: string | null;
  feedbackId?: string | null;
  invoiceId?: string | null;
  metadata?: Record<string, unknown>;
}

export function validateRequiredContexts(input: CreateConversationInput): boolean {
  const rule = getRule(input.type);
  for (const req of rule.requiredContexts) {
    if (!input[req]) return false;
  }
  return true;
}

export async function listInboxForActor(actor: MessagingActor) {
  // Retourne UNIQUEMENT les conversations où l'acteur est participant
  // ACTIF (leftAt = null). Aucune fuite vers d'autres foyers/centres.
  const whereActor = actor.actorType === "USER"
    ? { userId: actor.userId!, leftAt: null }
    : { childProfileId: actor.childProfileId!, leftAt: null };
  const participations = await prisma.messagingConversationParticipant.findMany({
    where: whereActor,
    select: { conversationId: true },
  });
  const conversationIds = participations.map((p) => p.conversationId);
  if (conversationIds.length === 0) return [];
  return prisma.messagingConversation.findMany({
    where: { id: { in: conversationIds } },
    select: {
      id: true,
      type: true,
      status: true,
      lastMessageAt: true,
      createdAt: true,
      // Aucune projection body/message ici. Le compteur unreadCount est
      // dérivé séparément via ConversationReadState (§18 · pas de fanout).
    },
    orderBy: [{ lastMessageAt: "desc" }, { createdAt: "desc" }],
    take: 100,
  });
}

export async function assertConversationAccess(
  actor: MessagingActor,
  conversationId: string,
): Promise<{ ok: true; conversationType: ConversationType } | { ok: false; error: ConversationAccessDenial }> {
  const conv = await prisma.messagingConversation.findUnique({
    where: { id: conversationId },
    select: { id: true, type: true, status: true },
  });
  if (!conv) return { ok: false, error: "conversation_not_found" };

  const whereActor = actor.actorType === "USER"
    ? { conversationId, userId: actor.userId!, leftAt: null }
    : { conversationId, childProfileId: actor.childProfileId!, leftAt: null };
  const participant = await prisma.messagingConversationParticipant.findFirst({
    where: whereActor,
    select: { id: true },
  });
  if (!participant) return { ok: false, error: "actor_not_allowed" };

  return { ok: true, conversationType: conv.type };
}

export async function listConversationMessages(
  actor: MessagingActor,
  conversationId: string,
  opts: { limit?: number; cursor?: string } = {},
) {
  const access = await assertConversationAccess(actor, conversationId);
  if (!access.ok) return { ok: false as const, error: access.error };

  const limit = Math.min(50, Math.max(1, opts.limit ?? 30));
  const rows = await prisma.messagingMessage.findMany({
    where: { conversationId, moderationState: { in: ["ACTIVE", "QUARANTINED"] } },
    orderBy: { createdAt: "desc" },
    take: limit,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
    select: {
      id: true,
      kind: true,
      body: true,
      guidedPhraseId: true,
      cardType: true,
      cardPayload: true,
      audioAssetId: true,
      replyToMessageId: true,
      senderType: true,
      senderUserId: true,
      senderChildProfileId: true,
      createdAt: true,
      publishedAt: true,
      moderationState: true,
    },
  });
  return { ok: true as const, messages: rows };
}

export async function markConversationReadForActor(
  actor: MessagingActor,
  conversationId: string,
  lastReadMessageId: string,
) {
  const access = await assertConversationAccess(actor, conversationId);
  if (!access.ok) return { ok: false as const, error: access.error };

  const commonData = {
    conversationId,
    lastReadMessageId,
    lastReadAt: new Date(),
  };
  if (actor.actorType === "USER") {
    await prisma.messagingConversationReadState.upsert({
      where: { conv_read_user: { conversationId, participantUserId: actor.userId! } },
      update: commonData,
      create: { ...commonData, participantUserId: actor.userId! },
    });
  } else {
    await prisma.messagingConversationReadState.upsert({
      where: { conv_read_child: { conversationId, participantChildProfileId: actor.childProfileId! } },
      update: commonData,
      create: { ...commonData, participantChildProfileId: actor.childProfileId! },
    });
  }

  // P4.6-B.1 · notifier les participants pour recalcul unread/badges ·
  // aucun contenu, uniquement conversationId + timestamp.
  const participants = await prisma.messagingConversationParticipant.findMany({
    where: { conversationId, leftAt: null },
    select: { userId: true, childProfileId: true },
  });
  const userIds = participants.map((p) => p.userId).filter((x): x is string => Boolean(x));
  const childIds = participants.map((p) => p.childProfileId).filter((x): x is string => Boolean(x));
  try {
    await broadcastReadStateUpdated({
      conversationId,
      participantUserIds: userIds,
      participantChildProfileIds: childIds,
    });
  } catch {
    // Best-effort.
  }

  return { ok: true as const };
}
