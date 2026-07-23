-- ============================================================================
-- P4.3b hardening final · Retrait du bypass is_yema_admin des policies Teacher
--
-- Contexte · les policies posées par les migrations précédentes contenaient
--   `USING (... OR public.is_yema_admin(public.current_app_user_id()))`
-- ce qui permettait à un utilisateur avec le rôle applicatif `YEMA_ADMIN`
-- de lire TOUTES les lignes de teachers/classrooms/enrollments/join_requests
-- sans binding Teacher explicit. Le principe P4.3b (voir §7 hardening) est
-- que l'accès Teacher provient EXCLUSIVEMENT d'un `Teacher` row rattaché ·
-- le rôle global ne doit jamais suffire.
--
-- Cette migration remplace proprement les 4 policies pour retirer le bypass.
-- Elle préserve ·
--   - la lecture personnelle Student sur classroom_enrollments (self);
--   - la lecture personnelle du fromUser sur class_join_requests;
--   - la lecture Teacher scopée par is_teacher_for_classroom.
--
-- Additif · aucune migration historique n'est modifiée. Idempotent · DROP IF
-- EXISTS + CREATE POLICY. Rejouable sur P-1 et sur base vierge.
--
-- Le futur endpoint backoffice support (lecture transversale) devra être
-- gouverné par ·
--   - session authentifiée + rôle YEMA_ADMIN vérifié serveur;
--   - projection minimale explicite;
--   - AuditEvent obligatoire à chaque appel;
-- et ne PAS reposer sur les policies métier Teacher.
-- ============================================================================

-- 1) teachers · self only ----------------------------------------------------
DROP POLICY IF EXISTS teachers_select_self ON public.teachers;
CREATE POLICY teachers_select_self ON public.teachers
  FOR SELECT
  TO authenticated
  USING (
    "userId" = public.current_app_user_id()
  );

-- 2) classrooms · teacher scope only -----------------------------------------
DROP POLICY IF EXISTS classrooms_select_teacher_scope ON public.classrooms;
CREATE POLICY classrooms_select_teacher_scope ON public.classrooms
  FOR SELECT
  TO authenticated
  USING (
    public.is_teacher_for_classroom(id, public.current_app_user_id())
  );

-- 3) classroom_enrollments · self OR teacher-of-classroom --------------------
--    Student self-view préservé (lecture de son propre enrollment) ·
--    Teacher lit les enrollments de ses classes ·
--    plus aucun bypass admin global.
DROP POLICY IF EXISTS enrollments_select_owner_or_teacher ON public.classroom_enrollments;
CREATE POLICY enrollments_select_owner_or_teacher ON public.classroom_enrollments
  FOR SELECT
  TO authenticated
  USING (
    "userId" = public.current_app_user_id()
    OR public.is_teacher_for_classroom("classroomId", public.current_app_user_id())
  );

-- 4) class_join_requests · fromUser self OR teacher-of-target ---------------
DROP POLICY IF EXISTS class_join_requests_select_scope ON public.class_join_requests;
CREATE POLICY class_join_requests_select_scope ON public.class_join_requests
  FOR SELECT
  TO authenticated
  USING (
    "fromUserId" = public.current_app_user_id()
    OR (
      "toClassroomId" IS NOT NULL
      AND public.is_teacher_for_classroom("toClassroomId", public.current_app_user_id())
    )
  );
