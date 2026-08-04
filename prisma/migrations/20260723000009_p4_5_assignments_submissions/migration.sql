-- P4.5-A · fondations Monde (Teacher/Classroom/Assignment/AssignmentSubmission)
--
-- Additive uniquement. Aucune migration historique modifiée. Utilise la
-- famille V2 (Classroom + Assignment + AssignmentSubmission) confirmée
-- par le workspace Teacher P4.3b.
--
-- Contenu ·
--   1. Enums P4.5 · AssignmentType, AssignmentStatus, SubmissionStatus, FeedbackStatus
--   2. Colonnes additives sur assignments (status, type, publishedAt, closedAt, archivedAt, createdByTeacherId)
--   3. Colonnes additives sur assignment_submissions (status, version, storageObjectId,
--      writtenContent, withdrawnAt) + backfill vers status SUBMITTED
--   4. Nouvelle table assignment_feedbacks (immuable après PUBLISHED)
--   5. AuditAction P4.5 additives (Monde uniquement dans cette migration)
--   6. Index de couverture pour queries fréquentes
--
-- Immutabilité feedback publié · gérée par la migration
-- 20260723000010_p4_5_racines_productions_rls (trigger commun).

-- 1 · Enums P4.5 --------------------------------------------------------

CREATE TYPE "AssignmentType" AS ENUM ('WRITTEN', 'AUDIO', 'MIXED');

CREATE TYPE "AssignmentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED');

CREATE TYPE "SubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'WITHDRAWN', 'SUPERSEDED');

CREATE TYPE "FeedbackStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ADDENDUM', 'RETRACTED_BY_ADMIN');

-- 2 · assignments (V2) · colonnes additives ----------------------------

ALTER TABLE "assignments"
  ADD COLUMN "type" "AssignmentType" NOT NULL DEFAULT 'WRITTEN',
  ADD COLUMN "status" "AssignmentStatus" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "instructions" TEXT,
  ADD COLUMN "publishedAt" TIMESTAMP(3),
  ADD COLUMN "closedAt" TIMESTAMP(3),
  ADD COLUMN "archivedAt" TIMESTAMP(3),
  ADD COLUMN "createdByTeacherId" TEXT,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "assignments"
  ADD CONSTRAINT "assignments_createdByTeacherId_fkey"
  FOREIGN KEY ("createdByTeacherId") REFERENCES "teachers"("id") ON DELETE SET NULL;

CREATE INDEX "assignments_classroomId_status_idx" ON "assignments" ("classroomId", "status");
CREATE INDEX "assignments_status_publishedAt_idx" ON "assignments" ("status", "publishedAt");

-- 3 · assignment_submissions · statut, versionnement, storage assoc ---

ALTER TABLE "assignment_submissions"
  ADD COLUMN "status" "SubmissionStatus" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "writtenContent" TEXT,
  ADD COLUMN "storageObjectId" TEXT,
  ADD COLUMN "withdrawnAt" TIMESTAMP(3),
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Rétro-compatibilité · toute submission historique existante est
-- considérée SUBMITTED (le champ `submittedAt` était déjà rempli).
UPDATE "assignment_submissions" SET "status" = 'SUBMITTED' WHERE "submittedAt" IS NOT NULL;

ALTER TABLE "assignment_submissions"
  ADD CONSTRAINT "assignment_submissions_storageObjectId_fkey"
  FOREIGN KEY ("storageObjectId") REFERENCES "storage_objects"("id") ON DELETE SET NULL;

-- Un seul brouillon actif par (assignment, étudiant). Doctrine §4 Submission.
-- Les statuts SUBMITTED / WITHDRAWN / SUPERSEDED peuvent coexister
-- (versions successives), un seul DRAFT.
CREATE UNIQUE INDEX "assignment_submissions_active_draft_uniq"
  ON "assignment_submissions" ("assignmentId", "userId")
  WHERE "status" = 'DRAFT';

