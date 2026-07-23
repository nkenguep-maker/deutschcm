-- ============================================================================
-- P4.3b hardening · Correctif RLS Teacher helpers
--
-- Bug détecté au runtime · les policies sur `classrooms` et
-- `classroom_enrollments` utilisent `is_teacher_for_classroom(id, ...)`, qui
-- lit `public.classrooms`. En `SECURITY INVOKER`, la lecture applique la
-- policy · qui rappelle le helper · récursion infinie · PostgreSQL renvoie
-- `stack depth limit exceeded`.
--
-- Fix · basculer les 3 helpers Teacher en `SECURITY DEFINER` avec
-- `search_path` verrouillé (pattern identique à `is_circle_member`,
-- `is_class_member`, `is_center_admin` posés en P4.1 §5).
--
-- Additif · aucune policy n'est renommée · aucune table n'est modifiée.
-- Idempotent · les fonctions sont recréées via `CREATE OR REPLACE`.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_teacher(p_user_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
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

CREATE OR REPLACE FUNCTION public.is_teacher_for_classroom(
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

CREATE OR REPLACE FUNCTION public.is_active_student_in_classroom(
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
    SELECT 1 FROM public.classroom_enrollments e
    WHERE e."classroomId" = p_classroom_id
      AND e."userId" = p_user_id
      AND e."isActive" = true
  );
$$;

-- Grants restent identiques (REVOKE ALL FROM PUBLIC + GRANT EXECUTE TO
-- authenticated posés en P4.3b migration précédente) · CREATE OR REPLACE
-- ne les touche pas.
