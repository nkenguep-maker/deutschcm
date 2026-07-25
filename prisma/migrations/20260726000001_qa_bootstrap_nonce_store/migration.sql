-- QA-b1 Gate · store durable des nonces bootstrap QA
--
-- Table server-only utilisée exclusivement par les routes QA. Aucune
-- policy SELECT/INSERT/UPDATE/DELETE côté client · anon et authenticated
-- reçoivent des refus explicites via RLS. Les routes QA server-only
-- accèdent via Prisma en service_role (bypass RLS).
--
-- Contraintes ·
--   * `nonceHash` UNIQUE · un nonce ne peut jamais être inséré deux fois
--   * `expiresAt > issuedAt` · CHECK strict
--   * aucun nonce brut · uniquement SHA-256 (64 hex)
--   * aucune adresse email complète · seul `qaAdminEmailHash` (SHA-256 short)
--
-- Aucune AuditAction n'est ajoutée à l'enum (per §13 QA-b1 fallback log
-- server-only).

CREATE TABLE "qa_bootstrap_nonces" (
    "id" TEXT NOT NULL,
    "nonce_hash" TEXT NOT NULL,
    "qa_admin_email_hash" TEXT NOT NULL,
    "deployment_host" TEXT NOT NULL,
    "project_ref" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "qa_bootstrap_nonces_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "qa_bootstrap_nonces_expires_after_issued" CHECK ("expires_at" > "issued_at")
);

CREATE UNIQUE INDEX "qa_bootstrap_nonces_nonce_hash_key" ON "qa_bootstrap_nonces"("nonce_hash");
CREATE INDEX "qa_bootstrap_nonces_expires_at_idx" ON "qa_bootstrap_nonces"("expires_at");
CREATE INDEX "qa_bootstrap_nonces_consumed_at_idx" ON "qa_bootstrap_nonces"("consumed_at");

-- Enable RLS + explicit deny policies for anon and authenticated roles.
-- Aucune policy permissive · seul `service_role` (bypass RLS) accède.
ALTER TABLE "qa_bootstrap_nonces" ENABLE ROW LEVEL SECURITY;

-- Deny explicite SELECT pour anon + authenticated (USING false = 0 rows).
CREATE POLICY "qa_nonces_deny_select_anon" ON "qa_bootstrap_nonces"
  FOR SELECT TO anon USING (false);
CREATE POLICY "qa_nonces_deny_select_authenticated" ON "qa_bootstrap_nonces"
  FOR SELECT TO authenticated USING (false);

-- Deny explicite INSERT (WITH CHECK false = tout INSERT refusé).
CREATE POLICY "qa_nonces_deny_insert_anon" ON "qa_bootstrap_nonces"
  FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY "qa_nonces_deny_insert_authenticated" ON "qa_bootstrap_nonces"
  FOR INSERT TO authenticated WITH CHECK (false);

-- Deny explicite UPDATE (USING+WITH CHECK false).
CREATE POLICY "qa_nonces_deny_update_anon" ON "qa_bootstrap_nonces"
  FOR UPDATE TO anon USING (false) WITH CHECK (false);
CREATE POLICY "qa_nonces_deny_update_authenticated" ON "qa_bootstrap_nonces"
  FOR UPDATE TO authenticated USING (false) WITH CHECK (false);

-- Deny explicite DELETE.
CREATE POLICY "qa_nonces_deny_delete_anon" ON "qa_bootstrap_nonces"
  FOR DELETE TO anon USING (false);
CREATE POLICY "qa_nonces_deny_delete_authenticated" ON "qa_bootstrap_nonces"
  FOR DELETE TO authenticated USING (false);

-- Grants côté rôles nommés · aucun accès (le service_role bypass RLS
-- indépendamment). REVOKE ALL est le comportement Supabase par défaut
-- pour une table nouvellement créée · on est explicite ici.
REVOKE ALL ON "qa_bootstrap_nonces" FROM anon;
REVOKE ALL ON "qa_bootstrap_nonces" FROM authenticated;
