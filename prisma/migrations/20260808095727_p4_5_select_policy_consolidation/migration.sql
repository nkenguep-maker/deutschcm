-- P4.5/P4.7 · consolidate equivalent permissive SELECT policies
--
-- PostgreSQL combines permissive RLS policies for the same role/action with OR.
-- These pairs therefore keep exactly the same authorization semantics while
-- avoiding repeated policy evaluation reported by the Supabase advisor.

DROP POLICY IF EXISTS "p4_5_assignments_select_teacher" ON public.assignments;
DROP POLICY IF EXISTS "p4_5_assignments_select_student_published" ON public.assignments;
CREATE POLICY "p4_5_assignments_select_authorized"
  ON public.assignments FOR SELECT TO authenticated
  USING (
    private.is_teacher_for_assignment(id, private.current_app_user_id())
    OR (
      status = 'PUBLISHED'
      AND private.is_student_for_assignment(id, private.current_app_user_id())
    )
  );

DROP POLICY IF EXISTS "p4_5_assignment_submissions_select_teacher" ON public.assignment_submissions;
DROP POLICY IF EXISTS "p4_5_assignment_submissions_select_student_own" ON public.assignment_submissions;
CREATE POLICY "p4_5_assignment_submissions_select_authorized"
  ON public.assignment_submissions FOR SELECT TO authenticated
  USING (
    private.is_teacher_for_assignment("assignmentId", private.current_app_user_id())
    OR "userId" = private.current_app_user_id()
  );

DROP POLICY IF EXISTS "p4_5_assignment_feedbacks_select_teacher_author" ON public.assignment_feedbacks;
DROP POLICY IF EXISTS "p4_5_assignment_feedbacks_select_student_own_published" ON public.assignment_feedbacks;
CREATE POLICY "p4_5_assignment_feedbacks_select_authorized"
  ON public.assignment_feedbacks FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.teachers t
      WHERE t.id = "authorTeacherId"
        AND t."userId" = private.current_app_user_id()
    )
    OR (
      status = 'PUBLISHED'
      AND EXISTS (
        SELECT 1
        FROM public.assignment_submissions s
        WHERE s.id = "submissionId"
          AND s."userId" = private.current_app_user_id()
      )
    )
  );

DROP POLICY IF EXISTS "p4_5_circle_assignments_select_coach" ON public.circle_assignments;
DROP POLICY IF EXISTS "p4_5_circle_assignments_select_parent_published" ON public.circle_assignments;
CREATE POLICY "p4_5_circle_assignments_select_authorized"
  ON public.circle_assignments FOR SELECT TO authenticated
  USING (
    private.is_active_circle_coach("circleId", private.current_app_user_id())
    OR (
      status = 'PUBLISHED'
      AND EXISTS (
        SELECT 1
        FROM public.circle_memberships cm
        JOIN public.child_profiles cp ON cp.id = cm."childProfileId"
        WHERE cm."circleId" = circle_assignments."circleId"
          AND cm.role = 'CHILD'
          AND cm.status = 'ACTIVE'
          AND cp."parentUserId" = private.current_app_user_id()
      )
    )
  );

DROP POLICY IF EXISTS "p4_5_circle_assignment_targets_select_coach" ON public.circle_assignment_targets;
DROP POLICY IF EXISTS "p4_5_circle_assignment_targets_select_parent" ON public.circle_assignment_targets;
CREATE POLICY "p4_5_circle_assignment_targets_select_authorized"
  ON public.circle_assignment_targets FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.circle_assignments a
      WHERE a.id = "assignmentId"
        AND private.is_active_circle_coach(a."circleId", private.current_app_user_id())
    )
    OR private.is_child_parent("childProfileId", private.current_app_user_id())
  );

DROP POLICY IF EXISTS "p4_5_circle_feedbacks_select_coach_author" ON public.circle_feedbacks;
DROP POLICY IF EXISTS "p4_5_circle_feedbacks_select_parent_published" ON public.circle_feedbacks;
CREATE POLICY "p4_5_circle_feedbacks_select_authorized"
  ON public.circle_feedbacks FOR SELECT TO authenticated
  USING (
    "authorCoachUserId" = private.current_app_user_id()
    OR (
      status = 'PUBLISHED'
      AND private.can_view_circle_submission("submissionId", private.current_app_user_id())
    )
  );
