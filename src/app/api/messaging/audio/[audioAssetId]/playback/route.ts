// P4.6-C.1 · POST /api/messaging/audio/[audioAssetId]/playback
//
// Retourne une URL signée courte (TTL ≤ 300s) pour lire l'audio.
// POST (pas GET) pour éviter cache navigateur + fuite journaux d'URL.
//
// Ordre strict (brief §7) ·
//   1. feature flag
//   2. actor
//   3. session
//   4. CSRF/origin
//   5. load AudioAsset + Message + Conversation
//   6. status READY
//   7. autorisation de lire (participant User actif OU child in conv
//      OU GUARDIAN_OBSERVER OU Super Admin support only)
//   8. génération URL signée
//   9. no-store

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isMessagingAudioEnabled, isMessagingEnabled } from "@/lib/flags";
import { resolveMessagingActor } from "@/lib/messaging/actor";
import { prisma } from "@/lib/prisma";
import { createPlaybackSignedUrl } from "@/lib/messaging/audio/storage";
import { writeAuditEvent } from "@/lib/audit/events";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function notFound() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
function forbidden(code: string) {
  const res = NextResponse.json({ error: "Forbidden", code }, { status: 403 });
  res.headers.set("Cache-Control", "private, no-store");
  res.headers.set("Pragma", "no-cache");
  return res;
}
function gone() {
  return NextResponse.json({ error: "Gone" }, { status: 410 });
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ audioAssetId: string }> },
) {
  // 1. feature flag
  if (!isMessagingEnabled() || !isMessagingAudioEnabled()) return notFound();

  // 2. actor
  const actor = await resolveMessagingActor();
  if (!actor) return notFound();

  // 4. CSRF/origin
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin && host && !origin.endsWith(host)) return forbidden("origin_mismatch");

  const { audioAssetId } = await ctx.params;

  // 5. Load asset + message + participants d'un coup pour minimiser round-trips.
  const asset = await prisma.messagingAudioAsset.findUnique({
    where: { id: audioAssetId },
    select: {
      id: true,
      status: true,
      storageKey: true,
      mimeType: true,
      durationMs: true,
      conversationId: true,
      deletedAt: true,
      messages: {
        select: { id: true, conversationId: true, senderUserId: true, senderChildProfileId: true },
        take: 1,
      },
    },
  });
  if (!asset || asset.deletedAt) return notFound();
  const message = asset.messages[0];
  if (!message) return notFound();

  // 6. status READY (rien d'autre ne donne accès)
  if (asset.status !== "READY") {
    if (asset.status === "DELETED" || asset.status === "EXPIRED") return gone();
    return forbidden("not_ready");
  }
  if (!asset.storageKey) return forbidden("no_storage_key");

  const conversationId = message.conversationId;

  // 7. Autorisation · reproduit la logique participant + GUARDIAN_OBSERVER
  // + Super Admin support-only. On charge la conversation pour le type.
  const conv = await prisma.messagingConversation.findUnique({
    where: { id: conversationId },
    select: { id: true, type: true },
  });
  if (!conv) return notFound();

  // Recherche du participant actif de l'acteur pour cette conversation.
  const whereActor = actor.actorType === "USER"
    ? { conversationId, userId: actor.userId!, leftAt: null }
    : { conversationId, childProfileId: actor.childProfileId!, leftAt: null };
  const participant = await prisma.messagingConversationParticipant.findFirst({
    where: whereActor,
    select: { id: true, participantRole: true },
  });

  if (!participant) {
    await writeAuditEvent({
      actorUserId: actor.actorType === "USER" ? actor.userId! : null,
      action: "MESSAGE_AUDIO_ACCESS_DENIED",
      targetType: "MessagingAudioAsset",
      targetId: audioAssetId,
      scopeType: "conversation_type",
      scopeId: conv.type,
      metadata: { reasonCode: "not_participant", actorType: actor.actorType },
    });
    return notFound();
  }

  // Super Admin · autorisé UNIQUEMENT sur CENTER_PLATFORM_SUPPORT / PLATFORM_BROADCAST
  // où il est déjà participant · déjà couvert par la vérification participant.
  // On refuse explicitement Super Admin sur fils pédagogiques (défense en
  // profondeur · même s'il était mal ajouté comme participant).
  if (actor.persona === "super_admin") {
    const allowed: readonly string[] = ["CENTER_PLATFORM_SUPPORT", "PLATFORM_BROADCAST"];
    if (!allowed.includes(conv.type)) {
      await writeAuditEvent({
        actorUserId: actor.userId!,
        action: "MESSAGE_AUDIO_ACCESS_DENIED",
        targetType: "MessagingAudioAsset",
        targetId: audioAssetId,
        scopeType: "conversation_type",
        scopeId: conv.type,
        metadata: { reasonCode: "super_admin_pedagogical_forbidden" },
      });
      return forbidden("super_admin_pedagogical_forbidden");
    }
  }

  // 8. URL signée courte (TTL max 300s)
  const signed = await createPlaybackSignedUrl({ storageKey: asset.storageKey });
  if (!signed.ok) {
    return NextResponse.json({ error: "signing_failed" }, { status: 502 });
  }

  await writeAuditEvent({
    actorUserId: actor.actorType === "USER" ? actor.userId! : null,
    action: "MESSAGE_AUDIO_PLAYBACK_GRANTED",
    targetType: "MessagingAudioAsset",
    targetId: audioAssetId,
    scopeType: "conversation_type",
    scopeId: conv.type,
    metadata: {
      actorType: actor.actorType,
      participantRole: participant.participantRole,
    },
  });

  // 9. no-store
  const res = NextResponse.json({
    url: signed.data.url,
    expiresAt: signed.data.expiresAt,
    durationMs: asset.durationMs ?? 0,
    mimeType: asset.mimeType ?? null,
  });
  res.headers.set("Cache-Control", "private, no-store");
  res.headers.set("Pragma", "no-cache");
  return res;
}
