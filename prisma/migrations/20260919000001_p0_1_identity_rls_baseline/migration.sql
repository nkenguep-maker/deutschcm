-- P0.1 · Identity foundation RLS baseline (P-1 first)
--
-- Scope intentionally narrow:
--   public.users
--   public.user_roles
--   public.user_app_roles
--   public.learning_paths
--
-- These tables are server-owned in the current YEMA architecture. Application
-- reads/writes go through Prisma on the trusted database connection, while no
-- anon/authenticated PostgREST grants are required for the product runtime.
--
-- Contract for this iteration:
--   1. RLS is enabled.
--   2. No client policy is introduced: anon/authenticated remain deny-by-default.
--   3. Existing client privileges are explicitly revoked as defense in depth.
--   4. FORCE ROW LEVEL SECURITY is deliberately not enabled; trusted server
--      database access remains the application data path.
--
-- This migration must be validated on Supabase P-1 before any Production use.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_app_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.users FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.user_roles FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.user_app_roles FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.learning_paths FROM PUBLIC, anon, authenticated;
