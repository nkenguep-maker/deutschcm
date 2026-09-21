-- Align Passage with the public pricing source of truth and store EUR in cents.
UPDATE "product_variants" AS variant
SET "amount" = CASE
  WHEN variant."currency" = 'XAF' AND variant."level" = 'A1' THEN 49000
  WHEN variant."currency" = 'XAF' AND variant."level" = 'A2' THEN 55000
  WHEN variant."currency" = 'XAF' AND variant."level" = 'B1' THEN 59000
  WHEN variant."currency" = 'XAF' AND variant."level" = 'B2' THEN 69000
  WHEN variant."currency" = 'XAF' AND variant."level" = 'C1' THEN 79000
  WHEN variant."currency" = 'EUR' AND variant."level" = 'A1' THEN 7500
  WHEN variant."currency" = 'EUR' AND variant."level" = 'A2' THEN 7900
  WHEN variant."currency" = 'EUR' AND variant."level" = 'B1' THEN 8900
  WHEN variant."currency" = 'EUR' AND variant."level" = 'B2' THEN 10900
  WHEN variant."currency" = 'EUR' AND variant."level" = 'C1' THEN 12900
  ELSE variant."amount"
END
FROM "products" AS product
WHERE variant."productId" = product."id"
  AND product."code" = 'PASSAGE';

-- Normalize every other existing EUR catalogue row to cents. XAF is
-- zero-decimal and already stored in whole francs. Thresholds keep this safe
-- if an environment was reseeded before migration time.
UPDATE "product_variants" AS variant
SET "amount" = variant."amount" * 100
FROM "products" AS product
WHERE variant."productId" = product."id"
  AND variant."currency" = 'EUR'
  AND variant."amount" < 500
  AND (
    product."code" IN ('TEACHER_ADDON', 'CAREER_COACH_ADDON', 'ROOTS_FOLLOWUP_ADDON')
    OR (
      product."code" IN ('ROOTS_SOLO', 'ROOTS_FAMILY', 'CHILD_WORLD_SINGLE', 'FAMILY_WORLD')
      AND variant."durationDays" = 365
    )
  );

-- The Racines coach offer remains unavailable until its runtime capability is
-- operational. Keep its future public price aligned while preventing checkout.
UPDATE "products"
SET "isActive" = FALSE
WHERE "code" = 'ROOTS_FOLLOWUP_ADDON';

UPDATE "product_variants" AS variant
SET "amount" = CASE variant."currency"
  WHEN 'XAF' THEN 30000
  WHEN 'EUR' THEN 4500
  ELSE variant."amount"
END
FROM "products" AS product
WHERE variant."productId" = product."id"
  AND product."code" = 'ROOTS_FOLLOWUP_ADDON';
