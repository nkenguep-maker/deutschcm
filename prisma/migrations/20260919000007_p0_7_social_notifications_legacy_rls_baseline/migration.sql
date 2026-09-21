-- P0.7 · Social, notifications and legacy classroom messaging RLS baseline (P-1 first)
--
-- Scope:
--   public.notifications
--   public.user_connections
--   public.threads
--   public.messages
--   public.badges
--   public.user_badges
--
-- Current YEMA surfaces read/write these domains through authenticated server
-- routes backed by Prisma. Legacy classroom threads/messages and badge tables
-- have no direct anon/authenticated PostgREST privileges on P-1.
--
-- Contract:
--   1. Enable RLS on all six tables.
--   2. Add no direct client policies: anon/authenticated remain deny-by-default.
--   3. Explicitly revoke accidental direct client table privileges.
--   4. Do NOT FORCE RLS; the trusted Prisma database role remains the server path.
--
-- Validate on Supabase P-1 before any Production use.

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.notifications FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.user_connections FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.threads FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.messages FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.badges FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.user_badges FROM PUBLIC, anon, authenticated;
