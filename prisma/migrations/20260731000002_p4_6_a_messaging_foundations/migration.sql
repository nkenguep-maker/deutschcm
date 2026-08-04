-- P4.6-A · Messagerie · fondations · additive strict.
--
-- Ajoute 9 nouveaux enums + 9 tables messaging_*. Aucune modification
-- des tables/enums existants. Aucun DROP. Aucun rename destructif.
-- Ne dépend d'aucune donnée existante. Fixtures QA créées via
-- scripts/test-baseline/messaging-fixtures.mjs de manière idempotente.

-- CreateEnum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ConversationType') THEN
    CREATE TYPE "ConversationType" AS ENUM ('WORLD_STUDENT_TEACHER', 'WORLD_CLASS_GROUP', 'ROOTS_STUDENT_COACH', 'ROOTS_PALABRE_GROUP', 'CHILD_WORLD_GUIDED', 'CHILD_ROOTS_GUIDED', 'FAMILY_TEACHER', 'FAMILY_CENTER_BILLING', 'FAMILY_COACH', 'CENTER_TEACHER_INTERNAL', 'CENTER_COACH_INTERNAL', 'CENTER_PLATFORM_SUPPORT', 'PLATFORM_BROADCAST');
  END IF;
END $$;


-- CreateEnum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MessagingConversationStatus') THEN
    CREATE TYPE "MessagingConversationStatus" AS ENUM ('ACTIVE', 'CLOSED', 'ARCHIVED');
  END IF;
END $$;


-- CreateEnum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MessagingMessageKind') THEN
    CREATE TYPE "MessagingMessageKind" AS ENUM ('TEXT', 'AUDIO', 'GUIDED_PHRASE', 'CARD', 'SYSTEM');
  END IF;
END $$;


-- CreateEnum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MessagingCardType') THEN
    CREATE TYPE "MessagingCardType" AS ENUM ('FEEDBACK_PUBLISHED', 'ENCOURAGEMENT', 'PAYMENT_REMINDER', 'PLATFORM_BROADCAST', 'SUPPORT_INTERVENTION');
  END IF;
END $$;


-- CreateEnum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MessagingActorType') THEN
    CREATE TYPE "MessagingActorType" AS ENUM ('USER', 'CHILD_PROFILE');
  END IF;
END $$;


-- CreateEnum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MessagingParticipantRole') THEN
    CREATE TYPE "MessagingParticipantRole" AS ENUM ('MEMBER', 'MODERATOR', 'GUARDIAN_OBSERVER', 'READ_ONLY');
  END IF;
END $$;


-- CreateEnum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MessagingModerationState') THEN
    CREATE TYPE "MessagingModerationState" AS ENUM ('ACTIVE', 'HIDDEN', 'DELETED', 'QUARANTINED');
  END IF;
END $$;


-- CreateEnum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MessagingReceiptKind') THEN
    CREATE TYPE "MessagingReceiptKind" AS ENUM ('PARENT_COPY', 'DELIVERED', 'READ', 'ACKNOWLEDGED');
  END IF;
END $$;


-- CreateEnum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MessagingAudioStatus') THEN
    CREATE TYPE "MessagingAudioStatus" AS ENUM ('PENDING', 'READY', 'FAILED', 'EXPIRED');
  END IF;
END $$;



