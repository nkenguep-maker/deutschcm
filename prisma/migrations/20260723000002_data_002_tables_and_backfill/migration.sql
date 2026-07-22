-- YEMA · DATA-002 · étape 2/2 — colonnes, tables, backfill
--
-- Complète l'alignement schema.prisma :
--   users.plan (SubscriptionPlan default FREE)
--   users.centerId (TEXT nullable, pas de FK côté User — Teacher a sa propre relation)
--   teachers.code (TEXT nullable UNIQUE)
--   language_centers.code (TEXT nullable UNIQUE)
--   level_history.ceremonySeen (BOOLEAN default false)
--   Tables manquantes : user_roles, class_join_requests, study_group_invites,
--                       user_connections, teacher_applications, center_applications
--
-- Backfill :
--   - Convertit users.role CENTER_MANAGER → CENTER (doctrine post-A.1)
--   - Crée un UserRole ACTIVE onboarded pour chaque user existant, dérivé de users.role
--   - Nouvelles colonnes utilisent des DEFAULT sûrs pour les lignes existantes
--   - Aucun rattachement centre inventé (users.centerId reste NULL)
--   - Aucun code teacher/center inventé (nullable, seront générés à la création)

BEGIN;

-- ─── Colonnes manquantes ────────────────────────────────────────────

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS "centerId" TEXT,
  ADD COLUMN IF NOT EXISTS "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE';

ALTER TABLE teachers
  ADD COLUMN IF NOT EXISTS "code" TEXT;

ALTER TABLE language_centers
  ADD COLUMN IF NOT EXISTS "code" TEXT;

ALTER TABLE level_history
  ADD COLUMN IF NOT EXISTS "ceremonySeen" BOOLEAN NOT NULL DEFAULT false;

-- Unique constraints sur les codes (compatibles avec des lignes existantes NULL).
DO $$ BEGIN
  ALTER TABLE teachers ADD CONSTRAINT "teachers_code_key" UNIQUE ("code");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE language_centers ADD CONSTRAINT "language_centers_code_key" UNIQUE ("code");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Tables manquantes ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "user_roles" (
  "id"         TEXT PRIMARY KEY,
  "userId"     TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role"       "Role" NOT NULL,
  "status"     "RoleStatus" NOT NULL DEFAULT 'ACTIVE',
  "onboarded"  BOOLEAN NOT NULL DEFAULT false,
  "grantedBy"  TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS "user_roles_userId_role_key" ON "user_roles"("userId", "role");
CREATE INDEX IF NOT EXISTS "user_roles_userId_idx" ON "user_roles"("userId");

CREATE TABLE IF NOT EXISTS "class_join_requests" (
  "id"            TEXT PRIMARY KEY,
  "fromUserId"    TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "toClassroomId" TEXT,
  "toGroupId"     TEXT,
  "status"        TEXT NOT NULL DEFAULT 'pending',
  "message"       TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "respondedAt"   TIMESTAMP(3),
  "respondedBy"   TEXT
);
CREATE INDEX IF NOT EXISTS "class_join_requests_fromUserId_idx" ON "class_join_requests"("fromUserId");
CREATE INDEX IF NOT EXISTS "class_join_requests_toClassroomId_idx" ON "class_join_requests"("toClassroomId");

CREATE TABLE IF NOT EXISTS "study_group_invites" (
  "id"          TEXT PRIMARY KEY,
  "fromUserId"  TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "toUserId"    TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "groupId"     TEXT,
  "groupName"   TEXT,
  "message"     TEXT,
  "status"      TEXT NOT NULL DEFAULT 'pending',
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "study_group_invites_toUserId_idx" ON "study_group_invites"("toUserId");

CREATE TABLE IF NOT EXISTS "user_connections" (
  "id"          TEXT PRIMARY KEY,
  "userId"      TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "connectedId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type"        TEXT NOT NULL DEFAULT 'classmate',
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS "user_connections_userId_connectedId_key" ON "user_connections"("userId", "connectedId");

CREATE TABLE IF NOT EXISTS "teacher_applications" (
  "id"          TEXT PRIMARY KEY,
  "fullName"    TEXT NOT NULL,
  "email"       TEXT NOT NULL,
  "whatsapp"    TEXT,
  "city"        TEXT NOT NULL,
  "languages"   TEXT NOT NULL,
  "experience"  TEXT NOT NULL,
  "status"      "ApplicationStatus" NOT NULL DEFAULT 'RECEIVED',
  "notes"       TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMP(3) NOT NULL
);
CREATE INDEX IF NOT EXISTS "teacher_applications_status_idx" ON "teacher_applications"("status");
CREATE INDEX IF NOT EXISTS "teacher_applications_createdAt_idx" ON "teacher_applications"("createdAt");

CREATE TABLE IF NOT EXISTS "center_applications" (
  "id"          TEXT PRIMARY KEY,
  "centerName"  TEXT NOT NULL,
  "city"        TEXT NOT NULL,
  "whatsapp"    TEXT,
  "email"       TEXT NOT NULL,
  "status"      "ApplicationStatus" NOT NULL DEFAULT 'RECEIVED',
  "notes"       TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMP(3) NOT NULL
);
CREATE INDEX IF NOT EXISTS "center_applications_status_idx" ON "center_applications"("status");
CREATE INDEX IF NOT EXISTS "center_applications_createdAt_idx" ON "center_applications"("createdAt");

-- ─── Backfill ─────────────────────────────────────────────────────

-- Convertit users.role CENTER_MANAGER → CENTER (doctrine post-A.1).
-- Safe car CENTER a été ajouté par la migration 20260723000001 (déjà commit).
UPDATE users SET role = 'CENTER' WHERE role = 'CENTER_MANAGER';

-- Crée un UserRole ACTIVE onboarded=true pour chaque user existant, dérivé
-- de users.role. Les nouveaux users passeront par grantRole() (src/lib/roles.ts).
-- ON CONFLICT DO NOTHING pour rester idempotent si la table pré-existait
-- via prisma db push (cas P-1).
INSERT INTO "user_roles" ("id", "userId", "role", "status", "onboarded", "createdAt")
SELECT
  'ur_backfill_' || u."id",
  u."id",
  u."role",
  'ACTIVE',
  true,
  u."createdAt"
FROM "users" u
ON CONFLICT ("userId", "role") DO NOTHING;

COMMIT;
