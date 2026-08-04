-- P4.6 Lot 4A · sécurité enfant (PIN).
--
-- Ajoute deux colonnes nullables à child_profiles pour porter un PIN hashé
-- (scrypt via Node crypto natif) et son horodatage de dernière mise à jour.
-- Migration strictement additive · zéro DROP, zéro backfill, zéro contrainte
-- rétroactive · un enfant existant reste valide sans PIN (`pinHash IS NULL`).
--
-- Sécurité :
--   - Le hash stocké utilise le format canonique "scrypt$<salt_b64>$<hash_b64>"
--     · voir src/lib/security/childPin.ts.
--   - La colonne n'est JAMAIS exposée par une API ni au client (guard côté
--     projection Prisma dans src/lib/family/*).
--   - Les policies RLS existantes sur child_profiles restent inchangées.

ALTER TABLE "child_profiles"
  ADD COLUMN IF NOT EXISTS "pinHash" TEXT,
  ADD COLUMN IF NOT EXISTS "pinUpdatedAt" TIMESTAMP(3);
