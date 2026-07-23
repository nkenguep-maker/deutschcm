-- ============================================================================
-- P4.1 · Circle security foundations (final)
--
-- Additif · aucune colonne existante n'est renommée ni supprimée.
-- Idempotent · toutes les créations utilisent IF NOT EXISTS. Peut donc être
-- réappliquée à P-1 pour rattraper la révision.
--
-- Doctrine · docs/YEMA_P4_ARCHITECTURE_AUDIT.md §5-8 · docs/YEMA_P4_1_CIRCLE_SECURITY.md
--
-- Corrigé post-revue 2026-07-23 ·
--   §2 · unicité Circle · partial WHERE archived_at IS NULL (permet recréation
--       après archivage · Q8/Q9)
--   §3 · index memberships · owner unique actif · coach unique actif · dédup
--       user/child (pas de cap ADULT/CHILD par role à ce niveau · les
--       plafonds sont dans lib/circles/capacity.ts)
--   §5 · REVOKE FROM PUBLIC + GRANT EXECUTE sur les 9 helpers + GRANT SELECT
--       ciblés pour que la RLS filtre effectivement des lignes (au lieu de
--       tout bloquer au niveau grants).
-- ============================================================================

-- 1) Nouvelles enums (idempotent) --------------------------------------------

DO $$ BEGIN
  CREATE TYPE "CircleStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'SUSPENDED');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE TYPE "CircleRole" AS ENUM ('OWNER', 'ADULT', 'CHILD', 'COACH');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE TYPE "CircleMembershipStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'REMOVED');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
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
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE TYPE "StorageObjectPurpose" AS ENUM (
    'SUBMISSION_AUDIO',
    'FEEDBACK_AUDIO',
    'CIRCLE_MESSAGE_AUDIO',
    'CLASS_MESSAGE_AUDIO',
    'ATTACHMENT'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2) Valeurs additives sur enums existantes ----------------------------------

ALTER TYPE "AppRole" ADD VALUE IF NOT EXISTS 'RACINES_COACH';
ALTER TYPE "ProductCode" ADD VALUE IF NOT EXISTS 'ROOTS_COACH_ADDON';

-- 3) child_profiles.householdId (nullable, SetNull) --------------------------

ALTER TABLE "child_profiles" ADD COLUMN IF NOT EXISTS "householdId" TEXT;

DO $$ BEGIN
  ALTER TABLE "child_profiles"
    ADD CONSTRAINT "child_profiles_householdId_fkey"
    FOREIGN KEY ("householdId") REFERENCES "households"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE INDEX IF NOT EXISTS "child_profiles_householdId_idx"
  ON "child_profiles"("householdId");

-- 4) users(centerId) index ---------------------------------------------------

CREATE INDEX IF NOT EXISTS "users_centerId_idx" ON "users"("centerId");

-- 5) Tables Circle · CircleMembership · AuditEvent · StorageObject -----------

