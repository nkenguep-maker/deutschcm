-- P4.6 Lot 5.1 · sièges Enfant Monde + univers enfant explicite.
--
-- Deux changements strictement additifs :
--
-- 1. Enum ProductCode · deux nouvelles valeurs autorisées.
--    - CHILD_WORLD_SINGLE : 1 siège Enfant Monde (subscription)
--    - FAMILY_WORLD       : 3 sièges Enfant Monde (subscription)
--    Aucune de ces valeurs ne débloque un Passage Monde adulte
--    (la logique reste server-side dans src/lib/entitlements/adult.ts).
--
-- 2. Colonne child_profiles.universe (Universe enum, nullable) · autorité
--    canonique pour le dispatch dashboard et le comptage de sièges. Elle
--    reste nullable : les enfants existants sans backfill continuent de
--    fonctionner via le fallback langue (transitoire) jusqu'à ce que la
--    migration data soit exécutée. Un ChildProfile QA du bake yema-qa-
--    fixtures.mjs sera systématiquement upserté avec l'univers explicite.

ALTER TYPE "ProductCode" ADD VALUE IF NOT EXISTS 'CHILD_WORLD_SINGLE';
ALTER TYPE "ProductCode" ADD VALUE IF NOT EXISTS 'FAMILY_WORLD';

ALTER TABLE "child_profiles"
  ADD COLUMN IF NOT EXISTS "universe" "Universe";
