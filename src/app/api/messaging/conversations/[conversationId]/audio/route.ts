// P4.6-C.1 · POST /api/messaging/conversations/[conversationId]/audio
//
// Upload audio privé asynchrone. Ordre strict (brief §6) ·
//   1. feature flag
//   2. actor
//   3. session
//   4. CSRF/origin
//   5. conversation access
//   6. conversation type (via matrix)
//   7. règles enfant (TEXT libre refusé côté matrix)
//   8. quota horaire
//   9. lecture bornée du fichier
//  10. validation audio (magic + duration)
//  11. id + storageKey
//  12. upload privé
//  13. transaction Prisma (asset READY + message + receipts)
//  14. PARENT_COPY si enfant
//  15. AuditEvent MESSAGE_AUDIO_CREATED
//  16. broadcast Realtime après commit uniquement
//  17. réponse minimale (aucune URL signée)

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isMessagingAudioEnabled, isMessagingEnabled } from "@/lib/flags";
import { resolveMessagingActor } from "@/lib/messaging/actor";
import { assertConversationAccess } from "@/lib/messaging/conversations";
import { isKindAllowedForActor } from "@/lib/messaging/matrix";
import { prisma } from "@/lib/prisma";
import { getRetentionDays, limitsForActor } from "@/lib/messaging/audio/limits";
import { validateAudioBuffer } from "@/lib/messaging/audio/validation";
import { hasReachedAudioUploadQuota } from "@/lib/messaging/audio/rateLimit";
import {
  buildStorageKey,
  deleteAudioObject,
  uploadAudioObject,
} from "@/lib/messaging/audio/storage";
import { broadcastMessageCreated } from "@/lib/messaging/realtimePublisher";
import { writeAuditEvent } from "@/lib/audit/events";
import { isSameOriginRequest } from "@/lib/security/requestOrigin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // Buffer + music-metadata requièrent Node runtime.

const MAX_CLIENT_MESSAGE_ID_CHARS = 128;

