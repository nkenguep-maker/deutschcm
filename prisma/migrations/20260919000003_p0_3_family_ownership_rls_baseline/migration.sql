-- P0.3 · Family ownership RLS baseline (P-1 first)
--
-- Scope newly hardened here:
--   public.households
--   public.household_memberships
--   public.dependent_profiles
--
-- public.child_profiles is already RLS-enabled and deny-by-default from P4.7.
-- The runtime gate for this slice verifies it alongside the three tables above.
--
-- Current YEMA architecture resolves guardian identity and family ownership on
-- the server, then reads/writes these tables through Prisma. No direct
-- anon/authenticated PostgREST table access is required for the family runtime.
--
-- Contract:
--   1. Enable RLS on the three legacy family ownership tables.
--   2. Add no client policies: anon/authenticated remain deny-by-default.
--   3. Explicitly revoke accidental client table privileges.
--   4. Do NOT FORCE RLS; the trusted Prisma database role remains the server path.
--
-- Validate on Supabase P-1 before any Production use.

ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dependent_profiles ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.households FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.household_memberships FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.dependent_profiles FROM PUBLIC, anon, authenticated;
