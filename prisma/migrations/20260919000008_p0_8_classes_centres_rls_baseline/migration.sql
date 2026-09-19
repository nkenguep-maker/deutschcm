-- P0.8 · Classes, centres, provider profiles and applications RLS baseline (P-1 first)
--
-- Scope:
--   public.classes
--   public.class_memberships
--   public.class_assignments
--   public.submissions
--   public.class_feedback
--   public.provider_profiles
--   public.language_centers
--   public.center_applications
--   public.teacher_applications
--   public.level_history
--
-- YEMA reads/writes these domains through authenticated server routes and
-- Prisma. Public teacher/center application forms also persist through
-- server routes after origin/validation/rate-limit checks; they do not
-- require direct PostgREST table access.
--
-- Contract:
--   1. Enable RLS on all ten tables.
--   2. Add no direct client policies: anon/authenticated remain deny-by-default.
--   3. Explicitly revoke accidental direct table privileges.
--   4. Do NOT FORCE RLS; the trusted Prisma database role remains the server path.
--
-- Validate on Supabase P-1 before any Production use.

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.language_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.center_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.level_history ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.classes FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.class_memberships FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.class_assignments FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.submissions FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.class_feedback FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.provider_profiles FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.language_centers FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.center_applications FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.teacher_applications FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.level_history FROM PUBLIC, anon, authenticated;
