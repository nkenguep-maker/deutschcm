-- P4.5-B2b1 · immutabilité columnar Monde (assignments / assignment_submissions
-- / assignment_feedbacks) via triggers BEFORE UPDATE.
--
-- Doctrine §2.2 brief B2b · les policies P4.5-B2a hardening `20260724000003`
-- verrouillent le status='DRAFT' en USING+WITH CHECK mais ne protègent pas
-- les colonnes de scope (classroomId, userId, authorId, version,
-- submissionId, supersedesFeedbackId, storageObjectId). Sans cette
-- protection, un Teacher qui possède 2 classrooms pourrait déplacer un
-- assignment DRAFT vers l'autre classroom, ou muter createdByTeacherId.
-- Idem un Student inscrit dans 2 classrooms pourrait bouger sa submission
-- DRAFT entre assignments.
--
-- Ce hardening est plus fort que WITH CHECK · les triggers s'appliquent à
-- TOUS les writes (service_role inclus). C'est OK car les services
-- légitimes ne mutent JAMAIS ces colonnes sur une ligne existante · les
-- nouvelles versions/addenda sont des INSERTs (nouvelle ligne, nouveau id).
--
-- Colonnes protégées ·
--   assignments             · classroomId, createdByTeacherId
--   assignment_submissions  · assignmentId, userId, version
--   assignment_feedbacks    · submissionId, authorTeacherId, version, supersedesFeedbackId, storageObjectId
--
-- Additive uniquement. Aucune migration historique modifiée. Aucune
-- policy modifiée (les policies status='DRAFT' de 00003 restent en place).

-- ── 1. assignments · classroomId + createdByTeacherId immutables ──────

CREATE OR REPLACE FUNCTION public.p4_5_b_enforce_assignment_scope_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW."classroomId" IS DISTINCT FROM OLD."classroomId" THEN
    RAISE EXCEPTION 'assignment_scope_immutable · cannot mutate classroomId (id=%)', OLD."id"
      USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."createdByTeacherId" IS DISTINCT FROM OLD."createdByTeacherId" THEN
    RAISE EXCEPTION 'assignment_scope_immutable · cannot mutate createdByTeacherId (id=%)', OLD."id"
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER assignments_scope_immutable
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.p4_5_b_enforce_assignment_scope_immutability();

-- ── 2. assignment_submissions · assignmentId + userId + version ───────

CREATE OR REPLACE FUNCTION public.p4_5_b_enforce_submission_scope_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW."assignmentId" IS DISTINCT FROM OLD."assignmentId" THEN
    RAISE EXCEPTION 'submission_scope_immutable · cannot mutate assignmentId (id=%)', OLD."id"
      USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."userId" IS DISTINCT FROM OLD."userId" THEN
    RAISE EXCEPTION 'submission_scope_immutable · cannot mutate userId (id=%)', OLD."id"
      USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."version" IS DISTINCT FROM OLD."version" THEN
    RAISE EXCEPTION 'submission_scope_immutable · cannot mutate version (id=%)', OLD."id"
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER assignment_submissions_scope_immutable
  BEFORE UPDATE ON public.assignment_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.p4_5_b_enforce_submission_scope_immutability();

-- ── 3. assignment_feedbacks · scope + relations invariables ───────────

CREATE OR REPLACE FUNCTION public.p4_5_b_enforce_feedback_scope_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW."submissionId" IS DISTINCT FROM OLD."submissionId" THEN
    RAISE EXCEPTION 'feedback_scope_immutable · cannot mutate submissionId (id=%)', OLD."id"
      USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."authorTeacherId" IS DISTINCT FROM OLD."authorTeacherId" THEN
    RAISE EXCEPTION 'feedback_scope_immutable · cannot mutate authorTeacherId (id=%)', OLD."id"
      USING ERRCODE = 'check_violation';
  END IF;
  -- version, supersedesFeedbackId, storageObjectId sont déjà protégés par
  -- p4_5_enforce_feedback_immutability (P4.5-A) après PUBLISHED. On les
  -- verrouille en plus sur TOUS les statuts (draft/published) · un
  -- Teacher ne peut pas rétroactivement changer sa "chaine" de feedback.
  IF NEW."version" IS DISTINCT FROM OLD."version" THEN
    RAISE EXCEPTION 'feedback_scope_immutable · cannot mutate version (id=%)', OLD."id"
      USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."supersedesFeedbackId" IS DISTINCT FROM OLD."supersedesFeedbackId" THEN
    RAISE EXCEPTION 'feedback_scope_immutable · cannot mutate supersedesFeedbackId (id=%)', OLD."id"
      USING ERRCODE = 'check_violation';
  END IF;
  -- Note · storageObjectId peut passer de NULL à valeur pendant DRAFT
  -- (workflow storage 2-phase P4.5-D) MAIS ne peut jamais changer une
  -- valeur déjà set. On protège contre le remplacement.
  IF OLD."storageObjectId" IS NOT NULL
    AND NEW."storageObjectId" IS DISTINCT FROM OLD."storageObjectId" THEN
    RAISE EXCEPTION 'feedback_scope_immutable · cannot replace storageObjectId once set (id=%)', OLD."id"
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER assignment_feedbacks_scope_immutable
  BEFORE UPDATE ON public.assignment_feedbacks
  FOR EACH ROW
  EXECUTE FUNCTION public.p4_5_b_enforce_feedback_scope_immutability();

-- ── 4. Notes doctrine ────────────────────────────────────────────────
-- Les triggers s'exécutent avant les triggers d'immutabilité P4.5-A
-- (`p4_5_enforce_feedback_immutability` / `_submission_immutability`).
-- L'ordre alphabétique des noms de triggers (Postgres default) place
-- ces triggers scope-immutability APRÈS les immutability status-based ·
-- si les deux détectent une violation, celui appelé en premier gagne.
-- Les deux sont des `RAISE EXCEPTION` · aucune divergence de
-- comportement observable côté caller.