CREATE INDEX "assignment_submissions_assignmentId_status_idx"
  ON "assignment_submissions" ("assignmentId", "status");

-- 4 · assignment_feedbacks (nouvelle table Monde) ---------------------

CREATE TABLE "assignment_feedbacks" (
  "id"                    TEXT NOT NULL,
  "submissionId"          TEXT NOT NULL,
  "authorTeacherId"       TEXT NOT NULL,
  "status"                "FeedbackStatus" NOT NULL DEFAULT 'DRAFT',
  "version"               INTEGER NOT NULL DEFAULT 1,
  "supersedesFeedbackId"  TEXT,
  "writtenContent"        TEXT,
  "storageObjectId"       TEXT,
  "publishedAt"           TIMESTAMP(3),
  "retractedAt"           TIMESTAMP(3),
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "assignment_feedbacks_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "assignment_feedbacks"
  ADD CONSTRAINT "assignment_feedbacks_submissionId_fkey"
  FOREIGN KEY ("submissionId") REFERENCES "assignment_submissions"("id") ON DELETE CASCADE;

ALTER TABLE "assignment_feedbacks"
  ADD CONSTRAINT "assignment_feedbacks_authorTeacherId_fkey"
  FOREIGN KEY ("authorTeacherId") REFERENCES "teachers"("id") ON DELETE RESTRICT;

ALTER TABLE "assignment_feedbacks"
  ADD CONSTRAINT "assignment_feedbacks_storageObjectId_fkey"
  FOREIGN KEY ("storageObjectId") REFERENCES "storage_objects"("id") ON DELETE SET NULL;

ALTER TABLE "assignment_feedbacks"
  ADD CONSTRAINT "assignment_feedbacks_supersedesFeedbackId_fkey"
  FOREIGN KEY ("supersedesFeedbackId") REFERENCES "assignment_feedbacks"("id") ON DELETE SET NULL;

CREATE INDEX "assignment_feedbacks_submissionId_idx" ON "assignment_feedbacks" ("submissionId");
CREATE INDEX "assignment_feedbacks_authorTeacherId_status_idx"
  ON "assignment_feedbacks" ("authorTeacherId", "status");
CREATE INDEX "assignment_feedbacks_submissionId_version_idx"
  ON "assignment_feedbacks" ("submissionId", "version");

-- Un seul feedback DRAFT par submission (Coach ne peut avoir plusieurs
-- brouillons simultanés sur la même production).
CREATE UNIQUE INDEX "assignment_feedbacks_active_draft_uniq"
  ON "assignment_feedbacks" ("submissionId")
  WHERE "status" = 'DRAFT';

-- 5 · AuditAction P4.5 · Monde ----------------------------------------

ALTER TYPE "AuditAction" ADD VALUE 'ASSIGNMENT_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'ASSIGNMENT_PUBLISHED';
ALTER TYPE "AuditAction" ADD VALUE 'ASSIGNMENT_CLOSED';
ALTER TYPE "AuditAction" ADD VALUE 'ASSIGNMENT_ACCESS_DENIED';
ALTER TYPE "AuditAction" ADD VALUE 'SUBMISSION_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'SUBMISSION_SUBMITTED';
ALTER TYPE "AuditAction" ADD VALUE 'SUBMISSION_WITHDRAWN';
ALTER TYPE "AuditAction" ADD VALUE 'SUBMISSION_ACCESS_DENIED';
ALTER TYPE "AuditAction" ADD VALUE 'FEEDBACK_DRAFTED';
ALTER TYPE "AuditAction" ADD VALUE 'FEEDBACK_PUBLISHED';
ALTER TYPE "AuditAction" ADD VALUE 'FEEDBACK_ADDENDUM_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'FEEDBACK_ACCESS_DENIED';
ALTER TYPE "AuditAction" ADD VALUE 'STORAGE_UPLOAD_DENIED';
