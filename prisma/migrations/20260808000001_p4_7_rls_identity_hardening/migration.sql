-- P4.7 · RLS identity + helper exposure hardening
--
-- Goals:
--   1. Keep Supabase auth UID and YEMA User.id as two distinct identity spaces.
--      Policies must resolve auth.uid() -> users.supabaseId -> users.id.
--   2. Remove internal SECURITY DEFINER helpers from the exposed `public`
--      schema while preserving their use from RLS / Realtime policies.
--   3. Prevent Realtime authorization helpers from accepting a caller-chosen
--      Supabase UID as an authorization oracle.
--   4. Remove the legacy child_profiles auth.role() policy. service_role
--      bypasses RLS; anon/authenticated remain deny-by-default.
--
-- This migration is intentionally idempotent. P-1 may receive the SQL once
-- for isolated validation before Prisma records the migration normally.

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

-- Move internal helpers out of the PostgREST-exposed public schema.
-- Stored RLS/trigger references keep the same function OIDs across ALTER
-- FUNCTION ... SET SCHEMA. The policies rewritten below use explicit private.*
-- names so future dumps/migrations remain clear.
DO $p4_7_move$
DECLARE
  fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'current_app_user_id()',
    'is_yema_admin(text)',
    'is_teacher(text)',
    'is_teacher_for_classroom(text,text)',
    'is_teacher_for_classroom_v2(text,text)',
    'is_teacher_for_assignment(text,text)',
    'is_active_student_in_classroom(text,text)',
    'is_student_for_assignment(text,text)',
    'is_center_admin(text,text)',
    'is_roots_coach(text)',
    'is_active_circle_coach(text,text)',
    'can_roots_coach_view_child(text,text)',
    'is_child_parent(text,text)',
    'can_view_circle_submission(text,text)',
    'is_circle_coach(text,text)',
    'is_circle_member(text,text)',
    'is_circle_owner(text,text)',
    'is_class_member(text,text)',
    'is_household_member(text,text)',
    'get_roots_coach_assigned_profiles()',
    'messaging_can_access_conversation(uuid,text)',
    'messaging_is_inbox_owner(uuid,text)',
    'messaging_topic_kind(text)',
    'messaging_topic_id(text)',
    'p4_5_b_enforce_assignment_scope_immutability()',
    'p4_5_b_enforce_feedback_scope_immutability()',
    'p4_5_b_enforce_submission_scope_immutability()',
    'p4_5_enforce_feedback_immutability()',
    'p4_5_enforce_submission_immutability()'
  ]
  LOOP
    IF to_regprocedure('public.' || fn) IS NOT NULL THEN
      EXECUTE 'ALTER FUNCTION public.' || fn || ' SET SCHEMA private';
    END IF;
  END LOOP;
END
$p4_7_move$;

-- Canonical identity seam: Supabase auth UUID -> YEMA application User.id.
CREATE OR REPLACE FUNCTION private.current_app_user_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT u.id
  FROM public.users u
  WHERE u."supabaseId" = (SELECT auth.uid())::text
  LIMIT 1;
$$;

