-- P4.5-A · fondations Racines (Coach → Circle → Activity → Production → Feedback)
--
-- Additive uniquement. Nouveaux modèles Circle-scoped, séparés strictement
-- de Classroom Monde (aucune polymorphie fragile).
--
-- Contenu ·
--   1. Enums P4.5 Racines · CircleAssignmentType, CircleAssignmentStatus,
--      CircleSubmissionStatus, CircleFeedbackStatus, CircleSubmissionReplyRole
--   2. circle_assignments (activités Coach)
--   3. circle_assignment_targets (ciblage sous-ensemble profils)
--   4. circle_submissions (productions enfants)
--   5. circle_feedbacks (retours Coach immuables)
--   6. circle_submission_replies (fil parent–Coach structuré Q14)
--   7. Trigger immutabilité feedback publié (Circle + Assignment)
--   8. Trigger immutabilité submission SUBMITTED (Circle + Assignment)
--   9. AuditAction P4.5 additives · Racines + capacité + parent reply

-- 1 · Enums P4.5 Racines -----------------------------------------------

CREATE TYPE "CircleAssignmentType" AS ENUM ('WRITTEN', 'AUDIO', 'MIXED');

CREATE TYPE "CircleAssignmentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED');

CREATE TYPE "CircleSubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'WITHDRAWN', 'SUPERSEDED');

CREATE TYPE "CircleFeedbackStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ADDENDUM', 'RETRACTED_BY_ADMIN');

CREATE TYPE "CircleSubmissionReplyRole" AS ENUM ('PARENT', 'COACH');

-- 2 · circle_assignments -----------------------------------------------

