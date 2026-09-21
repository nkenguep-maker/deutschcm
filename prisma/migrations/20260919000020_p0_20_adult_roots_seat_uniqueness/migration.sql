-- P0.20 · Adult ROOTS_FAMILY seat concurrency hardening (P-1 first)
--
-- Application code serializes assignment per household with SELECT ... FOR UPDATE.
-- This partial unique index adds DB-level defense against duplicate ACTIVE adult
-- seats for the same household + user.

CREATE UNIQUE INDEX access_grants_one_active_adult_roots_seat_per_household_user_idx
  ON public.access_grants ("sourceId", "beneficiaryId")
  WHERE "sourceType" = 'SUBSCRIPTION'::"GrantSourceType"
    AND "beneficiaryType" = 'USER'::"BeneficiaryType"
    AND status = 'ACTIVE'::"GrantStatus"
    AND metadata->>'seatType' = 'ADULT_ROOTS';
