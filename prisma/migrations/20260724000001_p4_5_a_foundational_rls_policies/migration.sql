-- P4.5-A closure · policies RLS fondatrices SELECT + helpers Postgres.
--
-- Doctrine · les WRITES restent différées vers P4.5-B/C avec les routes
-- API (services `authenticated` write via service_role). Ici on pose ·
--   1. Helpers Postgres SECURITY DEFINER · réutilisables par toutes les
--      policies P4.5 A/B/C.
--   2. Policies SELECT pour Teacher/Student sur Monde + Coach/Parent sur
--      Racines. Aucun bypass `is_yema_admin()` global.
--
-- Aucune policy INSERT/UPDATE/DELETE créée en P4.5-A · sans policy, RLS
-- deny-by-default refuse tout write depuis anon/authenticated. Le seam
-- Prisma (service_role) bypasse RLS et applique ses propres checks
-- applicatifs. Le brief §6 documente cette délégation.

-- ── 1. Helpers Postgres (SECURITY DEFINER search_path pinned) ─────────

-- Vrai si `p_user_id` est le Teacher qui a créé l'assignment `p_assignment_id`
-- OU qui possède la Classroom associée. Un Teacher n'accède qu'à ses
-- propres assignments.
CREATE OR REPLACE FUNCTION public.is_teacher_for_assignment(
  p_assignment_id TEXT,
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
    FROM public.assignments a
    JOIN public.classrooms c ON c.id = a."classroomId"
    JOIN public.teachers t ON t.id = c."teacherId"
    WHERE a.id = p_assignment_id
      AND t."userId" = p_user_id
  );
$$;

-- Vrai si `p_user_id` est actif dans la classroom ciblée par
-- l'assignment · sert aux policies de lecture Student sur assignments
-- publiés + ses submissions/feedbacks associés.
CREATE OR REPLACE FUNCTION public.is_student_for_assignment(
  p_assignment_id TEXT,
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
    FROM public.assignments a
    JOIN public.classroom_enrollments e ON e."classroomId" = a."classroomId"
    WHERE a.id = p_assignment_id
      AND e."userId" = p_user_id
      AND e."isActive" = true
  );
$$;

-- Vrai si `p_user_id` est le parent (parentUserId) du ChildProfile ciblé.
-- Utilisé pour Racines · un parent voit uniquement les productions de
-- SES enfants, jamais celles d'un autre foyer.
CREATE OR REPLACE FUNCTION public.is_child_parent(
  p_child_profile_id TEXT,
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
    FROM public.child_profiles cp
    WHERE cp.id = p_child_profile_id
      AND cp."parentUserId" = p_user_id
  );
$$;

-- Vrai si `p_user_id` peut lire la submission ciblée · Coach ACTIVE du
-- Circle contenant cette submission OU parent du ChildProfile
-- (parent OWNER/ADULT du Household). Utilisé pour policies SELECT sur
-- circle_submissions + circle_feedbacks + circle_submission_replies.
CREATE OR REPLACE FUNCTION public.can_view_circle_submission(
  p_submission_id TEXT,
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
    FROM public.circle_submissions s
    JOIN public.circle_assignments a ON a.id = s."assignmentId"
    LEFT JOIN public.circle_memberships cm_coach
      ON cm_coach."circleId" = a."circleId"
     AND cm_coach."userId" = p_user_id
     AND cm_coach.role = 'COACH'
     AND cm_coach.status = 'ACTIVE'
    LEFT JOIN public.child_profiles cp ON cp.id = s."childProfileId"
    WHERE s.id = p_submission_id
      AND (cm_coach.id IS NOT NULL OR cp."parentUserId" = p_user_id)
  );
$$;

