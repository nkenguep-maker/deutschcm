# YEMA Agent Guardrails

## Mission

Bring YEMA to closed beta, then prepare Production only after every gate is proven green.

## Non-Negotiable Production Rules

Never do any of the following until all gates are green:

- Modify Supabase Production.
- Write to Production.
- Delete Production data.
- Merge to `main`.
- Deploy to Production.

Always work on:

- An isolated branch.
- Preview deployments.
- Supabase P-1 only.

## Repository Context

- GitHub repo: `nkenguep-maker/deutschcm`
- Active branch: `fix/p4-7-social-notification-authz`
- PR: `#29`
- PR state must remain Draft.

## Vercel Context

- Canonical project: `deutschcm`
- Duplicate project: `deutschcm-fqsr`

Rules:

- `deutschcm` must be the only READY Preview once canonicalization is validated.
- `deutschcm-fqsr` must be CANCELED.
- Do not delete the duplicate until canonicalization is fully validated.
- Never deploy Production before all gates are green.

## Supabase Context

Use only:

- Project: `yema-p1-baseline`
- Ref: `kzzagbojjkivdzzcrmxn`

Never use Production.

Required P-1 environment variables must come from local ignored files, Vercel Environment Variables, or CI secrets:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `P1_TEST_PASSWORD`

Never hardcode, commit, print, or persist secrets in Git.

## Priority Order

Follow this order strictly:

1. Canonicalize Vercel.
2. Finish P4.7 security, RLS, and CI.
3. Run real QA for 9 personas with `signInWithPassword()`.
4. Run E2E coverage for onboarding, invitations, beta, auth callback, child switch, notifications, social, messaging, and approvals.
5. Validate accessibility, responsive behavior, performance, mobile, Lighthouse, WCAG, focus, and keyboard.
6. Validate closed beta invitations, expiration, revoke, replay, and onboarding.
7. Validate commercial work: Stripe, entitlements, webhooks, and plans.
8. Work on pedagogical content only after everything above is complete.

## Persona QA

The 9 persona QA gate must test real runtime logins and access control for:

- Student Monde
- Student Racines
- Family
- Teacher
- Coach
- Center
- Admin
- Child Monde
- Child Racines

Tests must use `signInWithPassword()`, not mocks.

Required flows:

- Login
- Logout
- Dashboard
- Authorized routes
- Forbidden routes

## Current Known State

Already implemented in PR `#29`; do not break these:

- Vercel canonicalization work.
- P4.7 fail-closed behavior.
- Fixture recovery.
- Credential alignment.
- Persona wrapper.
- Adult route QA.
- Child identity QA.
- Restore payloads.
- CI corrections.

Current blocker:

- Real QA runtime needs aligned QA accounts or a new QA account set, then real login execution.

## Iteration Rule

For each iteration:

1. Find one concrete problem.
2. Fix it.
3. Add a regression test.
4. Validate with CI or the narrowest reliable equivalent.
5. Report only what was proven.

Never declare a gate green without evidence.
