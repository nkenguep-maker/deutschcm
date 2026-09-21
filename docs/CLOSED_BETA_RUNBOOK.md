# YEMA · Public signup + optional closed-beta runbook

This runbook is operational and fail-closed. It contains no secret values and must never be used to bypass the P-1 / Production separation.

## 1. Canonical product funnel

Default product behavior:

1. public landing is accessible;
2. `S’inscrire / Sign up` opens `/{locale}/register`;
3. an adult creates one YEMA identity with first name, last name, email and password (or Google OAuth);
4. after confirmation, the user chooses an adult persona;
5. YEMA opens the persona-specific onboarding;
6. completion stores the real profile and routes to the exact persona home;
7. later logins reopen the exact persona home, or the incomplete onboarding if it was not finished.

Children are not independent Auth identities. A Family/Parent adult account creates Child Monde and/or Child Racines profiles. Children use avatar + child PIN and never require an email address.

The optional closed-beta wall remains available through `YEMA_CLOSED_BETA_ENABLED=true`. When enabled, the proxy redirects public `/register` traffic to `/beta`. The landing itself stays wired to the canonical registration route so public signup can be reopened without rewriting the product surface.

## 2. Canonical nine-persona QA matrix

Nine personas are validated as:

### Seven adult identities with distinct emails

- Student Monde
- Student Racines
- Family / Parent
- Teacher
- Roots Coach
- Center Admin
- Super Admin (assigned by YEMA; never self-service)

### Two child profiles under the Family adult

- Child Monde
- Child Racines

The two children have no email addresses.

The read-only P-1 verifier is exposed as:

```bash
npm run verify:persona-accounts:p1
```

It consumes these local P-1 environment names only:

- `P1_PERSONA_STUDENT_MONDE_EMAIL`
- `P1_PERSONA_STUDENT_RACINES_EMAIL`
- `P1_PERSONA_FAMILY_EMAIL`
- `P1_PERSONA_TEACHER_EMAIL`
- `P1_PERSONA_COACH_EMAIL`
- `P1_PERSONA_CENTER_EMAIL`
- `P1_PERSONA_ADMIN_EMAIL`

The verifier requires seven distinct adult emails, then resolves the two children through the Family `parentUserId` and their MONDE/RACINES universes.

## 3. Persona destinations

- Student Monde → Monde onboarding → `/dashboard`
- Student Racines → Racines onboarding → `/dashboard`
- Family → Family onboarding → `/family`
- Teacher → verified Teacher onboarding → `/teacher`
- Roots Coach → verified Coach onboarding → `/coach/racines`
- Center Admin → verified Center onboarding → `/center`
- Super Admin → `/admin`
- Child Monde → signed child session → child Monde dashboard
- Child Racines → signed child session → child Racines dashboard

Direct persona URLs also resolve the canonical persona and cannot skip an incomplete onboarding.

## 4. Professional persona rules

Production never grants professional roles from browser input.

- Teacher and Center requests are PENDING until trusted approval.
- Roots Coach is activated only through the trusted role path.
- Super Admin is never self-service.

Canonical P-1 technical QA is the only environment where Teacher, Center and Coach can be auto-activated so separate test accounts can exercise their complete onboarding and dashboard. The P-1 environment check rejects Vercel Production and non-P-1 Supabase projects.

Center onboarding creates/updates the LanguageCenter, writes `User.centerId` and persists the private Center membership binding in the same database transaction.

## 5. Profile identity

Adult registration captures first name + last name once. Confirmed identity is reused in later onboarding instead of being discarded.

Current dashboard projections include the saved identity for:

- Student Monde / Racines greetings;
- Family guardian;
- Teacher;
- Roots Coach;
- Center representative (organization name remains the Center title);
- Admin through its existing profile.

`user_metadata` carries only UX/profile intent. Authorization remains DB-derived.

## 6. Pricing intent without payment coupling

Pricing selections survive registration/confirmation/onboarding but do not create an Order, AccessGrant or charge.

Compatible intent:

- Passage A1–C1 → Student Monde;
- `racines-solo` → Student Racines;
- `racines-famille` → Family;
- optional `roots-solo` add-on → Student Monde only;
- professional personas do not inherit learner/family plan intent.

An already signed-in Student Monde can return to Monde pricing and save the optional Roots Solo add-on on the same account. This keeps one login with separate World/Roots progression intent. Access remains false until the future commercial checkout is connected.

## 7. P-1 child testing without fake purchases

On canonical P-1 only, a Family tester without real grants receives one technical Monde child seat so both Child Monde and Child Racines can be exercised. The historical Racines fallback remains. No Order or AccessGrant is fabricated and Production never receives the technical Monde seat.

## 8. P-1 safety boundary

- Production Supabase is never used for QA.
- Canonical P-1 project ref: `kzzagbojjkivdzzcrmxn`.
- Known Production/old refs are rejected by wrappers and verification scripts.
- `.env.p1-baseline` remains local and gitignored.
- Do not reset real accounts or copy Production credentials to bypass missing QA secrets.

## 9. Database migrations already validated on P-1

1. `20260808000001_p4_7_rls_identity_hardening`
2. `20260808000002_closed_beta_invitations`
3. `20260808000003_closed_beta_timestamp_alignment`
4. `20260808094837_p4_7_realtime_rls_initplan`
5. `20260808095727_p4_5_select_policy_consolidation`
6. `20260808105029_social_pending_uniqueness`

Expected state:

- `beta_invitations` RLS enabled, no anon/authenticated DML;
- no P4.7 Realtime `auth_rls_initplan` warnings from the fixed policies;
- consolidated P4.5 policies remain deny-by-default through the Data API;
- social PENDING duplicates are rejected by partial unique indexes.

## 10. Canonical P-1 release gates

Static/local validation:

```bash
npm test
npm run build
```

Authenticated P-1 release gate:

```bash
npm run test:release-gate:p1
```

Real account matrix verification after the seven adult accounts and two child profiles exist:

```bash
npm run verify:persona-accounts:p1
```

Do not merge when the authenticated runtime gate is skipped because required local P-1 credentials are unavailable.

## 11. Vercel canonicalization

Two Vercel projects have historically built the same Git repository:

- keep: `deutschcm` (`prj_PLFNBguAjasd0WADQ2m63izD1RS7`) — owns `deutschcm.vercel.app`;
- duplicate: `deutschcm-fqsr` (`prj_tYT5aw4koV0BhcbuyK1BdF0b1f5n`).

Before disconnecting the duplicate, compare Preview/Production environment variables, deployment protection and build settings. Disconnect its Git integration before deletion, verify a push triggers only one canonical build, then consider deleting it. Do not delete it blindly because its Preview protection was already observed to differ.

## 12. Production activation / rollback

Production remains untouched by this branch.

Before public launch or closed-beta launch:

1. confirm exact Git SHA and green gates;
2. canonicalize Vercel;
3. review/apply Production migrations separately from P-1;
4. configure Production-only secrets;
5. choose public signup (`YEMA_CLOSED_BETA_ENABLED=false`) or closed beta (`true`);
6. deploy and smoke-test designated accounts.

If admission/auth/routing behaves unexpectedly, disable the closed-beta flag if it was enabled, stop issuing invitations, and reproduce the issue on P-1 before any destructive data action.
