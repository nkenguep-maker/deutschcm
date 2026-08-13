# YEMA Agent Guardrails

## Mission

Bring YEMA to an open beta on Preview, then prepare Production only after every gate is proven green.

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
3. Validate open-beta acquisition: public registration, email confirmation, auth callback, onboarding, and first dashboard.
4. Run E2E coverage for logout, child switch, notifications, social, messaging, approvals, and the public onboarding funnel.
5. Validate accessibility, responsive behavior, performance, mobile, Lighthouse, WCAG, focus, and keyboard.
6. Run real QA for 9 personas with `signInWithPassword()`.
7. Validate commercial work: Stripe, entitlements, webhooks, and plans.
8. Work on pedagogical content only after everything above is complete.

## Open Beta Mode

- Public registration is the intended Preview experience.
- Keep `YEMA_CLOSED_BETA_ENABLED` unset or `false` in Preview while open beta is active.
- The closed-beta invitation flow remains dormant and must not gate public signup, callback reconciliation, or onboarding unless the server-only flag is explicitly set to `true`.

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

- Real QA runtime still needs aligned QA accounts or a new QA account set. This is a later gate and does not block the public open-beta funnel.

## Iteration Rule

For each iteration:

1. Find one concrete problem.
2. Fix it.
3. Add a regression test.
4. Validate with CI or the narrowest reliable equivalent.
5. Report only what was proven.

Never declare a gate green without evidence.
