-- ============================================================================
-- P4.4 · Roots Coach workspace RLS foundations
--
-- Additif · aucune colonne, contrainte, ni policy P4.1/P4.2/P4.3 n'est
-- renommée ou supprimée. Idempotent · CREATE OR REPLACE + DROP POLICY IF
-- EXISTS. Rejouable sur P-1 et sur base vierge.
--
-- Doctrine · docs/YEMA_P4_4_ROOTS_COACH_WORKSPACE.md §RLS.
--
-- **Aucun bypass `is_yema_admin()`** sur les policies métier Coach. L'accès
-- transversal ADMIN/support relèvera d'un endpoint dédié avec autorisation
-- applicative explicite + AuditEvent obligatoire (pattern P4.3b hardening
-- §7).
--
-- **ChildProfile** · reste `service_role only` au niveau table (posé par
-- 20260719_child_profiles). Le Coach n'obtient JAMAIS un accès SELECT
-- direct à `child_profiles`. La lecture Coach passe exclusivement par ·
--   (a) les endpoints /api/roots-coach/* (Prisma serveur, projection
--       minimale filtrée par le seam).
--   (b) la fonction SECURITY DEFINER `get_roots_coach_assigned_profiles`
--       (projetée en colonnes minimales) — utilisable côté serveur.
-- ============================================================================

-- 1) SQL helpers · Roots Coach scope ----------------------------------------

-- Vrai si `p_user_id` porte le AppRole `RACINES_COACH`. Utilisé par les
-- policies Coach en défense-en-profondeur. `CAREER_COACH` seul renvoie false.
CREATE OR REPLACE FUNCTION public.is_roots_coach(p_user_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_app_roles r
    WHERE r."userId" = p_user_id
      AND r.role = 'RACINES_COACH'
  );
$$;

-- Vrai si `p_user_id` a un CircleMembership COACH ACTIVE sur ce Circle
-- ET si le Circle est actif. Détecte les révocations Q10 immédiatement.
CREATE OR REPLACE FUNCTION public.is_active_circle_coach(
  p_circle_id TEXT,
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
    FROM public.circle_memberships cm
    JOIN public.circles c ON c.id = cm."circleId"
    WHERE cm."circleId" = p_circle_id
      AND cm."userId" = p_user_id
      AND cm.role = 'COACH'
      AND cm.status = 'ACTIVE'
      AND c.status = 'ACTIVE'
  );
$$;

-- Vrai si `p_user_id` (coach) peut voir le ChildProfile · via un
-- CircleMembership CHILD ACTIVE dans un Circle où il est COACH ACTIVE.
CREATE OR REPLACE FUNCTION public.can_roots_coach_view_child(
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
    FROM public.circle_memberships child_mem
    JOIN public.circles c ON c.id = child_mem."circleId"
    JOIN public.circle_memberships coach_mem ON coach_mem."circleId" = c.id
    WHERE child_mem."childProfileId" = p_child_profile_id
      AND child_mem.role = 'CHILD'
      AND child_mem.status = 'ACTIVE'
      AND c.status = 'ACTIVE'
      AND coach_mem."userId" = p_user_id
      AND coach_mem.role = 'COACH'
      AND coach_mem.status = 'ACTIVE'
  );
$$;

-- 2) Grants -----------------------------------------------------------------

REVOKE ALL ON FUNCTION public.is_roots_coach(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_active_circle_coach(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_roots_coach_view_child(TEXT, TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_roots_coach(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_circle_coach(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_roots_coach_view_child(TEXT, TEXT) TO authenticated;

-- 3) Fonction projection minimale ChildProfile pour le Coach ---------------
--
-- `SECURITY DEFINER` · projette uniquement `id`, `prenom` (nom d'usage),
-- `avatarAnimal`, une tranche d'âge dérivée (`age_band`), `activeLangue`,
-- `circleId`, `joinedAt`. AUCUN nom légal complet, email, téléphone,
-- adresse, date de naissance complète, données Household, autres circles.
--
-- Le coach appelant est identifié par `current_app_user_id()`. Aucun
-- paramètre client. Un caller sans membership Coach ACTIVE retourne 0 rows.

CREATE OR REPLACE FUNCTION public.get_roots_coach_assigned_profiles()
RETURNS TABLE (
  id TEXT,
  display_name TEXT,
  avatar_animal TEXT,
  age_band TEXT,
  active_langue TEXT,
  circle_id TEXT,
  circle_language TEXT,
  joined_at TIMESTAMP(3)
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
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
    c.language::TEXT AS circle_language,
    child_mem."joinedAt" AS joined_at
  FROM public.circle_memberships child_mem
  JOIN public.circles c ON c.id = child_mem."circleId"
  JOIN public.child_profiles cp ON cp.id = child_mem."childProfileId"
  JOIN public.circle_memberships coach_mem ON coach_mem."circleId" = c.id
  WHERE child_mem.role = 'CHILD'
    AND child_mem.status = 'ACTIVE'
    AND c.status = 'ACTIVE'
    AND coach_mem."userId" = public.current_app_user_id()
    AND coach_mem.role = 'COACH'
    AND coach_mem.status = 'ACTIVE';
$$;

REVOKE ALL ON FUNCTION public.get_roots_coach_assigned_profiles() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_roots_coach_assigned_profiles() TO authenticated;

-- 4) Note · pas de policy SELECT ajoutée sur `child_profiles` ---------------
--
-- La policy `child_profiles_service_only` posée en 20260719 reste en
-- place. Un caller `authenticated` avec le rôle Coach ne peut PAS lire
-- `child_profiles` directement (retour 0 rows). Il doit ·
--   (a) appeler /api/roots-coach/profiles (server-side · Prisma).
--   (b) OU appeler `SELECT * FROM public.get_roots_coach_assigned_profiles()`.
--
-- Cette architecture garantit qu'aucun email/téléphone/DOB/adresse ne peut
-- jamais fuir par un SELECT direct sur `child_profiles`, même en cas de
-- policy mal configurée sur d'autres colonnes.

-- 5) AuditAction · nouvelles valeurs Roots Coach ---------------------------

ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ROOTS_COACH_ACCESS_DENIED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ROOTS_COACH_CIRCLE_ACCESS_DENIED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ROOTS_COACH_PROFILE_ACCESS_DENIED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ROOTS_COACH_CAPACITY_REACHED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ROOTS_COACH_ASSIGNMENT_REVOKED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ROOTS_COACH_SCOPE_AMBIGUOUS';

-- 6) Aucune policy WRITE Coach en P4.4 -------------------------------------
--
-- Les écritures Circle (assignation, retrait, archivage) restent le
-- workflow ADMIN P4.2 (`assignCoach` / `removeCoach` dans
-- src/lib/circles/memberships.ts). Aucune écriture depuis le workspace
-- Coach. Les policies SELECT existantes sur circles/circle_memberships
-- (P4.1) suffisent pour la lecture des Circles où le coach est member.
