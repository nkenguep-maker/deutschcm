import "server-only";
import { prisma } from "@/lib/prisma";
import type { ConversationType, MessagingMessageKind, MessagingCardType } from "@prisma/client";
import type { MessagingActor } from "./actor";
import { assertConversationAccess } from "./conversations";
import { getRule, isKindAllowedForActor } from "./matrix";
import { isMessagingAudioEnabled } from "@/lib/flags";

// P4.6-A · envoi de message côté serveur · toute autorité de sender,
// participant et content vient du serveur.

export type SendMessageDenial =
  | "actor_not_allowed"
  | "conversation_not_found"
  | "conversation_closed"
  | "missing_required_context"
  | "kind_not_allowed"
  | "text_required_missing"
  | "child_cannot_send_text"
  | "guided_phrase_missing_or_inactive"
  | "guided_phrase_wrong_scope"
  | "audio_disabled"
  | "audio_not_ready"
  | "card_type_missing_or_invalid"
  | "replies_disabled"
  | "duplicate_idempotency";

export interface SendMessageInput {
  conversationId: string;
  kind: MessagingMessageKind;
  body?: string | null;
  guidedPhraseId?: string | null;
  audioAssetId?: string | null;
  cardType?: MessagingCardType | null;
  cardPayload?: Record<string, unknown> | null;
  replyToMessageId?: string | null;
  idempotencyKey?: string | null;
}

export async function assertCanSendMessage(
  actor: MessagingActor,
  conversationType: ConversationType,
  input: SendMessageInput,
): Promise<{ ok: true } | { ok: false; error: SendMessageDenial }> {
  const rule = getRule(conversationType);

  // Enfant · TEXT libre refusé server-side, quelle que soit l'UI.
  if (actor.actorType === "CHILD_PROFILE" && input.kind === "TEXT") {
    return { ok: false, error: "child_cannot_send_text" };
  }

  if (!isKindAllowedForActor(conversationType, actor.actorType, input.kind)) {
    return { ok: false, error: "kind_not_allowed" };
  }

  if (input.replyToMessageId && !rule.supportsReplies) {
    return { ok: false, error: "replies_disabled" };
  }

  switch (input.kind) {
    case "TEXT": {
      if (!input.body || input.body.trim().length === 0) {
        return { ok: false, error: "text_required_missing" };
      }
      return { ok: true };
    }
    case "GUIDED_PHRASE": {
      if (!input.guidedPhraseId) {
        return { ok: false, error: "guided_phrase_missing_or_inactive" };
      }
      const phrase = await prisma.messagingGuidedPhrase.findUnique({
        where: { id: input.guidedPhraseId },
        select: { isActive: true, conversationType: true },
      });
      if (!phrase || !phrase.isActive) {
        return { ok: false, error: "guided_phrase_missing_or_inactive" };
      }
      if (phrase.conversationType !== conversationType) {
        return { ok: false, error: "guided_phrase_wrong_scope" };
      }
      return { ok: true };
    }
    case "AUDIO": {
      if (!isMessagingAudioEnabled()) {
        return { ok: false, error: "audio_disabled" };
      }
      if (!input.audioAssetId) {
        return { ok: false, error: "audio_not_ready" };
      }
      const asset = await prisma.messagingAudioAsset.findUnique({
        where: { id: input.audioAssetId },
        select: { status: true },
      });
      if (!asset || asset.status !== "READY") {
        return { ok: false, error: "audio_not_ready" };
      }
      return { ok: true };
    }
    case "CARD": {
      if (!input.cardType) {
        return { ok: false, error: "card_type_missing_or_invalid" };
      }
      return { ok: true };
    }
    case "SYSTEM": {
      // SYSTEM ne peut être créé que server-to-server (jamais depuis un
      // handler user-facing). Le service caller doit passer par une API
      // interne. On refuse ici par défaut.
      return { ok: false, error: "kind_not_allowed" };
    }
  }
}

export async function sendMessage(
  actor: MessagingActor,
  input: SendMessageInput,
): Promise<{ ok: true; messageId: string } | { ok: false; error: SendMessageDenial }> {
  const access = await assertConversationAccess(actor, input.conversationId);
  if (!access.ok) return { ok: false, error: access.error };

  const gate = await assertCanSendMessage(actor, access.conversationType, input);
  if (!gate.ok) return gate;

  // Idempotence : si la clé existe déjà pour cette conversation, on
  // retourne le message existant (comportement upsert-like).
  if (input.idempotencyKey) {
    const existing = await prisma.messagingMessage.findUnique({
      where: {
        conv_idem_unique: {
          conversationId: input.conversationId,
          idempotencyKey: input.idempotencyKey,
        },
      },
      select: { id: true },
    });
    if (existing) return { ok: true, messageId: existing.id };
  }

  // Résolution du body pour GUIDED_PHRASE : on récupère le texte
  // canonique côté serveur, jamais le body libre client.
  let resolvedBody: string | null = input.body ?? null;
  if (input.kind === "GUIDED_PHRASE" && input.guidedPhraseId) {
    const phrase = await prisma.messagingGuidedPhrase.findUnique({
      where: { id: input.guidedPhraseId },
      select: { text: true },
    });
    resolvedBody = phrase?.text ?? null;
  }

  const now = new Date();
  const senderColumn = actor.actorType === "USER"
    ? { senderType: "USER" as const, senderUserId: actor.userId! }
    : { senderType: "CHILD_PROFILE" as const, senderChildProfileId: actor.childProfileId! };

  const created = await prisma.messagingMessage.create({
    data: {
      conversationId: input.conversationId,
      kind: input.kind,
      body: resolvedBody,
      guidedPhraseId: input.guidedPhraseId ?? null,
      audioAssetId: input.audioAssetId ?? null,
      cardType: input.cardType ?? null,
      cardPayload: input.cardPayload as never,
      replyToMessageId: input.replyToMessageId ?? null,
      idempotencyKey: input.idempotencyKey ?? null,
      publishedAt: now,
      ...senderColumn,
    },
    select: { id: true },
  });

  // Copie parentale (Lot 6 · brief §12) : quand un enfant envoie, on
  // crée un receipt PARENT_COPY visible pour le/les GUARDIAN_OBSERVER
  // actifs de la conversation. Pas de duplication du Message.
  if (actor.actorType === "CHILD_PROFILE") {
    const observers = await prisma.messagingConversationParticipant.findMany({
      where: {
        conversationId: input.conversationId,
        participantRole: "GUARDIAN_OBSERVER",
        leftAt: null,
      },
      select: { userId: true },
    });
    if (observers.length > 0) {
      await prisma.messagingMessageReceipt.createMany({
        data: observers
          .filter((o) => o.userId)
          .map((o) => ({
            messageId: created.id,
            kind: "PARENT_COPY" as const,
            participantUserId: o.userId!,
          })),
      });
    }
  }

  // Bump lastMessageAt sur la conversation (sans return · fire-and-forget
  // ne pose pas de problème d'idempotence).
  await prisma.messagingConversation.update({
    where: { id: input.conversationId },
    data: { lastMessageAt: now },
  });

  return { ok: true, messageId: created.id };
}
