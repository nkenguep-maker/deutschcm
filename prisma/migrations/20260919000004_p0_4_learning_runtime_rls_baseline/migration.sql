-- P0.4 · Learning runtime RLS baseline (P-1 first)
--
-- Scope:
--   public.enrollments
--   public.module_progress
--   public.quiz_attempts
--   public.quiz_answers
--   public.conversation_sessions
--
-- These rows are user-specific learning/runtime data. Current YEMA routes
-- resolve Supabase identity server-side and persist/read this data through
-- Prisma. No direct anon/authenticated PostgREST table access is required.
--
-- Contract:
--   1. Enable RLS on all five learning-runtime tables.
--   2. Add no client policies: anon/authenticated remain deny-by-default.
--   3. Explicitly revoke accidental client table privileges.
--   4. Do NOT FORCE RLS; the trusted Prisma database role remains the server path.
--
-- Validate on Supabase P-1 before any Production use.

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_sessions ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.enrollments FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.module_progress FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.quiz_attempts FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.quiz_answers FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.conversation_sessions FROM PUBLIC, anon, authenticated;
