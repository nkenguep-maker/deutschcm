-- P0.9 · Study groups RLS baseline (P-1 first)
--
-- Scope:
--   public.student_groups
--   public.student_group_members
--   public.study_group_invites
--
-- Current YEMA social/group flows resolve Supabase identity server-side and
-- perform all relational reads/writes through Prisma. Ownership, recipient
-- checks, capacity serialization, and invitation transitions live in the
-- server social domain. No direct anon/authenticated PostgREST table access
-- is required for these three tables.
--
-- Contract:
--   1. Enable RLS on all three study-group tables.
--   2. Add no direct client policies: anon/authenticated remain deny-by-default.
--   3. Explicitly revoke accidental direct table privileges.
--   4. Do NOT FORCE RLS; the trusted Prisma database role remains the server path.
--
-- Validate on Supabase P-1 before any Production use.

ALTER TABLE public.student_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_invites ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.student_groups FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.student_group_members FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.study_group_invites FROM PUBLIC, anon, authenticated;
