-- Align the closed-beta ledger with Prisma's default PostgreSQL DateTime type
-- used throughout YEMA: TIMESTAMP(3) WITHOUT TIME ZONE.
-- Existing values are interpreted as UTC during conversion.

ALTER TABLE public.beta_invitations
  ALTER COLUMN "expiresAt" TYPE TIMESTAMP(3) USING ("expiresAt" AT TIME ZONE 'UTC'),
  ALTER COLUMN "acceptedAt" TYPE TIMESTAMP(3) USING ("acceptedAt" AT TIME ZONE 'UTC'),
  ALTER COLUMN "revokedAt" TYPE TIMESTAMP(3) USING ("revokedAt" AT TIME ZONE 'UTC'),
  ALTER COLUMN "createdAt" TYPE TIMESTAMP(3) USING ("createdAt" AT TIME ZONE 'UTC');
