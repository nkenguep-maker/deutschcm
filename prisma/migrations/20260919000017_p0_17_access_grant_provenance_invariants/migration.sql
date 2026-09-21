-- P0.17 · AccessGrant provenance invariants (P-1 first)
--
-- One commercial OrderItem represents one entitlement grant. ORDER grants
-- must point to an OrderItem; non-ORDER sources must not impersonate one.
--
-- Cross-table payment/order provenance remains enforced in the canonical
-- server factory + P-1 runtime gate because PostgreSQL CHECK constraints
-- cannot safely reference other tables.

ALTER TABLE public.access_grants
  ADD CONSTRAINT access_grants_order_source_consistency
  CHECK (
    (
      "sourceType"::text = 'ORDER'
      AND "orderItemId" IS NOT NULL
    )
    OR
    (
      "sourceType"::text <> 'ORDER'
      AND "orderItemId" IS NULL
    )
  )
  NOT VALID;

ALTER TABLE public.access_grants
  VALIDATE CONSTRAINT access_grants_order_source_consistency;

CREATE UNIQUE INDEX access_grants_one_grant_per_order_item_idx
  ON public.access_grants ("orderItemId")
  WHERE "orderItemId" IS NOT NULL;
