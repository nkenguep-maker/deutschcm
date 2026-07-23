-- ============================================================================
-- P4.1 · Circle security foundations
--
-- Additive uniquement · aucune colonne existante n'est renommée ni supprimée.
-- Doctrine · docs/YEMA_P4_ARCHITECTURE_AUDIT.md §5-8 · docs/YEMA_P4_1_CIRCLE_SECURITY.md
--
-- Contenu ·
--   1. Nouvelles enums CircleStatus, CircleRole, CircleMembershipStatus,
--      AuditAction, StorageObjectPurpose.
--   2. Valeurs additives sur AppRole (RACINES_COACH) et ProductCode
--      (ROOTS_COACH_ADDON).
--   3. Colonne additive child_profiles.householdId + FK SetNull.
--   4. Index additif users(centerId).
--   5. Tables circles, circle_memberships, audit_events, storage_objects.
--   6. Contrainte CHECK XOR sur circle_memberships (user_id XOR child_profile_id).
--   7. Index conditionnel · un seul coach actif par cercle.
--   8. Fonctions helper Postgres (is_household_member, is_child_parent,
--      is_circle_member, is_circle_owner, is_circle_coach, is_class_member,
--      is_center_admin, is_yema_admin, current_app_user_id).
--   9. RLS activée sur circles, circle_memberships, audit_events, storage_objects
--      avec policies conservatrices.
-- ============================================================================

-- 1) Nouvelles enums ---------------------------------------------------------

CREATE TYPE "CircleStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'SUSPENDED');
CREATE TYPE "CircleRole" AS ENUM ('OWNER', 'ADULT', 'CHILD', 'COACH');
CREATE TYPE "CircleMembershipStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'REMOVED');

CREATE TYPE "AuditAction" AS ENUM (
  'CIRCLE_CREATED',
  'CIRCLE_ARCHIVED',
  'CIRCLE_SUSPENDED',
  'CIRCLE_MEMBERSHIP_INVITED',
  'CIRCLE_MEMBERSHIP_ACCEPTED',
  'CIRCLE_MEMBERSHIP_REVOKED',
  'CIRCLE_MEMBERSHIP_ROLE_CHANGED',
  'CIRCLE_COACH_ASSIGNED',
  'CIRCLE_COACH_UNASSIGNED',
  'HOUSEHOLD_MEMBERSHIP_INVITED',
  'HOUSEHOLD_MEMBERSHIP_ACCEPTED',
  'HOUSEHOLD_MEMBERSHIP_REVOKED',
  'CHILD_PROFILE_UPDATED',
  'CHILD_ACCESS_DENIED',
  'CROSS_TENANT_ACCESS_DENIED',
  'STORAGE_ACCESS_DENIED',
  'ADMIN_BREAK_GLASS_USED'
);

CREATE TYPE "StorageObjectPurpose" AS ENUM (
  'SUBMISSION_AUDIO',
  'FEEDBACK_AUDIO',
  'CIRCLE_MESSAGE_AUDIO',
  'CLASS_MESSAGE_AUDIO',
  'ATTACHMENT'
);

-- 2) Valeurs additives sur enums existantes ----------------------------------

ALTER TYPE "AppRole" ADD VALUE IF NOT EXISTS 'RACINES_COACH';
ALTER TYPE "ProductCode" ADD VALUE IF NOT EXISTS 'ROOTS_COACH_ADDON';

-- 3) child_profiles.householdId (nullable, SetNull) --------------------------

ALTER TABLE "child_profiles" ADD COLUMN IF NOT EXISTS "householdId" TEXT;

ALTER TABLE "child_profiles"
  ADD CONSTRAINT "child_profiles_householdId_fkey"
  FOREIGN KEY ("householdId") REFERENCES "households"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "child_profiles_householdId_idx"
  ON "child_profiles"("householdId");

-- 4) users(centerId) index ---------------------------------------------------

CREATE INDEX IF NOT EXISTS "users_centerId_idx" ON "users"("centerId");

-- 5) circles + circle_memberships + audit_events + storage_objects ----------