-- This projection is retained for compatibility/tests but is no longer a
-- public RPC. The production workspace reads the same scope through Prisma.
CREATE OR REPLACE FUNCTION private.get_roots_coach_assigned_profiles()
RETURNS TABLE(
  id text,
  display_name text,
  avatar_animal text,
  age_band text,
  active_langue text,
  circle_id text,
  circle_language text,
  joined_at timestamp without time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    cp.id,
    cp.prenom AS display_name,
    cp."avatarAnimal" AS avatar_animal,
    CASE
      WHEN cp.age BETWEEN 4 AND 6 THEN '4-6'
      WHEN cp.age BETWEEN 7 AND 9 THEN '7-9'
      WHEN cp.age BETWEEN 10 AND 12 THEN '10-12'
      WHEN cp.age BETWEEN 13 AND 15 THEN '13-15'
      WHEN cp.age BETWEEN 16 AND 17 THEN '16-17'
      ELSE 'unknown'
    END AS age_band,
    cp."activeLangue" AS active_langue,
    c.id AS circle_id,
    c.language::text AS circle_language,
    child_mem."joinedAt" AS joined_at
  FROM public.circle_memberships child_mem
  JOIN public.circles c ON c.id = child_mem."circleId"
  JOIN public.child_profiles cp ON cp.id = child_mem."childProfileId"
  JOIN public.circle_memberships coach_mem ON coach_mem."circleId" = c.id
  WHERE child_mem.role = 'CHILD'
    AND child_mem.status = 'ACTIVE'
    AND c.status = 'ACTIVE'
    AND coach_mem."userId" = private.current_app_user_id()
    AND coach_mem.role = 'COACH'
    AND coach_mem.status = 'ACTIVE';
$$;

-- Realtime helpers keep their existing signature because policies already
-- depend on them, but the supplied UUID must equal the authenticated JWT UID.
-- This closes direct-RPC membership/oracle checks with another user's UUID.
CREATE OR REPLACE FUNCTION private.messaging_can_access_conversation(
  _supabase_uid uuid,
  _conversation_id text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    _supabase_uid IS NOT NULL
    AND _supabase_uid = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.messaging_conversation_participants mcp
      INNER JOIN public.users u ON u.id = mcp."userId"
      WHERE u."supabaseId" = _supabase_uid::text
        AND mcp."conversationId" = _conversation_id
        AND mcp."leftAt" IS NULL
    );
$$;

CREATE OR REPLACE FUNCTION private.messaging_is_inbox_owner(
  _supabase_uid uuid,
  _user_id text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    _supabase_uid IS NOT NULL
    AND _supabase_uid = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u."supabaseId" = _supabase_uid::text
        AND u.id = _user_id
    );
$$;

-- Pure topic parsers do not need any search path at all.
CREATE OR REPLACE FUNCTION private.messaging_topic_kind(_topic text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN _topic LIKE 'msg:conv:%' THEN 'conv'
    WHEN _topic LIKE 'msg:inbox:user:%' THEN 'inbox_user'
    WHEN _topic LIKE 'msg:inbox:child:%' THEN 'inbox_child'
    ELSE NULL
  END;
$$;

CREATE OR REPLACE FUNCTION private.messaging_topic_id(_topic text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN _topic LIKE 'msg:conv:%' THEN substring(_topic FROM 10)
    WHEN _topic LIKE 'msg:inbox:user:%' THEN substring(_topic FROM 16)
    WHEN _topic LIKE 'msg:inbox:child:%' THEN substring(_topic FROM 17)
    ELSE NULL
  END;
$$;

-- child_profiles is service-only. service_role bypasses RLS, therefore an
-- auth.role() = 'service_role' public policy is redundant and deprecated.
DROP POLICY IF EXISTS "child_profiles_service_only" ON public.child_profiles;

-- ---------------------------------------------------------------------
-- P4.5 policies · use application User.id, never auth.uid() directly.
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS "p4_5_assignments_select_teacher" ON public.assignments;
CREATE POLICY "p4_5_assignments_select_teacher"
  ON public.assignments FOR SELECT TO authenticated
  USING (private.is_teacher_for_assignment(id, private.current_app_user_id()));

DROP POLICY IF EXISTS "p4_5_assignments_select_student_published" ON public.assignments;
CREATE POLICY "p4_5_assignments_select_student_published"
  ON public.assignments FOR SELECT TO authenticated
  USING (
    status = 'PUBLISHED'
    AND private.is_student_for_assignment(id, private.current_app_user_id())
  );

DROP POLICY IF EXISTS "p4_5_assignment_submissions_select_teacher" ON public.assignment_submissions;
CREATE POLICY "p4_5_assignment_submissions_select_teacher"
  ON public.assignment_submissions FOR SELECT TO authenticated
  USING (
    private.is_teacher_for_assignment("assignmentId", private.current_app_user_id())
  );

DROP POLICY IF EXISTS "p4_5_assignment_submissions_select_student_own" ON public.assignment_submissions;
CREATE POLICY "p4_5_assignment_submissions_select_student_own"
  ON public.assignment_submissions FOR SELECT TO authenticated
  USING ("userId" = private.current_app_user_id());

DROP POLICY IF EXISTS "p4_5_assignment_feedbacks_select_teacher_author" ON public.assignment_feedbacks;
CREATE POLICY "p4_5_assignment_feedbacks_select_teacher_author"
  ON public.assignment_feedbacks FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.teachers t
      WHERE t.id = "authorTeacherId"
        AND t."userId" = private.current_app_user_id()
    )
  );

DROP POLICY IF EXISTS "p4_5_assignment_feedbacks_select_student_own_published" ON public.assignment_feedbacks;
CREATE POLICY "p4_5_assignment_feedbacks_select_student_own_published"
  ON public.assignment_feedbacks FOR SELECT TO authenticated
  USING (
    status = 'PUBLISHED'
    AND EXISTS (
      SELECT 1
      FROM public.assignment_submissions s
      WHERE s.id = "submissionId"
        AND s."userId" = private.current_app_user_id()
    )
  );

DROP POLICY IF EXISTS "p4_5_b_assignments_insert_teacher_own" ON public.assignments;
CREATE POLICY "p4_5_b_assignments_insert_teacher_own"
  ON public.assignments FOR INSERT TO authenticated
  WITH CHECK (
    private.is_teacher_for_classroom_v2("classroomId", private.current_app_user_id())
  );

DROP POLICY IF EXISTS "p4_5_b_assignments_update_teacher_own" ON public.assignments;
CREATE POLICY "p4_5_b_assignments_update_teacher_own"
  ON public.assignments FOR UPDATE TO authenticated
  USING (
    private.is_teacher_for_classroom_v2("classroomId", private.current_app_user_id())
    AND status = 'DRAFT'
  )
  WITH CHECK (
    private.is_teacher_for_classroom_v2("classroomId", private.current_app_user_id())
    AND status = 'DRAFT'
  );

DROP POLICY IF EXISTS "p4_5_b_assignment_submissions_insert_student_own" ON public.assignment_submissions;
CREATE POLICY "p4_5_b_assignment_submissions_insert_student_own"
  ON public.assignment_submissions FOR INSERT TO authenticated
  WITH CHECK (
    "userId" = private.current_app_user_id()
    AND EXISTS (
      SELECT 1
      FROM public.assignments a
      WHERE a.id = "assignmentId"
        AND a.status = 'PUBLISHED'
        AND private.is_student_for_assignment(a.id, private.current_app_user_id())
    )
  );

DROP POLICY IF EXISTS "p4_5_b_assignment_submissions_update_student_draft" ON public.assignment_submissions;
CREATE POLICY "p4_5_b_assignment_submissions_update_student_draft"
  ON public.assignment_submissions FOR UPDATE TO authenticated
  USING (
    "userId" = private.current_app_user_id()
    AND status = 'DRAFT'
  )
  WITH CHECK (
    "userId" = private.current_app_user_id()
    AND status = 'DRAFT'
  );

DROP POLICY IF EXISTS "p4_5_b_assignment_feedbacks_insert_teacher_own" ON public.assignment_feedbacks;
CREATE POLICY "p4_5_b_assignment_feedbacks_insert_teacher_own"
  ON public.assignment_feedbacks FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.assignment_submissions s
      JOIN public.teachers t ON t.id = "authorTeacherId"
      WHERE s.id = "submissionId"
        AND t."userId" = private.current_app_user_id()
        AND private.is_teacher_for_assignment(
          s."assignmentId",
          private.current_app_user_id()
        )
    )
  );

