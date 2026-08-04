import "server-only";
import type { ConversationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { MessagingActor } from "./actor";
import type { MessagingFilter } from "./filters";

// P4.6-B · inbox enrichie · preview last message + unread count dérivé.
//
// Le compteur unread est calculé côté serveur depuis ConversationReadState.
// Le client ne fournit JAMAIS de valeur de compteur.

export interface InboxRow {
  id: string;
  type: ConversationType;
  status: string;
  lastMessageAt: string | null;
  lastPreview: {
    kind: string;
    body: string | null;
    senderType: string;
    createdAt: string;
  } | null;
  unreadCount: number;
}

export async function listInboxRowsForActor(
  actor: MessagingActor,
  filter?: MessagingFilter,
): Promise<InboxRow[]> {
  const whereActor = actor.actorType === "USER"
    ? { userId: actor.userId!, leftAt: null }
    : { childProfileId: actor.childProfileId!, leftAt: null };
  const participations = await prisma.messagingConversationParticipant.findMany({
    where: whereActor,
    select: { conversationId: true },
  });
  const conversationIds = participations.map((p) => p.conversationId);
  if (conversationIds.length === 0) return [];

  const whereConv: {
    id: { in: string[] };
    type?: { in: ConversationType[] };
  } = { id: { in: conversationIds } };
  if (filter && filter.conversationTypes.length > 0) {
    whereConv.type = { in: [...filter.conversationTypes] };
  }

  const conversations = await prisma.messagingConversation.findMany({
    where: whereConv,
    select: {
      id: true,
      type: true,
      status: true,
      lastMessageAt: true,
      createdAt: true,
    },
    orderBy: [{ lastMessageAt: "desc" }, { createdAt: "desc" }],
    take: 200,
  });

  const rows: InboxRow[] = [];
  for (const conv of conversations) {
    // Dernier message · preview minimal (kind + body tronqué + author type).
    const last = await prisma.messagingMessage.findFirst({
      where: { conversationId: conv.id, moderationState: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      select: {
        kind: true,
        body: true,
        senderType: true,
        senderUserId: true,
        createdAt: true,
      },
    });

    // Unread count : messages APRÈS lastReadAt de ce participant qui ne
    // sont pas ses propres messages.
    const readStateWhere = actor.actorType === "USER"
      ? { conversationId: conv.id, participantUserId: actor.userId! }
      : { conversationId: conv.id, participantChildProfileId: actor.childProfileId! };
    const readState = await prisma.messagingConversationReadState.findFirst({
      where: readStateWhere,
      select: { lastReadAt: true },
    });
    const readCutoff = readState?.lastReadAt ?? new Date(0);
    const excludeOwn = actor.actorType === "USER"
      ? { NOT: { senderUserId: actor.userId! } }
      : { NOT: { senderChildProfileId: actor.childProfileId! } };
    const unreadCount = await prisma.messagingMessage.count({
      where: {
        conversationId: conv.id,
        moderationState: "ACTIVE",
        createdAt: { gt: readCutoff },
        ...excludeOwn,
      },
    });

    // Filtre audio · exclut les conversations sans message AUDIO récent.
    if (filter?.audioOnly) {
      const hasAudio = await prisma.messagingMessage.findFirst({
        where: { conversationId: conv.id, kind: "AUDIO" },
        select: { id: true },
      });
      if (!hasAudio) continue;
    }

    // Filtre unread · skip si zéro.
    if (filter?.unreadOnly && unreadCount === 0) continue;

    // Body preview tronqué (aucun accès sensible côté client · déjà
    // fait par assertConversationAccess plus tôt via participant).
    let previewBody: string | null = null;
    if (last?.body) previewBody = last.body.length > 140 ? `${last.body.slice(0, 137)}...` : last.body;

    rows.push({
      id: conv.id,
      type: conv.type,
      status: String(conv.status),
      lastMessageAt: conv.lastMessageAt?.toISOString() ?? null,
      lastPreview: last
        ? {
            kind: String(last.kind),
            body: previewBody,
            senderType: String(last.senderType),
            createdAt: last.createdAt.toISOString(),
          }
        : null,
      unreadCount,
    });
  }
  return rows;
}

// Résumé compteur unread global par persona (pour badge dashboard).
export async function getUnreadMessagingSummaryForActor(actor: MessagingActor): Promise<{
  totalUnread: number;
  conversationsWithUnread: number;
}> {
  const rows = await listInboxRowsForActor(actor);
  let total = 0;
  let convs = 0;
  for (const r of rows) {
    if (r.unreadCount > 0) {
      total += r.unreadCount;
      convs += 1;
    }
  }
  return { totalUnread: total, conversationsWithUnread: convs };
}