function notFound() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
function badRequest(code: string) {
  return NextResponse.json({ error: "Bad request", code }, { status: 400 });
}
function forbidden(code: string) {
  return NextResponse.json({ error: "Forbidden", code }, { status: 403 });
}
function tooLarge(code: string) {
  return NextResponse.json({ error: "Payload too large", code }, { status: 413 });
}
function unsupported(code: string) {
  return NextResponse.json({ error: "Unsupported media type", code }, { status: 415 });
}
function tooManyRequests(code: string) {
  return NextResponse.json({ error: "Too many requests", code }, { status: 429 });
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ conversationId: string }> },
) {
  // 1. feature flag · MESSAGING + MESSAGE_AUDIO
  if (!isMessagingEnabled() || !isMessagingAudioEnabled()) return notFound();

  // 2. actor
  const actor = await resolveMessagingActor();
  if (!actor) return notFound();

  // 3. + 4. API mutation · Origin navigateur exact requis lorsqu'il existe.
  if (!isSameOriginRequest(req)) return forbidden("origin_mismatch");

  const { conversationId } = await ctx.params;

  // 5. + 6. conversation access
  const access = await assertConversationAccess(actor, conversationId);
  if (!access.ok) return notFound();

  // 7. règle enfant · matrix vérifie que AUDIO est autorisé pour actorType.
  if (!isKindAllowedForActor(access.conversationType, actor.actorType, "AUDIO")) {
    return forbidden("kind_not_allowed");
  }

  // 8. quota horaire
  if (await hasReachedAudioUploadQuota(actor)) return tooManyRequests("quota_exceeded");

  // 9. lecture bornée du fichier · Content-Length preflight + bound réel.
  const limits = limitsForActor(actor.actorType);
  const contentLengthHeader = req.headers.get("content-length");
  if (contentLengthHeader) {
    const cl = Number.parseInt(contentLengthHeader, 10);
    if (Number.isFinite(cl) && cl > limits.maxSizeBytes + 4096) {
      // 4 KiB de marge pour multipart boundary/headers.
      return tooLarge("size_exceeded");
    }
  }

  let form: FormData;
  try { form = await req.formData(); } catch { return badRequest("bad_form"); }

  const file = form.get("file");
  const clientMessageId = form.get("clientMessageId");
  if (!(file instanceof File)) return badRequest("file_missing");
  if (
    typeof clientMessageId !== "string"
    || clientMessageId.length < 4
    || clientMessageId.length > MAX_CLIENT_MESSAGE_ID_CHARS
  ) {
    return badRequest("client_message_id_invalid");
  }
  if (file.size > limits.maxSizeBytes) return tooLarge("size_exceeded");
  if (file.size === 0) return badRequest("empty_file");

  // Aucune confiance dans file.type · sera revalidé par magic bytes.
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 10. validation audio (magic + duration)
  const validation = await validateAudioBuffer(buffer, limits.maxSizeBytes, limits.maxDurationMs);
  if (!validation.ok) {
    await writeAuditEvent({
      actorUserId: actor.actorType === "USER" ? actor.userId! : null,
      action: "MESSAGE_AUDIO_UPLOAD_FAILED",
      targetType: "MessagingConversation",
      targetId: conversationId,
      scopeType: "conversation_type",
      scopeId: access.conversationType,
      metadata: { reasonCode: validation.error, actorType: actor.actorType },
    });
    if (validation.error === "too_large" || validation.error === "duration_exceeded") return tooLarge(validation.error);
    return unsupported(validation.error);
  }

  // Idempotence · si un message existe déjà avec cet idempotencyKey pour
  // cette conversation, le retourner (upsert-like §6).
  const existing = await prisma.messagingMessage.findUnique({
    where: {
      conv_idem_unique: { conversationId, idempotencyKey: clientMessageId },
    },
    select: {
      id: true,
      createdAt: true,
      senderUserId: true,
      senderChildProfileId: true,
      kind: true,
      audioAssetId: true,
      audioAsset: { select: { id: true, mimeType: true, sizeBytes: true, durationMs: true } },
    },
  });
  if (existing) {
    // Refuse collision inter-acteur.
    const sameActor = actor.actorType === "USER"
      ? existing.senderUserId === actor.userId
      : existing.senderChildProfileId === actor.childProfileId;
    if (!sameActor || existing.kind !== "AUDIO" || !existing.audioAsset) {
      return forbidden("idempotency_collision");
    }
    return NextResponse.json({
      message: {
        id: existing.id,
        type: "AUDIO",
        createdAt: existing.createdAt.toISOString(),
        audio: {
          assetId: existing.audioAsset.id,
          durationMs: existing.audioAsset.durationMs ?? 0,
          mimeType: existing.audioAsset.mimeType ?? validation.mimeType,
          byteSize: existing.audioAsset.sizeBytes ?? validation.byteSize,
        },
      },
    });
  }

  // 11. id + storageKey
  const audioAssetId = cryptoRandomCuid();
  const storageKey = buildStorageKey({
    conversationId,
    audioAssetId,
    extension: validation.extension,
  });

  // 12. upload privé (avant DB · si succès puis DB fail → rollback Storage)
  const upl = await uploadAudioObject({ storageKey, buffer, mimeType: validation.mimeType });
  if (!upl.ok) {
    await writeAuditEvent({
      actorUserId: actor.actorType === "USER" ? actor.userId! : null,
      action: "MESSAGE_AUDIO_UPLOAD_FAILED",
      targetType: "MessagingConversation",
      targetId: conversationId,
      scopeType: "conversation_type",
      scopeId: access.conversationType,
      metadata: { reasonCode: "storage_upload_failed" },
    });
    return NextResponse.json({ error: "storage_failed" }, { status: 502 });
  }

  const now = new Date();
  const retentionUntil = new Date(now.getTime() + getRetentionDays() * 24 * 60 * 60 * 1000);
  const senderColumn = actor.actorType === "USER"
    ? { senderType: "USER" as const, senderUserId: actor.userId! }
    : { senderType: "CHILD_PROFILE" as const, senderChildProfileId: actor.childProfileId! };

  // 13-15. Transaction Prisma · asset READY + message AUDIO + receipts.
  //         AuditEvent inclus DANS la transaction pour cohérence.
  let messageId: string;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const asset = await tx.messagingAudioAsset.create({
        data: {
          id: audioAssetId,
          ownerUserId: actor.actorType === "USER" ? actor.userId! : null,
          ownerChildProfileId: actor.actorType === "CHILD_PROFILE" ? actor.childProfileId! : null,
          conversationId,
          status: "READY",
          storageKey,
          mimeType: validation.mimeType,
          sizeBytes: validation.byteSize,
          durationMs: validation.durationMs,
          finalizedAt: now,
          expiresAt: retentionUntil,
        },
        select: { id: true },
      });
      const msg = await tx.messagingMessage.create({
        data: {
          conversationId,
          kind: "AUDIO",
          audioAssetId: asset.id,
          idempotencyKey: clientMessageId,
          publishedAt: now,
          ...senderColumn,
        },
        select: { id: true },
      });

      // 14. PARENT_COPY si enfant.
      if (actor.actorType === "CHILD_PROFILE") {
        const observers = await tx.messagingConversationParticipant.findMany({
          where: {
            conversationId,
            participantRole: "GUARDIAN_OBSERVER",
            leftAt: null,
          },
          select: { userId: true },
        });
        if (observers.length > 0) {
          await tx.messagingMessageReceipt.createMany({
            data: observers
              .filter((o) => o.userId)
              .map((o) => ({
                messageId: msg.id,
                kind: "PARENT_COPY" as const,
                participantUserId: o.userId!,
              })),
          });
        }
      }

      // Bump lastMessageAt.
      await tx.messagingConversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: now },
      });

      // 15. AuditEvent DANS la transaction.
      await writeAuditEvent(
        {
          actorUserId: actor.actorType === "USER" ? actor.userId! : null,
          action: "MESSAGE_AUDIO_CREATED",
          targetType: "MessagingMessage",
          targetId: msg.id,
          scopeType: "conversation_type",
          scopeId: access.conversationType,
          metadata: {
            actorType: actor.actorType,
            durationBucket: bucketDuration(validation.durationMs),
            sizeBucket: bucketSize(validation.byteSize),
            mimeType: validation.mimeType,
          },
        },
        tx as unknown as typeof prisma,
      );

      return msg.id;
    });
    messageId = result;
  } catch {
    // Rollback Storage · brief §6 · impératif.
    await deleteAudioObject(storageKey);
    await writeAuditEvent({
      actorUserId: actor.actorType === "USER" ? actor.userId! : null,
      action: "MESSAGE_AUDIO_UPLOAD_FAILED",
      targetType: "MessagingConversation",
      targetId: conversationId,
      scopeType: "conversation_type",
      scopeId: access.conversationType,
      metadata: { reasonCode: "db_transaction_failed" },
    });
    return NextResponse.json({ error: "db_failed" }, { status: 500 });
  }

  // 16. Broadcast APRÈS commit uniquement. Best-effort · polling
  // fallback rattrape si le publisher échoue.
  try {
    const participants = await prisma.messagingConversationParticipant.findMany({
      where: { conversationId, leftAt: null },
      select: { userId: true, childProfileId: true },
    });
    const userIds = participants.map((p) => p.userId).filter((x): x is string => Boolean(x));
    const childIds = participants.map((p) => p.childProfileId).filter((x): x is string => Boolean(x));
    await broadcastMessageCreated({
      conversationId,
      messageId,
      participantUserIds: userIds,
      participantChildProfileIds: childIds,
    });
  } catch { /* best-effort */ }

  // 17. Réponse (aucune URL signée · brief §6).
  return NextResponse.json({
    message: {
      id: messageId,
      type: "AUDIO",
      createdAt: now.toISOString(),
      audio: {
        assetId: audioAssetId,
        durationMs: validation.durationMs,
        mimeType: validation.mimeType,
        byteSize: validation.byteSize,
      },
    },
  }, { status: 201 });
}

// cuid-compatible id local (évite import lourd). 25 chars alphanumériques.
function cryptoRandomCuid(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  const b64 = Buffer.from(bytes).toString("base64url").slice(0, 24);
  return "c" + b64;
}

function bucketDuration(ms: number): string {
  if (ms <= 5_000) return "<=5s";
  if (ms <= 30_000) return "<=30s";
  if (ms <= 60_000) return "<=60s";
  if (ms <= 120_000) return "<=120s";
  return ">120s";
}
function bucketSize(bytes: number): string {
  const kib = bytes / 1024;
  if (kib <= 128) return "<=128KiB";
  if (kib <= 512) return "<=512KiB";
  if (kib <= 2048) return "<=2MiB";
  if (kib <= 4096) return "<=4MiB";
  return ">4MiB";
}
