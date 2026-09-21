-- P0.2 · Commerce and entitlement RLS baseline (P-1 first)
--
-- Scope:
--   public.products
--   public.product_variants
--   public.product_entitlement_rules
--   public.orders
--   public.order_items
--   public.payments
--   public.access_grants
--
-- Current YEMA architecture keeps this data server-owned:
--   - catalogue/pricing reads use server code or static pricing doctrine;
--   - orders, payments and grants are created/read through Prisma server routes;
--   - no anon/authenticated PostgREST table privileges are required.
--
-- Contract:
--   1. Enable RLS on the seven commerce/entitlement tables.
--   2. Introduce no client policies: anon/authenticated stay deny-by-default.
--   3. Revoke any future accidental client table privilege as defense in depth.
--   4. Do NOT FORCE RLS: the trusted Prisma database role remains the server path.
--
-- Validate on Supabase P-1 before any Production use.

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_entitlement_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_grants ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.products FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.product_variants FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.product_entitlement_rules FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.orders FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.order_items FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.payments FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.access_grants FROM PUBLIC, anon, authenticated;
