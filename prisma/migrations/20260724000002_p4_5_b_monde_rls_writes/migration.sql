-- P4.5-B1 · policies RLS WRITE Monde (assignments / assignment_submissions
-- / assignment_feedbacks). P4.5-A a posé les policies SELECT + helpers
-- Postgres. Ici on ouvre INSERT/UPDATE scopées côté client
-- authenticated (Teacher, Student), sans bypass admin global.
--
-- Doctrine ·
--   - Aucun bypass admin global (voir §12 doctrine).
--   - Toutes les écritures passent par le seam Prisma en service_role
--     (bypass RLS) avec guards applicatifs. Ces policies servent
--     uniquement de dernière barrière si un client authenticated devait
--     ouvrir une session Postgres directe (via PostgREST par ex.).
--   - Les transitions de statut (DRAFT→PUBLISHED etc.) sont contraintes
--     PAR-DESSUS par le trigger d'immutabilité déjà posé en P4.5-A
--     (`p4_5_enforce_feedback_immutability`, `p4_5_enforce_submission_immutability`).
--   - Le contenu Student reste protégé même côté Teacher (Teacher n'a
--     aucune policy UPDATE sur assignment_submissions).

-- ── 1. Helpers additifs ────────────────────────────────────────────────

-- Vrai si `p_user_id` est le Teacher qui possède la Classroom `p_classroom_id`.
-- Utilisé pour policies INSERT/UPDATE assignments (ADD à la version P4.5-A
-- qui n'avait besoin que du helper based-on-assignmentId).
CREATE OR REPLACE FUNCTION public.is_teacher_for_classroom_v2(
  p_classroom_id TEXT,
  p_user_id TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.classrooms c
    JOIN public.teachers t ON t.id = c."teacherId"
    WHERE c.id = p_classroom_id
      AND t."userId" = p_user_id
  );
$$;

REVOKE ALL ON FUNCTION public.is_teacher_for_classroom_v2(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_teacher_for_classroom_v2(TEXT, TEXT) TO authenticated;

-- ── 2. Policies WRITE · assignments ────────────────────────────────────

-- Teacher peut INSERT un assignment ssi il possède la Classroom cible.
-- Le trigger d'immutabilité (si posé ultérieurement sur assignments)
-- garantit que le PUBLISHED n'est pas re-mutable. Ici on s'assure
-- seulement du propriétaire.
CREATE POLICY "p4_5_b_assignments_insert_teacher_own"
  ON public.assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_teacher_for_classroom_v2("classroomId", auth.uid()::text));

-- Teacher peut UPDATE un assignment ssi il possède la Classroom cible
-- ET l'assignment est encore DRAFT (transition de statut applicative).
-- Après PUBLISHED, la modification en place du contenu principal est
-- interdite (§5) · c'est appliqué côté service. Ici la policy autorise
-- UPDATE mais le seam Prisma n'écrit que les transitions
-- DRAFT→PUBLISHED/CLOSED/ARCHIVED (immutabilité contenu).
CREATE POLICY "p4_5_b_assignments_update_teacher_own"
  ON public.assignments
  FOR UPDATE
  TO authenticated
  USING (public.is_teacher_for_classroom_v2("classroomId", auth.uid()::text))
  WITH CHECK (public.is_teacher_for_classroom_v2("classroomId", auth.uid()::text));

-- Aucune policy INSERT/UPDATE pour Student · deny-by-default RLS bloque.

-- ── 3. Policies WRITE · assignment_submissions ────────────────────────

-- Student peut INSERT une submission ssi ·
--   - il est étudiant actif dans la classroom cible ;
--   - l'assignment est PUBLISHED (non CLOSED/ARCHIVED) ;
--   - `userId` de la row est bien lui-même.
CREATE POLICY "p4_5_b_assignment_submissions_insert_student_own"
  ON public.assignment_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    "userId" = auth.uid()::text
    AND EXISTS (
      SELECT 1
      FROM public.assignments a
      WHERE a.id = "assignmentId"
        AND a.status = 'PUBLISHED'
        AND public.is_student_for_assignment(a.id, auth.uid()::text)
    )
  );

-- Student peut UPDATE sa submission ssi ·
--   - c'est la sienne ;
--   - status = DRAFT (transitions vers SUBMITTED/WITHDRAWN via trigger).
-- Le trigger `p4_5_enforce_submission_immutability` bloque toute mutation
-- du contenu après SUBMITTED · cette policy autorise uniquement DRAFT.
CREATE POLICY "p4_5_b_assignment_submissions_update_student_draft"
  ON public.assignment_submissions
  FOR UPDATE
  TO authenticated
  USING (
    "userId" = auth.uid()::text
    AND status = 'DRAFT'
  )
  WITH CHECK ("userId" = auth.uid()::text);

-- Aucune policy INSERT/UPDATE pour Teacher sur les submissions · Teacher
-- ne peut jamais toucher au contenu Student.
-- Aucune policy DELETE nulle part · les submissions ne sont pas
-- supprimables (soft-delete via WITHDRAWN/SUPERSEDED côté service).

-- ── 4. Policies WRITE · assignment_feedbacks ──────────────────────────

-- Teacher peut INSERT un feedback ssi ·
--   - il possède la Classroom qui contient la submission cible ;
--   - le Teacher.userId matche `authorTeacherId`.
CREATE POLICY "p4_5_b_assignment_feedbacks_insert_teacher_own"
  ON public.assignment_feedbacks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.assignment_submissions s
      JOIN public.teachers t ON t.id = "authorTeacherId"
      WHERE s.id = "submissionId"
        AND t."userId" = auth.uid()::text
        AND public.is_teacher_for_assignment(s."assignmentId", auth.uid()::text)
    )
  );

-- Teacher peut UPDATE un feedback ssi ·
--   - il en est l'auteur ;
--   - status = DRAFT (le trigger d'immutabilité bloque PUBLISHED).
CREATE POLICY "p4_5_b_assignment_feedbacks_update_teacher_draft"
  ON public.assignment_feedbacks
  FOR UPDATE
  TO authenticated
  USING (
    status = 'DRAFT'
    AND EXISTS (
      SELECT 1 FROM public.teachers t
      WHERE t.id = "authorTeacherId"
        AND t."userId" = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teachers t
      WHERE t.id = "authorTeacherId"
        AND t."userId" = auth.uid()::text
    )
  );

-- Aucune policy INSERT/UPDATE pour Student sur feedbacks.
-- Aucune policy DELETE · feedback publié est immuable (P4.5-A trigger).

-- ── 5. Notes doctrine ──────────────────────────────────────────────────
-- - Les transitions DRAFT→PUBLISHED, PUBLISHED→CLOSED, SUBMITTED→WITHDRAWN
--   restent contraintes CÔTÉ SERVICE avec transactions Serializable +
--   audit in-tx (voir services P4.5-B `src/lib/assignments/*.ts`).
-- - Les additions ne modifient AUCUNE migration historique ni P4.5-A.
-- - Aucun bypass admin global n'est introduit dans ces policies.
