# YEMA · P4.7 Security Hardening

Status: isolated branch `fix/p4-7-social-notification-authz`.

## Scope

This lot hardens notifications/social actions, classroom joins, study groups,
messaging, child PIN sessions, request origin checks, rate limits, and P4.5 RLS
identity mapping. It also updates the 9-persona QA contract and adds a
Vercel-independent GitHub Actions static security gate.

## Critical fixes

- Generic client notification creation is disabled (`POST /api/notifications` → 405).
- Social request/invite responses are scoped to the authorized actor.
- Classroom join no longer creates an active enrollment before teacher approval.
- Social + text messaging use DB-backed rate limits.
- Child PIN attempts use durable `AuditEvent` rate limiting with an advisory lock.
- Generic messaging accepts only `TEXT` and `GUIDED_PHRASE`; audio uses its dedicated secured endpoint; CARD/SYSTEM remain server/domain actions.
- Audio messages validate asset status, conversation and actor ownership.
- Reply targets must belong to the same conversation.
- Sensitive cookie-authenticated mutations use an exact same-origin guard.
- Study-group beta creation no longer simulates Mobile Money or paid access.
- Detailed study-group member data is scoped to active members/creator.

## RLS identity hardening

P-1 proved that YEMA `User.id` and Supabase Auth `user.id` are distinct identity
spaces (all sampled/fixture users use different values). P4.5 policies that used
`auth.uid()::text` directly as an application `userId` were therefore invalid.

Migration:

`prisma/migrations/20260808000001_p4_7_rls_identity_hardening/migration.sql`

The migration:

- moves internal SECURITY DEFINER helpers into non-exposed schema `private`;
- maps JWT identity through `users.supabaseId` to application `users.id`;
- rewrites P4.5 policies to use the application identity;
- binds Realtime helpers to the actual JWT UID;
- keeps `child_profiles` RLS deny-by-default;
- preserves P4.5 trigger attachments.

## P-1 validation performed

The migration was applied **only to P-1** (`kzzagbojjkivdzzcrmxn`) for isolated
validation. Production was not accessed or modified.

Validated on P-1:

- zero SECURITY DEFINER functions remain in exposed `public`;
- zero P4.5 policies directly use `auth.uid()` as YEMA `User.id`;
- JWT simulation resolves the correct YEMA user;
- a caller-supplied foreign UID is rejected by Realtime authorization helpers;
- Teacher and Student P4.5 authorization helpers resolve correctly;
- P4.5 immutability/scope triggers remain attached after helper relocation.

Supabase security advisor after validation reports only:

1. `child_profiles` RLS enabled with no policy — intentional deny-by-default;
2. leaked-password protection disabled — Auth project setting, not changed by this branch.

## QA contract

The runtime and visual persona suites now use canonical routes for all 9 personas.
Child Monde and Child Racines receive real parent-authenticated PIN sessions and
are visually captured on `/fr|en/dashboard` at 390, 768 and 1440 widths.

A consolidated P-1 gate is available at:

`node scripts/test-release-gate-p1.mjs`

It runs static tests/typecheck/build before authenticated runtime/E2E checks.

## Validation boundary / merge rule

Latest branch commits have **not** been compiled by Vercel because both connected
Vercel projects currently fail immediately with `build-rate-limit`. Therefore:

- no claim is made that the latest full branch build is green;
- no merge to `main` is allowed until GitHub/static CI and the P-1 release gate are green;
- Production Supabase must not be used to validate this branch.
