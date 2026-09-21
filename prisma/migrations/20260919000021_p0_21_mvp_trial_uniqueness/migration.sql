-- P0.21 · MVP cohort trial uniqueness (P-1 first)
--
-- Trial grants are explicit PROMO grants issued by the canonical server factory.
-- One cohort/product trial source may be issued only once.

CREATE UNIQUE INDEX access_grants_one_mvp_trial_per_source_idx
  ON public.access_grants ("sourceId")
  WHERE "sourceType" = 'PROMO'::"GrantSourceType"
    AND metadata->>'kind' = 'MVP_TRIAL';