CREATE TABLE IF NOT EXISTS "circles" (
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

-- §2 correction · un seul Circle NON-ARCHIVÉ par (foyer, langue).
-- Retire l'unicité globale qui bloquait Q8/Q9 (recréation après archivage).
DROP INDEX IF EXISTS "circles_householdId_language_key";
CREATE UNIQUE INDEX IF NOT EXISTS "circles_active_household_language_unique"
  ON "circles"("householdId", "language")
  WHERE "archivedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "circles_householdId_language_idx"
  ON "circles"("householdId", "language");
CREATE INDEX IF NOT EXISTS "circles_householdId_status_idx"
  ON "circles"("householdId", "status");
CREATE INDEX IF NOT EXISTS "circles_language_status_idx"
  ON "circles"("language", "status");

CREATE TABLE IF NOT EXISTS "circle_memberships" (
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

-- CHECK XOR · exactement l'un des deux (userId, childProfileId) non nul.
DO $$ BEGIN
  ALTER TABLE "circle_memberships"
    ADD CONSTRAINT "circle_memberships_user_xor_child_check"
    CHECK (("userId" IS NULL) <> ("childProfileId" IS NULL));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- §3 indexes memberships corrigés ·
--   OWNER  · exactement 1 ACTIVE par cercle.
--   COACH  · exactement 1 ACTIVE par cercle.
--   USER   · dédup · un user donné = 1 membership ACTIVE max par cercle
--            (adulte, plusieurs adultes différents autorisés jusqu'à
--            plafond applicatif §capacity.ts).
--   CHILD  · dédup · un childProfile donné = 1 membership ACTIVE max
--            par cercle (idem, plafond applicatif).

CREATE UNIQUE INDEX IF NOT EXISTS "circle_memberships_one_active_owner_per_circle_key"
  ON "circle_memberships"("circleId")
  WHERE "role" = 'OWNER' AND "status" = 'ACTIVE';

CREATE UNIQUE INDEX IF NOT EXISTS "circle_memberships_one_active_coach_per_circle_key"
  ON "circle_memberships"("circleId")
  WHERE "role" = 'COACH' AND "status" = 'ACTIVE';

CREATE UNIQUE INDEX IF NOT EXISTS "circle_memberships_one_active_user_per_circle_key"
  ON "circle_memberships"("circleId", "userId")
  WHERE "userId" IS NOT NULL AND "status" = 'ACTIVE';

CREATE UNIQUE INDEX IF NOT EXISTS "circle_memberships_one_active_child_per_circle_key"
  ON "circle_memberships"("circleId", "childProfileId")
  WHERE "childProfileId" IS NOT NULL AND "status" = 'ACTIVE';

CREATE INDEX IF NOT EXISTS "circle_memberships_circleId_role_status_idx"
  ON "circle_memberships"("circleId", "role", "status");
CREATE INDEX IF NOT EXISTS "circle_memberships_circleId_status_idx"
  ON "circle_memberships"("circleId", "status");
CREATE INDEX IF NOT EXISTS "circle_memberships_userId_status_idx"
  ON "circle_memberships"("userId", "status");
CREATE INDEX IF NOT EXISTS "circle_memberships_childProfileId_status_idx"
  ON "circle_memberships"("childProfileId", "status");

CREATE TABLE IF NOT EXISTS "audit_events" (
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
CREATE INDEX IF NOT EXISTS "audit_events_targetType_targetId_createdAt_idx"
  ON "audit_events"("targetType", "targetId", "createdAt");
CREATE INDEX IF NOT EXISTS "audit_events_actorUserId_createdAt_idx"
  ON "audit_events"("actorUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "audit_events_action_createdAt_idx"
  ON "audit_events"("action", "createdAt");

CREATE TABLE IF NOT EXISTS "storage_objects" (
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
CREATE UNIQUE INDEX IF NOT EXISTS "storage_objects_bucket_path_key"
  ON "storage_objects"("bucket", "path");
CREATE INDEX IF NOT EXISTS "storage_objects_purpose_retentionUntil_idx"
  ON "storage_objects"("purpose", "retentionUntil");
CREATE INDEX IF NOT EXISTS "storage_objects_ownerUserId_createdAt_idx"
  ON "storage_objects"("ownerUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "storage_objects_circleId_idx"
  ON "storage_objects"("circleId");
CREATE INDEX IF NOT EXISTS "storage_objects_classId_idx"
  ON "storage_objects"("classId");

-- 6) Fonctions helper Postgres (idempotent · CREATE OR REPLACE) --------------
--
-- Contract · toutes reçoivent un applicative user id (TEXT cuid) et un id
-- ressource. La conversion Supabase → applicative se fait dans
-- current_app_user_id() (mapping users.supabaseId = auth.uid()).
-- SECURITY DEFINER nécessaire · les policies USING appellent ces fonctions
-- depuis un contexte anon/authenticated qui n'a pas nécessairement SELECT
-- sur les tables jointes (users, household_memberships, class_memberships,
-- user_app_roles, circle_memberships). En SECURITY DEFINER + owner postgres,
-- la fonction lit avec les droits owner (bypass RLS des tables jointes
-- puisqu'aucune n'a de policy).

CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT id FROM public.users WHERE "supabaseId" = auth.uid()::text LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_household_member(p_household_id TEXT, p_user_id TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.households h WHERE h.id = p_household_id AND h."ownerUserId" = p_user_id
  ) OR EXISTS (
    SELECT 1 FROM public.household_memberships m
    WHERE m."householdId" = p_household_id AND m."userId" = p_user_id AND m.status = 'ACTIVE'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_child_parent(p_child_profile_id TEXT, p_user_id TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.child_profiles c WHERE c.id = p_child_profile_id AND c."parentUserId" = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_circle_member(p_circle_id TEXT, p_user_id TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.circle_memberships cm
    WHERE cm."circleId" = p_circle_id AND cm."userId" = p_user_id AND cm.status = 'ACTIVE'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_circle_owner(p_circle_id TEXT, p_user_id TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.circle_memberships cm
    WHERE cm."circleId" = p_circle_id AND cm."userId" = p_user_id
      AND cm.role = 'OWNER' AND cm.status = 'ACTIVE'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_circle_coach(p_circle_id TEXT, p_user_id TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.circle_memberships cm
    WHERE cm."circleId" = p_circle_id AND cm."userId" = p_user_id
      AND cm.role = 'COACH' AND cm.status = 'ACTIVE'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_class_member(p_class_id TEXT, p_user_id TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_memberships cm
    WHERE cm."classId" = p_class_id AND cm."userId" = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_center_admin(p_center_id TEXT, p_user_id TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.user_app_roles r ON r."userId" = u.id
    WHERE u.id = p_user_id AND u."centerId" = p_center_id AND r.role = 'CENTER_ADMIN'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_yema_admin(p_user_id TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_app_roles r
    WHERE r."userId" = p_user_id AND r.role = 'YEMA_ADMIN'
  );
$$;

-- 7) Grants sur les fonctions (revoke public + grant explicite) --------------

REVOKE ALL ON FUNCTION public.current_app_user_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_household_member(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_child_parent(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_circle_member(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_circle_owner(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_circle_coach(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_class_member(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_center_admin(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_yema_admin(TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.current_app_user_id() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_household_member(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_child_parent(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_circle_member(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_circle_owner(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_circle_coach(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_class_member(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_center_admin(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_yema_admin(TEXT) TO authenticated;

-- 8) RLS · activation + policies + grants ------------------------------------

ALTER TABLE "circles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "circle_memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "storage_objects" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "circles_select_member" ON "circles";
CREATE POLICY "circles_select_member" ON "circles"
  FOR SELECT TO authenticated
  USING (
    public.is_circle_member(id, public.current_app_user_id())
    OR public.is_yema_admin(public.current_app_user_id())
  );

DROP POLICY IF EXISTS "circle_memberships_select_member" ON "circle_memberships";
CREATE POLICY "circle_memberships_select_member" ON "circle_memberships"
  FOR SELECT TO authenticated
  USING (
    public.is_circle_member("circleId", public.current_app_user_id())
    OR public.is_yema_admin(public.current_app_user_id())
  );

DROP POLICY IF EXISTS "audit_events_select_admin" ON "audit_events";
CREATE POLICY "audit_events_select_admin" ON "audit_events"
  FOR SELECT TO authenticated
  USING (public.is_yema_admin(public.current_app_user_id()));

DROP POLICY IF EXISTS "storage_objects_select_owner" ON "storage_objects";
CREATE POLICY "storage_objects_select_owner" ON "storage_objects"
  FOR SELECT TO authenticated
  USING (
    "ownerUserId" = public.current_app_user_id()
    OR ("circleId" IS NOT NULL AND public.is_circle_member("circleId", public.current_app_user_id()))
    OR ("classId" IS NOT NULL AND public.is_class_member("classId", public.current_app_user_id()))
    OR public.is_yema_admin(public.current_app_user_id())
  );

-- Grants SELECT · nécessaires pour que la RLS filtre au lieu de tout rejeter
-- au niveau grants (defense-in-depth vs "0 lignes trompeur pour le propriétaire").
-- Écriture · toujours via service_role (Prisma serveur), pas de policy INSERT/UPDATE/DELETE.
GRANT SELECT ON "circles" TO authenticated;
GRANT SELECT ON "circle_memberships" TO authenticated;
GRANT SELECT ON "storage_objects" TO authenticated;
-- audit_events · aucun grant à authenticated · seul le service_role (Prisma
-- serveur) écrit, seule la policy is_yema_admin permet la lecture · un admin
-- doit être authentifié · granté ci-dessous.
GRANT SELECT ON "audit_events" TO authenticated;

-- Aucun grant à anon · les tables restent inaccessibles sans session.
REVOKE ALL ON "circles" FROM anon;
REVOKE ALL ON "circle_memberships" FROM anon;
REVOKE ALL ON "audit_events" FROM anon;
REVOKE ALL ON "storage_objects" FROM anon;
