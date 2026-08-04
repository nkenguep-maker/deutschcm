-- P4.5-B2a · hardening RLS WRITE Monde après préflight §1.
--
-- Préflight du brief P4.5-B2 §1.1 a détecté 3 policies dont le WITH CHECK
-- n'exigeait pas `status='DRAFT'`, ce qui permettait à un JWT direct de
-- muter le status via une simple UPDATE (les triggers d'immutabilité
-- couvrent SUBMITTED/PUBLISHED mais assignments n'en a pas). Cette
-- migration remplace les 3 policies concernées en ajoutant la contrainte
-- explicite dans USING et WITH CHECK.
--
-- Additive · aucune migration historique modifiée. Ne modifie pas
-- 20260724000002 · dropped + recréé même nom, même colonnes.

-- ── assignments · UPDATE strictement DRAFT ───────────────────────────

DROP POLICY IF EXISTS "p4_5_b_assignments_update_teacher_own"
  ON public.assignments;

CREATE POLICY "p4_5_b_assignments_update_teacher_own"
  ON public.assignments
  FOR UPDATE
  TO authenticated
  USING (
    public.is_teacher_for_classroom_v2("classroomId", auth.uid()::text)
    AND status = 'DRAFT'
  )
  WITH CHECK (
    public.is_teacher_for_classroom_v2("classroomId", auth.uid()::text)
    AND status = 'DRAFT'
  );

-- ── assignment_submissions · UPDATE strictement DRAFT (avant + après) ─
--
-- Le USING actuel avait déjà `status='DRAFT'` mais WITH CHECK ne
-- l'exigeait pas · un JWT Student pouvait UPDATE ... SET status='SUBMITTED'
-- (row avant = DRAFT donc USING pass, row après = SUBMITTED · WITH CHECK
-- laxe pass). Le trigger d'immutabilité `p4_5_enforce_submission_immutability`
-- ne bloque QUE quand OLD.status = 'SUBMITTED' · il ne couvre pas
-- DRAFT → SUBMITTED direct.

DROP POLICY IF EXISTS "p4_5_b_assignment_submissions_update_student_draft"
  ON public.assignment_submissions;

CREATE POLICY "p4_5_b_assignment_submissions_update_student_draft"
  ON public.assignment_submissions
  FOR UPDATE
  TO authenticated
  USING (
    "userId" = auth.uid()::text
    AND status = 'DRAFT'
  )
  WITH CHECK (
    "userId" = auth.uid()::text
    AND status = 'DRAFT'
  );

-- ── assignment_feedbacks · UPDATE strictement DRAFT (avant + après) ──

DROP POLICY IF EXISTS "p4_5_b_assignment_feedbacks_update_teacher_draft"
  ON public.assignment_feedbacks;

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
    status = 'DRAFT'
    AND EXISTS (
      SELECT 1 FROM public.teachers t
      WHERE t.id = "authorTeacherId"
        AND t."userId" = auth.uid()::text
    )
  );

-- ── Notes doctrine ────────────────────────────────────────────────────
-- Les transitions DRAFT→PUBLISHED, PUBLISHED→CLOSED, SUBMITTED, ADDENDUM
-- ne sont plus possibles depuis un JWT authenticated direct · seul le
-- service_role via le seam Prisma peut effectuer ces mutations, avec
-- audit in-tx et guards applicatifs.
