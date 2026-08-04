-- P4.6-C.1 · additions minimales sur messaging_audio_assets pour supporter
-- l'upload audio privé asynchrone.
--
-- Additif strict · aucune DROP, aucune modification des colonnes existantes.
-- Idempotent via IF NOT EXISTS / DO blocks.
--
-- Champs ajoutés ·
--   conversationId text · nullable · requis à partir de P4.6-C.1 pour tout
--     nouvel asset audio · permet le storage path v1/<conversationId>/<id>.<ext>
--     et un retention scan efficace sans JOIN. Nullable pour rétro-compat
--     avec les rows existantes (créées par des workflows Racines/Circle
--     antérieurs).
--   deletedAt timestamptz · nullable · tombstone soft-delete pour le
--     cleanup script (brief §8).
--   DELETED sur enum MessagingAudioStatus · statut terminal après cleanup.

ALTER TABLE "messaging_audio_assets"
  ADD COLUMN IF NOT EXISTS "conversationId" TEXT;

ALTER TABLE "messaging_audio_assets"
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ;

-- Ajout DELETED à l'enum MessagingAudioStatus si absent.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'DELETED'
      AND enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'MessagingAudioStatus'
      )
  ) THEN
    ALTER TYPE "MessagingAudioStatus" ADD VALUE 'DELETED';
  END IF;
END $$;

-- FK optionnelle vers la conversation · ON DELETE SET NULL pour éviter
-- de casser un asset si le fil est supprimé (l'asset reste tombstone).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'messaging_audio_assets_conversationId_fkey'
  ) THEN
    ALTER TABLE "messaging_audio_assets"
      ADD CONSTRAINT "messaging_audio_assets_conversationId_fkey"
      FOREIGN KEY ("conversationId") REFERENCES "messaging_conversations"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Index composite pour retention + cleanup + polling.
CREATE INDEX IF NOT EXISTS "messaging_audio_assets_conversationId_status_idx"
  ON "messaging_audio_assets"("conversationId", "status");

CREATE INDEX IF NOT EXISTS "messaging_audio_assets_status_deletedAt_idx"
  ON "messaging_audio_assets"("status", "deletedAt");

-- 5 AuditAction dédiées audio messagerie · brief §9.
DO $$
DECLARE
  v text;
BEGIN
  FOREACH v IN ARRAY ARRAY[
    'MESSAGE_AUDIO_CREATED',
    'MESSAGE_AUDIO_ACCESS_DENIED',
    'MESSAGE_AUDIO_PLAYBACK_GRANTED',
    'MESSAGE_AUDIO_UPLOAD_FAILED',
    'MESSAGE_AUDIO_PURGED'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum
      WHERE enumlabel = v
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AuditAction')
    ) THEN
      EXECUTE format('ALTER TYPE "AuditAction" ADD VALUE %L', v);
    END IF;
  END LOOP;
END $$;
