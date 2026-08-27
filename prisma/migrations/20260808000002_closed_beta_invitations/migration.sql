-- Closed beta invitations · server-only durable replay protection.
-- Raw invitation tokens and plaintext invited emails are never stored.
-- The application writes through Prisma/direct Postgres; PostgREST clients
-- receive no table privileges and RLS is enabled defense-in-depth.

CREATE TABLE IF NOT EXISTS public.beta_invitations (
  id TEXT PRIMARY KEY,
  "tokenHash" TEXT NOT NULL,
  "emailHash" TEXT NOT NULL,
  status public."InvitationStatus" NOT NULL DEFAULT 'PENDING',
  "issuedByUserId" TEXT NOT NULL,
  "acceptedByUserId" TEXT,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "acceptedAt" TIMESTAMPTZ,
  "revokedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT beta_invitations_expiry_after_creation CHECK ("expiresAt" > "createdAt")
);

CREATE UNIQUE INDEX IF NOT EXISTS beta_invitations_token_hash_key
  ON public.beta_invitations ("tokenHash");
CREATE INDEX IF NOT EXISTS beta_invitations_email_status_idx
  ON public.beta_invitations ("emailHash", status);
CREATE INDEX IF NOT EXISTS beta_invitations_expires_at_idx
  ON public.beta_invitations ("expiresAt");
CREATE INDEX IF NOT EXISTS beta_invitations_issuer_created_idx
  ON public.beta_invitations ("issuedByUserId", "createdAt" DESC);

ALTER TABLE public.beta_invitations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.beta_invitations FROM PUBLIC, anon, authenticated;
