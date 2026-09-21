-- P0.5 · Pedagogical catalogue RLS baseline (P-1 first)
--
-- Scope:
--   public.courses
--   public.modules
--   public.quiz_questions
--
-- YEMA exposes course data through application routes/server components backed
-- by Prisma. Admin/teacher mutations also resolve identity server-side before
-- writing through Prisma. No direct anon/authenticated PostgREST table access
-- is required for the pedagogical catalogue.
--
-- Contract:
--   1. Enable RLS on the three catalogue tables.
--   2. Add no client policies: anon/authenticated remain deny-by-default.
--   3. Explicitly revoke accidental client table privileges.
--   4. Do NOT FORCE RLS; the trusted Prisma database role remains the server path.
--
-- Validate on Supabase P-1 before any Production use.

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.courses FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.modules FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.quiz_questions FROM PUBLIC, anon, authenticated;