DROP POLICY IF EXISTS "p4_5_b_assignment_feedbacks_update_teacher_draft" ON public.assignment_feedbacks;
CREATE POLICY "p4_5_b_assignment_feedbacks_update_teacher_draft"
  ON public.assignment_feedbacks FOR UPDATE TO authenticated
  USING (
    status = 'DRAFT'
    AND EXISTS (
      SELECT 1
      FROM public.teachers t
      WHERE t.id = "authorTeacherId"
        AND t."userId" = private.current_app_user_id()
    )
  )
  WITH CHECK (
    status = 'DRAFT'
    AND EXISTS (
      SELECT 1
      FROM public.teachers t
      WHERE t.id = "authorTeacherId"
        AND t."userId" = private.current_app_user_id()
    )
  );

DROP POLICY IF EXISTS "p4_5_circle_assignments_select_coach" ON public.circle_assignments;
CREATE POLICY "p4_5_circle_assignments_select_coach"
  ON public.circle_assignments FOR SELECT TO authenticated
  USING (
    private.is_active_circle_coach("circleId", private.current_app_user_id())
  );

DROP POLICY IF EXISTS "p4_5_circle_assignments_select_parent_published" ON public.circle_assignments;
CREATE POLICY "p4_5_circle_assignments_select_parent_published"
  ON public.circle_assignments FOR SELECT TO authenticated
  USING (
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
  );

