-- P4.5-B2b1 · versioning submissions Monde · corrige la contrainte unique
-- legacy qui empêche plusieurs versions par (assignment, student).
--
-- Problème découvert par les fixtures P4.5-B · `AssignmentSubmission`
-- avait une contrainte `UNIQUE(assignmentId, userId)` héritée de la
-- migration `20260509170326_add_teacher_classroom_center` (V1 legacy
-- pré-P4.5). Cette contrainte empêche · plusieurs versions DRAFT / SUBMITTED
-- / SUPERSEDED pour la même paire (assignment, student), ce qui est
-- explicitement requis par le workflow versioning P4.5-B (§6 brief).
--
-- Solution · dropper la contrainte legacy et la remplacer par
-- `UNIQUE(assignmentId, userId, version)` · plusieurs versions sont
-- autorisées tant qu'elles portent des numéros distincts. Le partial
-- unique `assignment_submissions_active_draft_uniq` (P4.5-A) garantit
-- toujours qu'il n'y a qu'un seul DRAFT actif à la fois.
--
-- Additive · aucune migration historique modifiée. La contrainte legacy
-- est dropped puis recréée avec version pour minimiser le risque de
-- casser des queries existantes qui référencent le nom d'index.

DROP INDEX IF EXISTS "assignment_submissions_assignmentId_userId_key";

CREATE UNIQUE INDEX "assignment_submissions_assignmentId_userId_version_key"
  ON "assignment_submissions" ("assignmentId", "userId", "version");

-- Note · le partial unique `assignment_submissions_active_draft_uniq`
-- posé par P4.5-A `20260723000009` garantit toujours l'invariant "un
-- seul DRAFT actif par (assignmentId, userId)" · il n'est pas modifié.