CREATE TABLE "circle_assignments" (
  "id"                    TEXT NOT NULL,
  "circleId"              TEXT NOT NULL,
  "createdByCoachUserId"  TEXT NOT NULL,
  "title"                 TEXT NOT NULL,
  "instructions"          TEXT,
  "productionType"        "CircleAssignmentType" NOT NULL DEFAULT 'WRITTEN',
  "status"                "CircleAssignmentStatus" NOT NULL DEFAULT 'DRAFT',
  "publishedAt"           TIMESTAMP(3),
  "closedAt"              TIMESTAMP(3),
  "archivedAt"            TIMESTAMP(3),
  "dueAt"                 TIMESTAMP(3),
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "circle_assignments_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "circle_assignments"
  ADD CONSTRAINT "circle_assignments_circleId_fkey"
  FOREIGN KEY ("circleId") REFERENCES "circles"("id") ON DELETE CASCADE;

ALTER TABLE "circle_assignments"
  ADD CONSTRAINT "circle_assignments_createdByCoachUserId_fkey"
  FOREIGN KEY ("createdByCoachUserId") REFERENCES "users"("id") ON DELETE RESTRICT;

CREATE INDEX "circle_assignments_circleId_status_idx"
  ON "circle_assignments" ("circleId", "status");
CREATE INDEX "circle_assignments_createdByCoachUserId_publishedAt_idx"
  ON "circle_assignments" ("createdByCoachUserId", "publishedAt");
CREATE INDEX "circle_assignments_circleId_publishedAt_idx"
  ON "circle_assignments" ("circleId", "publishedAt");

-- 3 · circle_assignment_targets ---------------------------------------

CREATE TABLE "circle_assignment_targets" (
  "id"              TEXT NOT NULL,
  "assignmentId"    TEXT NOT NULL,
  "childProfileId"  TEXT NOT NULL,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "circle_assignment_targets_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "circle_assignment_targets"
  ADD CONSTRAINT "circle_assignment_targets_assignmentId_fkey"
  FOREIGN KEY ("assignmentId") REFERENCES "circle_assignments"("id") ON DELETE CASCADE;

ALTER TABLE "circle_assignment_targets"
  ADD CONSTRAINT "circle_assignment_targets_childProfileId_fkey"
  FOREIGN KEY ("childProfileId") REFERENCES "child_profiles"("id") ON DELETE CASCADE;

CREATE UNIQUE INDEX "circle_assignment_targets_assignmentId_childProfileId_uniq"
  ON "circle_assignment_targets" ("assignmentId", "childProfileId");
CREATE INDEX "circle_assignment_targets_childProfileId_idx"
  ON "circle_assignment_targets" ("childProfileId");

-- 4 · circle_submissions ----------------------------------------------

CREATE TABLE "circle_submissions" (
  "id"                  TEXT NOT NULL,
  "assignmentId"        TEXT NOT NULL,
  "childProfileId"      TEXT NOT NULL,
  "submittedByUserId"   TEXT NOT NULL,
  "version"             INTEGER NOT NULL DEFAULT 1,
  "status"              "CircleSubmissionStatus" NOT NULL DEFAULT 'DRAFT',
  "writtenContent"      TEXT,
  "storageObjectId"     TEXT,
  "submittedAt"         TIMESTAMP(3),
  "withdrawnAt"         TIMESTAMP(3),
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "circle_submissions_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "circle_submissions"
  ADD CONSTRAINT "circle_submissions_assignmentId_fkey"
  FOREIGN KEY ("assignmentId") REFERENCES "circle_assignments"("id") ON DELETE CASCADE;

ALTER TABLE "circle_submissions"
  ADD CONSTRAINT "circle_submissions_childProfileId_fkey"
  FOREIGN KEY ("childProfileId") REFERENCES "child_profiles"("id") ON DELETE CASCADE;

ALTER TABLE "circle_submissions"
  ADD CONSTRAINT "circle_submissions_submittedByUserId_fkey"
  FOREIGN KEY ("submittedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT;

ALTER TABLE "circle_submissions"
  ADD CONSTRAINT "circle_submissions_storageObjectId_fkey"
  FOREIGN KEY ("storageObjectId") REFERENCES "storage_objects"("id") ON DELETE SET NULL;

-- Un seul brouillon actif par (assignment, enfant).
CREATE UNIQUE INDEX "circle_submissions_active_draft_uniq"
  ON "circle_submissions" ("assignmentId", "childProfileId")
  WHERE "status" = 'DRAFT';

CREATE INDEX "circle_submissions_assignmentId_status_idx"
  ON "circle_submissions" ("assignmentId", "status");
CREATE INDEX "circle_submissions_childProfileId_status_idx"
  ON "circle_submissions" ("childProfileId", "status");
CREATE INDEX "circle_submissions_assignmentId_childProfileId_version_idx"
  ON "circle_submissions" ("assignmentId", "childProfileId", "version");

-- 5 · circle_feedbacks -------------------------------------------------

CREATE TABLE "circle_feedbacks" (
  "id"                    TEXT NOT NULL,
  "submissionId"          TEXT NOT NULL,
  "authorCoachUserId"     TEXT NOT NULL,
  "status"                "CircleFeedbackStatus" NOT NULL DEFAULT 'DRAFT',
  "version"               INTEGER NOT NULL DEFAULT 1,
  "supersedesFeedbackId"  TEXT,
  "writtenContent"        TEXT,
  "storageObjectId"       TEXT,
  "publishedAt"           TIMESTAMP(3),
  "retractedAt"           TIMESTAMP(3),
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "circle_feedbacks_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "circle_feedbacks"
  ADD CONSTRAINT "circle_feedbacks_submissionId_fkey"
  FOREIGN KEY ("submissionId") REFERENCES "circle_submissions"("id") ON DELETE CASCADE;

ALTER TABLE "circle_feedbacks"
  ADD CONSTRAINT "circle_feedbacks_authorCoachUserId_fkey"
  FOREIGN KEY ("authorCoachUserId") REFERENCES "users"("id") ON DELETE RESTRICT;

ALTER TABLE "circle_feedbacks"
  ADD CONSTRAINT "circle_feedbacks_storageObjectId_fkey"
  FOREIGN KEY ("storageObjectId") REFERENCES "storage_objects"("id") ON DELETE SET NULL;

ALTER TABLE "circle_feedbacks"
  ADD CONSTRAINT "circle_feedbacks_supersedesFeedbackId_fkey"
  FOREIGN KEY ("supersedesFeedbackId") REFERENCES "circle_feedbacks"("id") ON DELETE SET NULL;

CREATE INDEX "circle_feedbacks_submissionId_idx" ON "circle_feedbacks" ("submissionId");
CREATE INDEX "circle_feedbacks_authorCoachUserId_status_idx"
  ON "circle_feedbacks" ("authorCoachUserId", "status");
CREATE INDEX "circle_feedbacks_submissionId_version_idx"
  ON "circle_feedbacks" ("submissionId", "version");

CREATE UNIQUE INDEX "circle_feedbacks_active_draft_uniq"
  ON "circle_feedbacks" ("submissionId")
  WHERE "status" = 'DRAFT';

-- 6 · circle_submission_replies (fil parent–Coach structuré Q14) ------

CREATE TABLE "circle_submission_replies" (
  "id"            TEXT NOT NULL,
  "submissionId"  TEXT NOT NULL,
  "authorUserId"  TEXT NOT NULL,
  "authorRole"    "CircleSubmissionReplyRole" NOT NULL,
  "body"          TEXT NOT NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "hiddenAt"      TIMESTAMP(3),

  CONSTRAINT "circle_submission_replies_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "circle_submission_replies"
  ADD CONSTRAINT "circle_submission_replies_submissionId_fkey"
  FOREIGN KEY ("submissionId") REFERENCES "circle_submissions"("id") ON DELETE CASCADE;

ALTER TABLE "circle_submission_replies"
  ADD CONSTRAINT "circle_submission_replies_authorUserId_fkey"
  FOREIGN KEY ("authorUserId") REFERENCES "users"("id") ON DELETE RESTRICT;

CREATE INDEX "circle_submission_replies_submissionId_createdAt_idx"
  ON "circle_submission_replies" ("submissionId", "createdAt");
CREATE INDEX "circle_submission_replies_authorUserId_idx"
  ON "circle_submission_replies" ("authorUserId");

-- Longueur maximale 1000 caractères · §10.
ALTER TABLE "circle_submission_replies"
  ADD CONSTRAINT "circle_submission_replies_body_length_chk"
  CHECK (char_length("body") > 0 AND char_length("body") <= 1000);

-- 7 · Triggers immutabilité feedback publié (Racines + Monde) --------

CREATE OR REPLACE FUNCTION "p4_5_enforce_feedback_immutability"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Un feedback PUBLISHED est immuable · corriger un feedback = créer un
  -- addendum (nouveau row status=ADDENDUM, supersedesFeedbackId=<original>).
  -- Seule transition autorisée depuis PUBLISHED · RETRACTED_BY_ADMIN
  -- (par YEMA_ADMIN via workflow futur break-glass, jamais Coach/Teacher).
  IF OLD."status" = 'PUBLISHED' THEN
    IF NEW."status" NOT IN ('PUBLISHED', 'RETRACTED_BY_ADMIN') THEN
      RAISE EXCEPTION 'feedback_immutable · cannot mutate PUBLISHED feedback (id=%). Use addendum.', OLD."id"
        USING ERRCODE = 'check_violation';
    END IF;
    IF NEW."writtenContent" IS DISTINCT FROM OLD."writtenContent"
       OR NEW."storageObjectId" IS DISTINCT FROM OLD."storageObjectId"
       OR NEW."version" IS DISTINCT FROM OLD."version"
       OR NEW."publishedAt" IS DISTINCT FROM OLD."publishedAt"
       OR NEW."supersedesFeedbackId" IS DISTINCT FROM OLD."supersedesFeedbackId" THEN
      RAISE EXCEPTION 'feedback_immutable · cannot mutate content/version/link on PUBLISHED feedback (id=%)', OLD."id"
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "circle_feedbacks_immutable_publish"
  BEFORE UPDATE ON "circle_feedbacks"
  FOR EACH ROW
  EXECUTE FUNCTION "p4_5_enforce_feedback_immutability"();

CREATE TRIGGER "assignment_feedbacks_immutable_publish"
  BEFORE UPDATE ON "assignment_feedbacks"
  FOR EACH ROW
  EXECUTE FUNCTION "p4_5_enforce_feedback_immutability"();

-- 8 · Trigger immutabilité submission SUBMITTED ----------------------

CREATE OR REPLACE FUNCTION "p4_5_enforce_submission_immutability"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF OLD."status" = 'SUBMITTED' THEN
    IF NEW."status" NOT IN ('SUBMITTED', 'WITHDRAWN', 'SUPERSEDED') THEN
      RAISE EXCEPTION 'submission_immutable · cannot mutate SUBMITTED submission (id=%). Create new version.', OLD."id"
        USING ERRCODE = 'check_violation';
    END IF;
    IF NEW."writtenContent" IS DISTINCT FROM OLD."writtenContent"
       OR NEW."storageObjectId" IS DISTINCT FROM OLD."storageObjectId"
       OR NEW."version" IS DISTINCT FROM OLD."version"
       OR NEW."submittedAt" IS DISTINCT FROM OLD."submittedAt" THEN
      RAISE EXCEPTION 'submission_immutable · cannot mutate content/version/timestamps on SUBMITTED submission (id=%)', OLD."id"
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "circle_submissions_immutable_submit"
  BEFORE UPDATE ON "circle_submissions"
  FOR EACH ROW
  EXECUTE FUNCTION "p4_5_enforce_submission_immutability"();

CREATE TRIGGER "assignment_submissions_immutable_submit"
  BEFORE UPDATE ON "assignment_submissions"
  FOR EACH ROW
  EXECUTE FUNCTION "p4_5_enforce_submission_immutability"();

-- 9 · AuditAction P4.5 · Racines + capacité + reply -------------------

ALTER TYPE "AuditAction" ADD VALUE 'CIRCLE_ASSIGNMENT_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'CIRCLE_ASSIGNMENT_PUBLISHED';
ALTER TYPE "AuditAction" ADD VALUE 'CIRCLE_ASSIGNMENT_CLOSED';
ALTER TYPE "AuditAction" ADD VALUE 'CIRCLE_SUBMISSION_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'CIRCLE_SUBMISSION_SUBMITTED';
ALTER TYPE "AuditAction" ADD VALUE 'CIRCLE_SUBMISSION_WITHDRAWN';
ALTER TYPE "AuditAction" ADD VALUE 'CIRCLE_FEEDBACK_DRAFTED';
ALTER TYPE "AuditAction" ADD VALUE 'CIRCLE_FEEDBACK_PUBLISHED';
ALTER TYPE "AuditAction" ADD VALUE 'CIRCLE_FEEDBACK_ADDENDUM_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'PRODUCTION_LIMIT_REACHED';
ALTER TYPE "AuditAction" ADD VALUE 'PARENT_REPLY_CREATED';

-- 10 · RLS deny-by-default sur toutes les nouvelles tables P4.5 --------
--
-- Doctrine P4.5-A · les writes passent tous par le seam Prisma (service_role
-- côté serveur) avec vérifications applicatives · aucun client anon/auth
-- ne doit atteindre ces tables directement en P4.5-A. Les policies SELECT
-- scopées (is_teacher_for_assignment, is_active_circle_coach, is_child_parent)
-- seront installées avec P4.5-B/C quand les routes API arriveront.
--
-- Sans policy et RLS enabled, PostgreSQL refuse silencieusement tout
-- statement `authenticated` ou `anon` sur ces tables. Le service_role
-- bypasse RLS (comportement standard Supabase).

ALTER TABLE "circle_assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "circle_assignment_targets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "circle_submissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "circle_feedbacks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "circle_submission_replies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "assignment_feedbacks" ENABLE ROW LEVEL SECURITY;
-- Les tables Monde legacy (assignments, assignment_submissions) n'avaient
-- pas de RLS · le workspace Teacher P4.3b s'arrêtait à Classroom-level.
-- P4.5 les protège aussi (write-via-service_role uniquement en P4.5-A).
ALTER TABLE "assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "assignment_submissions" ENABLE ROW LEVEL SECURITY;
