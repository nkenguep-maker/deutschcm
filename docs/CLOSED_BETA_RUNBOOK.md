# YEMA · Closed Beta Runbook

This runbook is intentionally operational and fail-closed. It contains no secret values and must never be used to bypass the P-1 / Production separation.

## 1. Non-negotiable safety boundary

- Production Supabase is never used for QA or beta validation.
- Canonical P-1 project ref: `kzzagbojjkivdzzcrmxn`.
- Known non-P-1 refs are rejected by the test wrappers.
- Closed beta stays disabled until the authenticated P-1 release gate is green on the exact release head.
- Do not reset QA accounts or copy Production credentials to work around missing local test secrets.

## 2. Canonicalize Vercel before activation

Current state has two Vercel projects building the same repository:

- keep: `deutschcm` (`prj_PLFNBguAjasd0WADQ2m63izD1RS7`) — owns `deutschcm.vercel.app`;
- duplicate: `deutschcm-fqsr` (`prj_tYT5aw4koV0BhcbuyK1BdF0b1f5n`).

Before disconnecting the duplicate:

1. compare Preview/Production environment variables;
2. compare deployment protection settings;
3. compare Git root/build/framework settings;
4. copy any intentional setting missing from the canonical project;
5. disconnect the Git integration from `deutschcm-fqsr` first;
6. verify one push triggers only the canonical Vercel check;
7. only then consider deleting the duplicate project.

Do not delete the duplicate blindly: its Preview protection is already known to differ from the canonical project.

## 3. Preview closed-beta configuration

On the canonical Preview environment, configure server-side values only:

- `YEMA_CLOSED_BETA_ENABLED=true`
- `YEMA_BETA_INVITE_SECRET=<random secret, at least 32 characters>`
- P-1 Supabase URL / anon / service-role / DB URLs according to the P-1 safety wrappers
- `YEMA_CHILD_SESSION_SECRET=<Preview/P-1 secret>`
- existing feature flags required by the release gate

Never expose the invite secret with `NEXT_PUBLIC_`.

### Supabase Auth

For the actual closed beta, disable public user signups in the target Supabase Auth settings. The application already prevents an uninvited Auth identity from being reconciled into a YEMA Prisma user, but disabling public signup prevents orphan Auth identities from being created directly through the Supabase API.

Enable compromised-password protection before broader external testing when the Supabase plan/settings support it. This is currently the remaining Security Advisor warning and must be changed through supported Auth settings, not ad-hoc SQL.

## 4. Database state required on P-1

The following migrations must exist in order:

1. `20260808000001_p4_7_rls_identity_hardening`
2. `20260808000002_closed_beta_invitations`
3. `20260808000003_closed_beta_timestamp_alignment`
4. `20260808094837_p4_7_realtime_rls_initplan`
5. `20260808095727_p4_5_select_policy_consolidation`

Expected checks:

- `beta_invitations` has RLS enabled;
- `anon` / `authenticated` have no DML grants on `beta_invitations`;
- P4.5 Data API tables remain deny-by-default unless intentionally granted later;
- no `auth_rls_initplan` or `multiple_permissive_policies` WARN remains for the P4.7/P4.5 policies changed by this branch.

## 5. Preview smoke checks with closed beta ON

Use a Preview built from the exact release head. An older green Preview is not sufficient.

Anonymous checks:

- `/{locale}/register` redirects to `/{locale}/beta`;
- `/{locale}/landing` redirects to `/{locale}/beta`;
- beta routes are `noindex, nofollow`;
- protected pages still require authentication;
- public center/teacher application endpoints reject cross-origin writes.

Authenticated but not admitted identity:

- protected pages redirect to beta entrance;
- protected API calls return closed-beta denial;
- `/api/auth/sync` returns `403 beta_access_required` before any Prisma reconciliation;
- auth callback signs the identity out and redirects to beta instead of provisioning a YEMA user.

Admin bootstrap identity:

- remains accessible through exact linked Supabase UID + active DB ADMIN role;
- can open `/{locale}/admin/beta`;
- can create and revoke beta invitations;
- invitation operations never grant Teacher, Center or Admin roles.

## 6. Invitation acceptance scenarios

Test on P-1 only.

### New user

- signed token is bound to the invited email;
- token exists only in the URL fragment and is removed from browser history after reading;
- acceptance creates Auth + Prisma STUDENT only;
- beta access is written before reconciliation;
- replay of the same invitation is rejected;
- failure compensates Auth/Prisma writes and releases a recoverable claim.

### Existing user

- current Supabase Auth email must still match the invited email;
- password and roles remain unchanged;
- only `beta_access` changes;
- if ledger finalization fails, the previous beta-access state is restored.

### Concurrency / supersede

- only one live invitation per email hash is issuable under concurrent admin requests;
- a newer invite revokes older PENDING and unfinalized ACCEPTED claims;
- a superseded claim cannot be resurrected by stale-claim recovery;
- a server crash can recover only an incomplete, non-revoked claim older than the stale threshold.

## 7. Social / capacity smoke checks

Run with real P-1 fixtures after the exact release build is available.

- classroom join request does not enroll before teacher approval;
- classroom acceptance rechecks `maxStudents` under an advisory lock;
- concurrent acceptances cannot consume the same final classroom seat;
- group request/invite acceptance rechecks `maxMembers` under a group lock;
- direct group-code join uses the same capacity invariant;
- accepted/refused decisions are pending-only and cannot overwrite each other under double-click/concurrency;
- notification failures do not roll back already committed membership decisions.

## 8. Full P-1 release gate

Run the canonical command with the local P-1 environment available:

```bash
node scripts/test-release-gate-p1.mjs
```

The orchestrated gate must cover:

1. full Vitest suite;
2. TypeScript;
3. Next build;
4. QA beta admission;
5. 9-persona authenticated runtime;
6. 9-persona FR/EN visual sweep;
7. Monde assignments E2E;
8. Messaging Realtime E2E;
9. Messaging audio E2E;
10. final browser acceptance.

Do not merge if any step is skipped because a required P-1 credential is unavailable.

## 9. Production preflight

Before any Production deployment, run:

```bash
npm run preflight:release:prod
```

When `YEMA_CLOSED_BETA_ENABLED=true`, the preflight additionally requires a `YEMA_BETA_INVITE_SECRET` of at least 32 characters. The script logs environment variable names only, never secret values.

## 10. Production activation decision

Only after all previous gates are green:

1. confirm the exact Git commit SHA;
2. confirm one canonical Vercel project builds it;
3. confirm Production migrations are planned/reviewed separately from P-1;
4. configure Production closed-beta env values using Production-only secrets;
5. disable public Supabase Auth signup in Production if closed beta is the launch mode;
6. deploy;
7. execute a minimal production smoke using designated operator/test accounts only;
8. send real invitations only after the smoke is green.

## 11. Rollback

If admission, auth, or routing behaves unexpectedly:

1. set `YEMA_CLOSED_BETA_ENABLED=false` and redeploy the canonical project;
2. stop issuing invitations;
3. revoke outstanding PENDING invitations if necessary;
4. do **not** delete the beta ledger as an emergency action;
5. do **not** remove roles or passwords from existing users;
6. investigate using audit/log evidence and reproduce on P-1 before re-enabling.

Existing `app_metadata.beta_access` values are inert while the closed-beta flag is disabled, so rollback does not require destructive user metadata cleanup.