DROP POLICY IF EXISTS "p4_5_circle_assignment_targets_select_coach" ON public.circle_assignment_targets;
CREATE POLICY "p4_5_circle_assignment_targets_select_coach"
  ON public.circle_assignment_targets FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.circle_assignments a
      WHERE a.id = "assignmentId"
        AND private.is_active_circle_coach(
          a."circleId",
          private.current_app_user_id()
        )
    )
  );

DROP POLICY IF EXISTS "p4_5_circle_assignment_targets_select_parent" ON public.circle_assignment_targets;
CREATE POLICY "p4_5_circle_assignment_targets_select_parent"
  ON public.circle_assignment_targets FOR SELECT TO authenticated
  USING (
    private.is_child_parent("childProfileId", private.current_app_user_id())
  );

DROP POLICY IF EXISTS "p4_5_circle_submissions_select" ON public.circle_submissions;
CREATE POLICY "p4_5_circle_submissions_select"
  ON public.circle_submissions FOR SELECT TO authenticated
  USING (
    private.can_view_circle_submission(id, private.current_app_user_id())
  );

DROP POLICY IF EXISTS "p4_5_circle_feedbacks_select_coach_author" ON public.circle_feedbacks;
CREATE POLICY "p4_5_circle_feedbacks_select_coach_author"
  ON public.circle_feedbacks FOR SELECT TO authenticated
  USING ("authorCoachUserId" = private.current_app_user_id());

DROP POLICY IF EXISTS "p4_5_circle_feedbacks_select_parent_published" ON public.circle_feedbacks;
CREATE POLICY "p4_5_circle_feedbacks_select_parent_published"
  ON public.circle_feedbacks FOR SELECT TO authenticated
  USING (
    status = 'PUBLISHED'
    AND private.can_view_circle_submission(
      "submissionId",
      private.current_app_user_id()
    )
  );

DROP POLICY IF EXISTS "p4_5_circle_submission_replies_select" ON public.circle_submission_replies;
CREATE POLICY "p4_5_circle_submission_replies_select"
  ON public.circle_submission_replies FOR SELECT TO authenticated
  USING (
    private.can_view_circle_submission(
      "submissionId",
      private.current_app_user_id()
    )
  );

-- The Realtime policies keep their stored function references after the
-- functions move schemas. Recreate them explicitly so dumps and audits show
-- the private boundary and the authenticated UID source clearly.
DROP POLICY IF EXISTS "messaging_realtime_presence_send_authorized" ON realtime.messages;
CREATE POLICY "messaging_realtime_presence_send_authorized"
  ON realtime.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    extension = 'presence'
    AND private.messaging_topic_kind(realtime.topic()) = 'conv'
    AND private.messaging_can_access_conversation(
      auth.uid(),
      private.messaging_topic_id(realtime.topic())
    )
  );

DROP POLICY IF EXISTS "messaging_realtime_receive_authorized" ON realtime.messages;
CREATE POLICY "messaging_realtime_receive_authorized"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    CASE private.messaging_topic_kind(realtime.topic())
      WHEN 'conv' THEN private.messaging_can_access_conversation(
        auth.uid(),
        private.messaging_topic_id(realtime.topic())
      )
      WHEN 'inbox_user' THEN private.messaging_is_inbox_owner(
        auth.uid(),
        private.messaging_topic_id(realtime.topic())
      )
      WHEN 'inbox_child' THEN false
      ELSE realtime.topic() NOT LIKE 'msg:%'
    END
  );

-- Internal functions are executable for authenticated policies, but live in
-- a non-exposed schema. anon has no need to resolve any YEMA helper.
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA private FROM PUBLIC, anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private TO authenticated, service_role;
