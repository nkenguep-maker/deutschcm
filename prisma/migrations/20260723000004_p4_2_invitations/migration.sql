-- ============================================================================
-- P4.2 · Circle memberships + adult invitations workflow
--
-- Additif · aucune colonne existante n'est renommée ni supprimée.
-- Idempotent · toutes les créations utilisent IF NOT EXISTS.
--
-- Doctrine · docs/YEMA_P4_2_MEMBERSHIPS_INVITATIONS.md · Q1-Q3 (2ᵉ adulte),
-- Q10 (coach remplacé), Q15 (capacité coach 20 profils / 10 Circles).
--
-- Contenu ·
--   1. Enum InvitationStatus (PENDING/ACCEPTED/REVOKED/EXPIRED).
--   2. Nouvelles valeurs AuditAction (ADULT_INVITED, CHILD_ADDED, etc.).
--   3. Table circle_invitations avec FK + indexes + unique tokenHash.
--   4. RLS activée · policy SELECT · membre OWNER du cercle uniquement.
--   5. Grants SELECT à authenticated · aucun accès anon.
-- ============================================================================

-- 1) Enum InvitationStatus ---------------------------------------------------
DO $$ BEGIN
  CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2) Nouvelles valeurs AuditAction (additif · noop si déjà présentes) --------
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ADULT_INVITED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ADULT_INVITATION_REVOKED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ADULT_INVITATION_ACCEPTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ADULT_LEFT_CIRCLE';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ADULT_REMOVED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'CHILD_ADDED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'CHILD_REMOVED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'COACH_ASSIGNMENT_REQUESTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'COACH_ASSIGNED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'COACH_REMOVED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'MEMBERSHIP_ACCESS_DENIED';

-- 3) Table circle_invitations ------------------------------------------------
CREATE TABLE IF NOT EXISTS "circle_invitations" (
  "id"                TEXT NOT NULL PRIMARY KEY,
  "circleId"          TEXT NOT NULL,
  "role"              "CircleRole" NOT NULL,
  "status"            "InvitationStatus" NOT NULL DEFAULT 'PENDING',
  "invitedEmailHash"  TEXT NOT NULL,
  "invitedByUserId"   TEXT NOT NULL,
  "tokenHash"         TEXT NOT NULL,
  "expiresAt"         TIMESTAMP(3) NOT NULL,
  "acceptedAt"        TIMESTAMP(3),
  "acceptedByUserId"  TEXT,
  "revokedAt"         TIMESTAMP(3),
  "revokedByUserId"   TEXT,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL,
  CONSTRAINT "circle_invitations_circleId_fkey"
    FOREIGN KEY ("circleId") REFERENCES "circles"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "circle_invitations_invitedByUserId_fkey"
    FOREIGN KEY ("invitedByUserId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "circle_invitations_acceptedByUserId_fkey"
    FOREIGN KEY ("acceptedByUserId") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "circle_invitations_revokedByUserId_fkey"
    FOREIGN KEY ("revokedByUserId") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "circle_invitations_tokenHash_key"
  ON "circle_invitations"("tokenHash");
CREATE INDEX IF NOT EXISTS "circle_invitations_circleId_status_idx"
  ON "circle_invitations"("circleId", "status");
CREATE INDEX IF NOT EXISTS "circle_invitations_invitedEmailHash_status_idx"
  ON "circle_invitations"("invitedEmailHash", "status");
CREATE INDEX IF NOT EXISTS "circle_invitations_expiresAt_status_idx"
  ON "circle_invitations"("expiresAt", "status");

-- Contrainte applicative complémentaire · une seule invitation PENDING active
-- par (circleId, emailHash) · évite qu'un OWNER spamme la même adresse.
CREATE UNIQUE INDEX IF NOT EXISTS "circle_invitations_one_pending_per_circle_email_key"
  ON "circle_invitations"("circleId", "invitedEmailHash")
  WHERE "status" = 'PENDING';

-- 4) RLS activation + policy SELECT ------------------------------------------
ALTER TABLE "circle_invitations" ENABLE ROW LEVEL SECURITY;

-- Seul l'OWNER du cercle peut lister les invitations de son cercle.
-- L'invité ne "lit" pas les invitations · il présente son token qui est
-- résolu côté serveur (bypass RLS via service_role).
DROP POLICY IF EXISTS "circle_invitations_select_owner" ON "circle_invitations";
CREATE POLICY "circle_invitations_select_owner" ON "circle_invitations"
  FOR SELECT TO authenticated
  USING (
    public.is_circle_owner("circleId", public.current_app_user_id())
    OR public.is_yema_admin(public.current_app_user_id())
  );

-- 5) Grants ------------------------------------------------------------------
GRANT SELECT ON "circle_invitations" TO authenticated;
REVOKE ALL ON "circle_invitations" FROM anon;
