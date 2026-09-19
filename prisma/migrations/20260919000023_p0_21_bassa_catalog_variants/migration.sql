-- Seed Bassa variants by cloning current Racines pricing/duration from Wolof.
-- Prices are product-level commercial values already used by ROOTS_*; this does
-- not invent a new price. Existing Wolof rows remain for future cohorts.

INSERT INTO public.product_variants (
  id, "productId", language, level, currency, amount, "durationDays", market, active, "createdAt"
)
SELECT
  'bassa_' || substr(md5(v.id), 1, 24),
  v."productId",
  'BASSA'::"LanguageCode",
  v.level,
  v.currency,
  v.amount,
  v."durationDays",
  v.market,
  v.active,
  now()
FROM public.product_variants v
JOIN public.products p ON p.id = v."productId"
WHERE p.universe = 'RACINES'::"Universe"
  AND v.language = 'WOLOF'::"LanguageCode"
  AND NOT EXISTS (
    SELECT 1
    FROM public.product_variants b
    WHERE b."productId" = v."productId"
      AND b.language = 'BASSA'::"LanguageCode"
      AND b.level IS NOT DISTINCT FROM v.level
      AND b.currency = v.currency
      AND b."durationDays" IS NOT DISTINCT FROM v."durationDays"
  );