-- CreateTable
CREATE TABLE IF NOT EXISTS "messaging_conversations" (
    "id" TEXT NOT NULL,
    "type" "ConversationType" NOT NULL,
    "status" "MessagingConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "centerId" TEXT,
    "classroomId" TEXT,
    "householdId" TEXT,
    "assignmentId" TEXT,
    "submissionId" TEXT,
    "feedbackId" TEXT,
    "invoiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastMessageAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "messaging_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "messaging_conversation_participants" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "actorType" "MessagingActorType" NOT NULL,
    "userId" TEXT,
    "childProfileId" TEXT,
    "participantRole" "MessagingParticipantRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messaging_conversation_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "messaging_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderType" "MessagingActorType" NOT NULL,
    "senderUserId" TEXT,
    "senderChildProfileId" TEXT,
    "kind" "MessagingMessageKind" NOT NULL,
    "body" TEXT,
    "guidedPhraseId" TEXT,
    "replyToMessageId" TEXT,
    "cardType" "MessagingCardType",
    "cardPayload" JSONB,
    "audioAssetId" TEXT,
    "moderationState" "MessagingModerationState" NOT NULL DEFAULT 'ACTIVE',
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "messaging_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "messaging_message_attachments" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "storageKey" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messaging_message_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "messaging_audio_assets" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT,
    "ownerChildProfileId" TEXT,
    "status" "MessagingAudioStatus" NOT NULL DEFAULT 'PENDING',
    "storageKey" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "durationMs" INTEGER,
    "waveform" JSONB,
    "transcript" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "messaging_audio_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "messaging_guided_phrases" (
    "id" TEXT NOT NULL,
    "universe" "Universe" NOT NULL,
    "locale" TEXT NOT NULL,
    "conversationType" "ConversationType" NOT NULL,
    "category" TEXT,
    "text" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "ordering" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messaging_guided_phrases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "messaging_message_receipts" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "kind" "MessagingReceiptKind" NOT NULL,
    "participantUserId" TEXT,
    "participantChildProfileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messaging_message_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "messaging_conversation_read_states" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "participantUserId" TEXT,
    "participantChildProfileId" TEXT,
    "lastReadMessageId" TEXT,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messaging_conversation_read_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "messaging_moderation_actions" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetMessageId" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messaging_moderation_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "messaging_conversations_type_centerId_idx" ON "messaging_conversations"("type", "centerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "messaging_conversations_type_classroomId_idx" ON "messaging_conversations"("type", "classroomId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "messaging_conversations_type_householdId_idx" ON "messaging_conversations"("type", "householdId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "messaging_conversations_lastMessageAt_idx" ON "messaging_conversations"("lastMessageAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "messaging_conversation_participants_userId_idx" ON "messaging_conversation_participants"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "messaging_conversation_participants_childProfileId_idx" ON "messaging_conversation_participants"("childProfileId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "messaging_conversation_participants_conversationId_particip_idx" ON "messaging_conversation_participants"("conversationId", "participantRole");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "msg_participant_user_uq" ON "messaging_conversation_participants"("conversationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "msg_participant_child_uq" ON "messaging_conversation_participants"("conversationId", "childProfileId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "messaging_messages_conversationId_createdAt_idx" ON "messaging_messages"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "messaging_messages_senderUserId_idx" ON "messaging_messages"("senderUserId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "messaging_messages_senderChildProfileId_idx" ON "messaging_messages"("senderChildProfileId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "messaging_messages_conversationId_idempotencyKey_key" ON "messaging_messages"("conversationId", "idempotencyKey");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "messaging_message_attachments_messageId_idx" ON "messaging_message_attachments"("messageId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "messaging_audio_assets_status_expiresAt_idx" ON "messaging_audio_assets"("status", "expiresAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "messaging_audio_assets_ownerUserId_idx" ON "messaging_audio_assets"("ownerUserId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "messaging_audio_assets_ownerChildProfileId_idx" ON "messaging_audio_assets"("ownerChildProfileId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "messaging_guided_phrases_universe_conversationType_isActive_idx" ON "messaging_guided_phrases"("universe", "conversationType", "isActive");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "messaging_message_receipts_messageId_kind_idx" ON "messaging_message_receipts"("messageId", "kind");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "messaging_message_receipts_participantUserId_kind_idx" ON "messaging_message_receipts"("participantUserId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "msg_read_user_uq" ON "messaging_conversation_read_states"("conversationId", "participantUserId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "msg_read_child_uq" ON "messaging_conversation_read_states"("conversationId", "participantChildProfileId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "messaging_moderation_actions_conversationId_createdAt_idx" ON "messaging_moderation_actions"("conversationId", "createdAt");



























































-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messaging_conversation_participants_conversationId_fkey') THEN
    ALTER TABLE "messaging_conversation_participants" ADD CONSTRAINT "messaging_conversation_participants_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "messaging_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;


-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messaging_conversation_participants_userId_fkey') THEN
    ALTER TABLE "messaging_conversation_participants" ADD CONSTRAINT "messaging_conversation_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;


-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messaging_conversation_participants_childProfileId_fkey') THEN
    ALTER TABLE "messaging_conversation_participants" ADD CONSTRAINT "messaging_conversation_participants_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "child_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;


-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messaging_messages_conversationId_fkey') THEN
    ALTER TABLE "messaging_messages" ADD CONSTRAINT "messaging_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "messaging_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;


-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messaging_messages_senderUserId_fkey') THEN
    ALTER TABLE "messaging_messages" ADD CONSTRAINT "messaging_messages_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;


-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messaging_messages_senderChildProfileId_fkey') THEN
    ALTER TABLE "messaging_messages" ADD CONSTRAINT "messaging_messages_senderChildProfileId_fkey" FOREIGN KEY ("senderChildProfileId") REFERENCES "child_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;


-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messaging_messages_guidedPhraseId_fkey') THEN
    ALTER TABLE "messaging_messages" ADD CONSTRAINT "messaging_messages_guidedPhraseId_fkey" FOREIGN KEY ("guidedPhraseId") REFERENCES "messaging_guided_phrases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;


-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messaging_messages_replyToMessageId_fkey') THEN
    ALTER TABLE "messaging_messages" ADD CONSTRAINT "messaging_messages_replyToMessageId_fkey" FOREIGN KEY ("replyToMessageId") REFERENCES "messaging_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;


-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messaging_messages_audioAssetId_fkey') THEN
    ALTER TABLE "messaging_messages" ADD CONSTRAINT "messaging_messages_audioAssetId_fkey" FOREIGN KEY ("audioAssetId") REFERENCES "messaging_audio_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;


-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messaging_message_attachments_messageId_fkey') THEN
    ALTER TABLE "messaging_message_attachments" ADD CONSTRAINT "messaging_message_attachments_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messaging_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;


-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messaging_audio_assets_ownerUserId_fkey') THEN
    ALTER TABLE "messaging_audio_assets" ADD CONSTRAINT "messaging_audio_assets_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;


-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messaging_audio_assets_ownerChildProfileId_fkey') THEN
    ALTER TABLE "messaging_audio_assets" ADD CONSTRAINT "messaging_audio_assets_ownerChildProfileId_fkey" FOREIGN KEY ("ownerChildProfileId") REFERENCES "child_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;


-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messaging_message_receipts_messageId_fkey') THEN
    ALTER TABLE "messaging_message_receipts" ADD CONSTRAINT "messaging_message_receipts_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messaging_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;


-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messaging_conversation_read_states_conversationId_fkey') THEN
    ALTER TABLE "messaging_conversation_read_states" ADD CONSTRAINT "messaging_conversation_read_states_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "messaging_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;


-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messaging_moderation_actions_conversationId_fkey') THEN
    ALTER TABLE "messaging_moderation_actions" ADD CONSTRAINT "messaging_moderation_actions_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "messaging_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;


-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messaging_moderation_actions_actorUserId_fkey') THEN
    ALTER TABLE "messaging_moderation_actions" ADD CONSTRAINT "messaging_moderation_actions_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