CREATE TABLE "circles" (
  "id"              TEXT NOT NULL PRIMARY KEY,
  "householdId"     TEXT NOT NULL,
  "language"        "LanguageCode" NOT NULL,
  "status"          "CircleStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdByUserId" TEXT NOT NULL,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  "activeAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "archivedAt"      TIMESTAMP(3),
  CONSTRAINT "circles_householdId_fkey"
    FOREIGN KEY ("householdId") REFERENCES "households"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "circles_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "circles_householdId_language_key"
  ON "circles"("householdId", "language");
CREATE INDEX "circles_householdId_status_idx"
  ON "circles"("householdId", "status");
CREATE INDEX "circles_language_status_idx"
  ON "circles"("language", "status");

CREATE TABLE "circle_memberships" (
  "id"              TEXT NOT NULL PRIMARY KEY,
  "circleId"        TEXT NOT NULL,
  "role"            "CircleRole" NOT NULL,
  "status"          "CircleMembershipStatus" NOT NULL DEFAULT 'INVITED',
  "userId"          TEXT,
  "childProfileId"  TEXT,
  "invitedByUserId" TEXT,
  "joinedAt"        TIMESTAMP(3),
  "removedAt"       TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  CONSTRAINT "circle_memberships_circleId_fkey"
    FOREIGN KEY ("circleId") REFERENCES "circles"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "circle_memberships_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "circle_memberships_childProfileId_fkey"
    FOREIGN KEY ("childProfileId") REFERENCES "child_profiles"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "circle_memberships_invitedByUserId_fkey"
    FOREIGN KEY ("invitedByUserId") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

-- 6) XOR contrainte · exactement l'un des deux (userId, childProfileId) non nul
ALTER TABLE "circle_memberships"
  ADD CONSTRAINT "circle_memberships_user_xor_child_check"
  CHECK (("userId" IS NULL) <> ("childProfileId" IS NULL));

CREATE INDEX "circle_memberships_circleId_role_status_idx"
  ON "circle_memberships"("circleId", "role", "status");
CREATE INDEX "circle_memberships_circleId_status_idx"
  ON "circle_memberships"("circleId", "status");
CREATE INDEX "circle_memberships_userId_status_idx"
  ON "circle_memberships"("userId", "status");
CREATE INDEX "circle_memberships_childProfileId_status_idx"
  ON "circle_memberships"("childProfileId", "status");

-- 7) Contrainte capacité · un seul coach ACTIVE par cercle
CREATE UNIQUE INDEX "circle_memberships_one_active_coach_per_circle_key"
  ON "circle_memberships"("circleId")
  WHERE "role" = 'COACH' AND "status" = 'ACTIVE';

-- Dédup adulte actif · un adulte donné ne peut avoir qu'une membership ACTIVE dans un cercle.
CREATE UNIQUE INDEX "circle_memberships_one_active_user_per_circle_key"
  ON "circle_memberships"("circleId", "userId")
  WHERE "userId" IS NOT NULL AND "status" = 'ACTIVE';

CREATE UNIQUE INDEX "circle_memberships_one_active_child_per_circle_key"
  ON "circle_memberships"("circleId", "childProfileId")
  WHERE "childProfileId" IS NOT NULL AND "status" = 'ACTIVE';

CREATE TABLE "audit_events" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "actorUserId" TEXT,
  "actorRole"   TEXT,
  "action"      "AuditAction" NOT NULL,
  "targetType"  TEXT NOT NULL,
  "targetId"    TEXT NOT NULL,
  "scopeType"   TEXT,
  "scopeId"     TEXT,
  "metadata"    JSONB,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_events_actorUserId_fkey"
    FOREIGN KEY ("actorUserId") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "audit_events_targetType_targetId_createdAt_idx"
  ON "audit_events"("targetType", "targetId", "createdAt");
CREATE INDEX "audit_events_actorUserId_createdAt_idx"
  ON "audit_events"("actorUserId", "createdAt");
CREATE INDEX "audit_events_action_createdAt_idx"
  ON "audit_events"("action", "createdAt");

CREATE TABLE "storage_objects" (
  "id"                  TEXT NOT NULL PRIMARY KEY,
  "bucket"              TEXT NOT NULL,
  "path"                TEXT NOT NULL,
  "ownerUserId"         TEXT,
  "ownerChildProfileId" TEXT,
  "circleId"            TEXT,
  "classId"             TEXT,
  "purpose"             "StorageObjectPurpose" NOT NULL,
  "mimeType"            TEXT NOT NULL,
  "sizeBytes"           INTEGER NOT NULL,
  "durationSeconds"     INTEGER,
  "retentionUntil"      TIMESTAMP(3),
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt"           TIMESTAMP(3),
  CONSTRAINT "storage_objects_ownerUserId_fkey"
    FOREIGN KEY ("ownerUserId") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "storage_objects_ownerChildProfileId_fkey"
    FOREIGN KEY ("ownerChildProfileId") REFERENCES "child_profiles"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "storage_objects_bucket_path_key"
  ON "storage_objects"("bucket", "path");
CREATE INDEX "storage_objects_purpose_retentionUntil_idx"
  ON "storage_objects"("purpose", "retentionUntil");
CREATE INDEX "storage_objects_ownerUserId_createdAt_idx"
  ON "storage_objects"("ownerUserId", "createdAt");
CREATE INDEX "storage_objects_circleId_idx"
  ON "storage_objects"("circleId");
CREATE INDEX "storage_objects_classId_idx"
  ON "storage_objects"("classId");

-- 8) Fonctions helper Postgres (SECURITY DEFINER, search_path fixé) ---------
--
-- Contract · toutes les helpers reçoivent des IDs applicatifs (cuid / uuid
-- Prisma). L'ID Supabase Auth (auth.uid()) est mappé sur User.supabaseId,
-- donc les policies utilisent d'abord current_app_user_id() pour convertir.
-- SECURITY DEFINER est nécessaire pour lire les tables Prisma sans que la
-- RLS de ces tables cross-check récursivement.

CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT id
  FROM public.users
  WHERE "supabaseId" = auth.uid()::text
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_household_member(p_household_id TEXT, p_user_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.households h WHERE h.id = p_household_id AND h."ownerUserId" = p_user_id
  ) OR EXISTS (
    SELECT 1 FROM public.household_memberships m
    WHERE m."householdId" = p_household_id
      AND m."userId" = p_user_id
      AND m.status = 'ACTIVE'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_child_parent(p_child_profile_id TEXT, p_user_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.child_profiles c
    WHERE c.id = p_child_profile_id AND c."parentUserId" = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_circle_member(p_circle_id TEXT, p_user_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.circle_memberships cm
    WHERE cm."circleId" = p_circle_id
      AND cm."userId" = p_user_id
      AND cm.status = 'ACTIVE'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_circle_owner(p_circle_id TEXT, p_user_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.circle_memberships cm
    WHERE cm."circleId" = p_circle_id
      AND cm."userId" = p_user_id
      AND cm.role = 'OWNER'
      AND cm.status = 'ACTIVE'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_circle_coach(p_circle_id TEXT, p_user_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.circle_memberships cm
    WHERE cm."circleId" = p_circle_id
      AND cm."userId" = p_user_id
      AND cm.role = 'COACH'
      AND cm.status = 'ACTIVE'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_class_member(p_class_id TEXT, p_user_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_memberships cm
    WHERE cm."classId" = p_class_id
      AND cm."userId" = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_center_admin(p_center_id TEXT, p_user_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.user_app_roles r ON r."userId" = u.id
    WHERE u.id = p_user_id
      AND u."centerId" = p_center_id
      AND r.role = 'CENTER_ADMIN'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_yema_admin(p_user_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_app_roles r
    WHERE r."userId" = p_user_id AND r.role = 'YEMA_ADMIN'
  );
$$;

-- 9) RLS activation + policies conservatrices --------------------------------
--
-- Principe P4.1 · seule la lecture est autorisée aux membres. Toutes les
-- écritures P4 passent par des Server Actions ou Route Handlers Next qui
-- utilisent le client Prisma (rôle service_role côté DB, RLS bypass). Nous
-- n'exposons AUCUN endpoint direct à PostgREST côté produit. Les policies
-- ci-dessous protègent le cas où un futur endpoint anon interrogerait la DB.

ALTER TABLE "circles" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "circles_select_member"
  ON "circles"
  FOR SELECT
  USING (
    public.is_circle_member(id, public.current_app_user_id())
    OR public.is_yema_admin(public.current_app_user_id())
  );

-- Aucune policy INSERT/UPDATE/DELETE côté client → tout passe par service_role.

ALTER TABLE "circle_memberships" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "circle_memberships_select_member"
  ON "circle_memberships"
  FOR SELECT
  USING (
    public.is_circle_member("circleId", public.current_app_user_id())
    OR public.is_yema_admin(public.current_app_user_id())
  );

ALTER TABLE "audit_events" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_events_select_admin"
  ON "audit_events"
  FOR SELECT
  USING (
    public.is_yema_admin(public.current_app_user_id())
  );

-- Écriture · uniquement service_role (bypass RLS).

ALTER TABLE "storage_objects" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "storage_objects_select_owner"
  ON "storage_objects"
  FOR SELECT
  USING (
    "ownerUserId" = public.current_app_user_id()
    OR (
      "circleId" IS NOT NULL AND public.is_circle_member("circleId", public.current_app_user_id())
    )
    OR (
      "classId" IS NOT NULL AND public.is_class_member("classId", public.current_app_user_id())
    )
    OR public.is_yema_admin(public.current_app_user_id())
  );

-- Écriture · service_role uniquement.