-- Grants · fonctions accessibles depuis role `authenticated` (JWT clients).
REVOKE ALL ON FUNCTION public.is_teacher_for_assignment(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_student_for_assignment(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_child_parent(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_view_circle_submission(TEXT, TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_teacher_for_assignment(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_student_for_assignment(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_child_parent(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_circle_submission(TEXT, TEXT) TO authenticated;

-- ── 2. Policies SELECT · Monde ────────────────────────────────────────

-- assignments · Teacher lit ses propres · Student lit uniquement les
-- assignments PUBLISHED de ses classes actives.
CREATE POLICY "p4_5_assignments_select_teacher"
  ON public.assignments
  FOR SELECT
  TO authenticated
  USING (public.is_teacher_for_assignment(id, auth.uid()::text));

CREATE POLICY "p4_5_assignments_select_student_published"
  ON public.assignments
  FOR SELECT
  TO authenticated
  USING (
    status = 'PUBLISHED'
    AND public.is_student_for_assignment(id, auth.uid()::text)
  );

-- assignment_submissions · Teacher lit celles de ses classes · Student
-- lit uniquement ses propres.
CREATE POLICY "p4_5_assignment_submissions_select_teacher"
  ON public.assignment_submissions
  FOR SELECT
  TO authenticated
  USING (public.is_teacher_for_assignment("assignmentId", auth.uid()::text));

CREATE POLICY "p4_5_assignment_submissions_select_student_own"
  ON public.assignment_submissions
  FOR SELECT
  TO authenticated
  USING ("userId" = auth.uid()::text);

-- assignment_feedbacks · Teacher auteur lit les siens · Student lit
-- uniquement les feedbacks PUBLISHED de ses propres submissions.
CREATE POLICY "p4_5_assignment_feedbacks_select_teacher_author"
  ON public.assignment_feedbacks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers t
      WHERE t.id = "authorTeacherId" AND t."userId" = auth.uid()::text
    )
  );

CREATE POLICY "p4_5_assignment_feedbacks_select_student_own_published"
  ON public.assignment_feedbacks
  FOR SELECT
  TO authenticated
  USING (
    status = 'PUBLISHED'
    AND EXISTS (
      SELECT 1 FROM public.assignment_submissions s
      WHERE s.id = "submissionId"
        AND s."userId" = auth.uid()::text
    )
  );

-- ── 3. Policies SELECT · Racines ──────────────────────────────────────

-- circle_assignments · Coach ACTIVE du Circle lit tous les statuts · Parent
-- lit uniquement PUBLISHED des Circles de ses enfants (via household).
CREATE POLICY "p4_5_circle_assignments_select_coach"
  ON public.circle_assignments
  FOR SELECT
  TO authenticated
  USING (public.is_active_circle_coach("circleId", auth.uid()::text));

CREATE POLICY "p4_5_circle_assignments_select_parent_published"
  ON public.circle_assignments
  FOR SELECT
  TO authenticated
  USING (
    status = 'PUBLISHED'
    AND EXISTS (
      SELECT 1
      FROM public.circle_memberships cm
      JOIN public.child_profiles cp ON cp.id = cm."childProfileId"
      WHERE cm."circleId" = circle_assignments."circleId"
        AND cm.role = 'CHILD'
        AND cm.status = 'ACTIVE'
        AND cp."parentUserId" = auth.uid()::text
    )
  );

-- circle_assignment_targets · même règle que l'assignment parent.
CREATE POLICY "p4_5_circle_assignment_targets_select_coach"
  ON public.circle_assignment_targets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.circle_assignments a
      WHERE a.id = "assignmentId"
        AND public.is_active_circle_coach(a."circleId", auth.uid()::text)
    )
  );

CREATE POLICY "p4_5_circle_assignment_targets_select_parent"
  ON public.circle_assignment_targets
  FOR SELECT
  TO authenticated
  USING (public.is_child_parent("childProfileId", auth.uid()::text));

-- circle_submissions · Coach ACTIVE + parent du childProfile.
CREATE POLICY "p4_5_circle_submissions_select"
  ON public.circle_submissions
  FOR SELECT
  TO authenticated
  USING (public.can_view_circle_submission(id, auth.uid()::text));

-- circle_feedbacks · Coach auteur (ACTIVE) OU parent du child, feedback PUBLISHED.
CREATE POLICY "p4_5_circle_feedbacks_select_coach_author"
  ON public.circle_feedbacks
  FOR SELECT
  TO authenticated
  USING ("authorCoachUserId" = auth.uid()::text);

CREATE POLICY "p4_5_circle_feedbacks_select_parent_published"
  ON public.circle_feedbacks
  FOR SELECT
  TO authenticated
  USING (
    status = 'PUBLISHED'
    AND public.can_view_circle_submission("submissionId", auth.uid()::text)
  );

-- circle_submission_replies · Coach ACTIVE OU parent du child associé.
CREATE POLICY "p4_5_circle_submission_replies_select"
  ON public.circle_submission_replies
  FOR SELECT
  TO authenticated
  USING (public.can_view_circle_submission("submissionId", auth.uid()::text));

-- ── 4. Note · policies WRITE différées P4.5-B/C ──────────────────────
-- Aucune policy INSERT/UPDATE/DELETE créée ici. Les writes P4.5 passent
-- par le seam Prisma (service_role bypasse RLS) avec ces guards ·
--   - assignments · assignCoach permission (teacher owns classroom)
--   - submissions · student enrolled OR parent owns child
--   - feedbacks · immutable après PUBLISHED (triggers)
--   - replies · parent OWNER/ADULT OU coach ACTIVE, body 1..1000 CHECK
-- Voir docs/YEMA_P4_5_ASSIGNMENTS_SUBMISSIONS_FEEDBACK.md §9 + §6.
