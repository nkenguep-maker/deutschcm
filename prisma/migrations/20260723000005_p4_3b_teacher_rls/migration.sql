-- ============================================================================
-- P4.3b · Teacher workspace RLS foundations
--
-- Additif · aucune colonne, aucune contrainte existante n'est renommée ni
-- supprimée. Idempotent · toutes les créations utilisent IF NOT EXISTS ou
-- CREATE OR REPLACE. Peut être réappliquée à P-1.
--
-- Doctrine · docs/YEMA_P4_3B_TEACHER_WORKSPACE.md §RLS.
--
-- Contrat ·
--   - Un Teacher lit uniquement sa propre ligne `teachers`.
--   - Un Teacher lit uniquement les `classrooms` où `teacherId = self`.
--   - Un Teacher lit uniquement les `classroom_enrollments` de ses classrooms.
--   - Un Teacher lit uniquement les `class_join_requests` de ses classrooms.
--   - Un Center admin ne devient PAS automatiquement Teacher (pas de policy
--     transitive Center → Teacher · voir spec P4.3b §15).
--   - Un Coach Racines n'a AUCUN accès aux tables Teacher.
--   - Un YEMA_ADMIN peut lire toutes ces tables (support/admin backoffice).
--   - `SECURITY INVOKER` par défaut · `search_path` verrouillé à
--     `public, pg_temp` sur les fonctions.
--   - `REVOKE ALL FROM PUBLIC` puis `GRANT EXECUTE TO authenticated` sur
--     chaque helper. Aucun grant à `anon`.
--   - Policies non-récursives · les helpers font tous des `EXISTS` scalaire
--     bornés par une clé primaire ou une clé unique.
-- ============================================================================

-- 1) SQL helpers · Teacher scope ---------------------------------------------

-- Vrai si `p_user_id` a un rôle applicatif Teacher actif (V1 legacy OU V2).
-- Utilisée uniquement dans les policies teachers/classrooms/etc. Ne fait
-- confiance à aucun paramètre client.
CREATE OR REPLACE FUNCTION public.is_teacher(p_user_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = p_user_id
      AND (u.role = 'TEACHER' OR u.role = 'ADMIN')
  ) OR EXISTS (
    SELECT 1 FROM public.user_app_roles r
    WHERE r."userId" = p_user_id
      AND (r.role = 'TEACHER' OR r.role = 'YEMA_ADMIN')
  );
$$;

-- Vrai si `p_user_id` est le Teacher assigné à la classroom `p_classroom_id`.
-- Utilisée dans les policies classrooms/enrollments/join_requests.
CREATE OR REPLACE FUNCTION public.is_teacher_for_classroom(
  p_classroom_id TEXT,
  p_user_id TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
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

-- Vrai si `p_user_id` est un étudiant activement inscrit dans `p_classroom_id`.
-- Utilisée pour les policies étudiantes (lecture de leur propre inscription).
CREATE OR REPLACE FUNCTION public.is_active_student_in_classroom(
  p_classroom_id TEXT,
  p_user_id TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classroom_enrollments e
    WHERE e."classroomId" = p_classroom_id
      AND e."userId" = p_user_id
      AND e."isActive" = true
  );
$$;

-- 2) Grants ------------------------------------------------------------------

REVOKE ALL ON FUNCTION public.is_teacher(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_teacher_for_classroom(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_active_student_in_classroom(TEXT, TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_teacher(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_teacher_for_classroom(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_student_in_classroom(TEXT, TEXT) TO authenticated;

-- 3) RLS · public.teachers ---------------------------------------------------

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- Chaque Teacher lit sa propre ligne. Un YEMA_ADMIN lit tout.
DROP POLICY IF EXISTS teachers_select_self ON public.teachers;
CREATE POLICY teachers_select_self ON public.teachers
  FOR SELECT
  TO authenticated
  USING (
    "userId" = public.current_app_user_id()
    OR public.is_yema_admin(public.current_app_user_id())
  );

GRANT SELECT ON public.teachers TO authenticated;

-- 4) RLS · public.classrooms --------------------------------------------------

ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;

-- Un Teacher lit uniquement ses propres classrooms · un YEMA_ADMIN lit tout.
DROP POLICY IF EXISTS classrooms_select_teacher_scope ON public.classrooms;
CREATE POLICY classrooms_select_teacher_scope ON public.classrooms
  FOR SELECT
  TO authenticated
  USING (
    public.is_teacher_for_classroom(id, public.current_app_user_id())
    OR public.is_yema_admin(public.current_app_user_id())
  );

GRANT SELECT ON public.classrooms TO authenticated;

-- 5) RLS · public.classroom_enrollments --------------------------------------

ALTER TABLE public.classroom_enrollments ENABLE ROW LEVEL SECURITY;

-- Un étudiant lit sa propre inscription · un Teacher lit les inscriptions
-- de ses classrooms · un YEMA_ADMIN lit tout.
DROP POLICY IF EXISTS enrollments_select_owner_or_teacher ON public.classroom_enrollments;
CREATE POLICY enrollments_select_owner_or_teacher ON public.classroom_enrollments
  FOR SELECT
  TO authenticated
  USING (
    "userId" = public.current_app_user_id()
    OR public.is_teacher_for_classroom("classroomId", public.current_app_user_id())
    OR public.is_yema_admin(public.current_app_user_id())
  );

GRANT SELECT ON public.classroom_enrollments TO authenticated;

-- 6) RLS · public.class_join_requests ----------------------------------------
-- La table est décorrélée du Teacher (fromUserId + toClassroomId + toGroupId).
-- Le Teacher voit uniquement les requêtes visant ses classrooms.

ALTER TABLE public.class_join_requests ENABLE ROW LEVEL SECURITY;

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
    OR public.is_yema_admin(public.current_app_user_id())
  );

GRANT SELECT ON public.class_join_requests TO authenticated;

-- 7) AuditAction · nouvelles valeurs Teacher --------------------------------
-- Ne modifie pas l'existant · ajoute uniquement (idempotent).

ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'TEACHER_ACCESS_DENIED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'TEACHER_CLASS_ACCESS_DENIED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'TEACHER_STUDENT_ACCESS_DENIED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'TEACHER_SCOPE_AMBIGUOUS';

-- 8) Notes ------------------------------------------------------------------
--
-- Une politique WRITE Teacher (INSERT/UPDATE) est délibérément OMISE en P4.3b.
-- La création/modification de classroom/enrollment appartient au workflow
-- signé prévu en P4.3b hardening + P4.5. Les écritures existantes passent
-- toutes par des routes serveur avec `resolveTeacherActor` +
-- `assertTeacherOwnsClassroom`. La RLS reste en filet de sécurité en lecture
-- uniquement pour ce sous-lot.
