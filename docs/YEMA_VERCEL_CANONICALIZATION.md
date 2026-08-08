# YEMA · Vercel canonicalization

## Current state

Two Vercel projects are connected to `nkenguep-maker/deutschcm` in team `Yema`:

- `deutschcm` · `prj_PLFNBguAjasd0WADQ2m63izD1RS7`
  - currently owns canonical public domain `deutschcm.vercel.app`;
- `deutschcm-fqsr` · `prj_tYT5aw4koV0BhcbuyK1BdF0b1f5n`
  - has received newer `main`/branch deployments.

Both Git integrations currently attempt to build the same commits and both
status checks fail with Vercel `build-rate-limit` on recent commits.

## Safe remediation

No destructive action has been performed through automation because the
available Vercel connector does not expose project deletion, Git-disconnect or
domain reassignment actions.

The required dashboard remediation is:

1. Decide one canonical project.
2. Keep `deutschcm.vercel.app` attached to that project.
3. Disconnect the duplicate project's Git integration (or remove the duplicate project once its domains/config are no longer needed).
4. Confirm exactly one Vercel deployment/check is created for a new test commit.
5. Confirm `main` maps to Production and non-main branches map to Preview.
6. Re-run the P-1 release gate before any security PR merge.

## Selection constraint

Do not simply delete `deutschcm-fqsr`: it has received newer deployments.
Do not simply delete `deutschcm`: it currently owns the public canonical domain.
First compare environment variables, project settings and domains, then
canonicalize deliberately.

## Merge rule

Until this is resolved, Vercel `build-rate-limit` is treated as an
infrastructure failure, not as a passing build. A security branch must still
obtain independent GitHub/static CI plus P-1 runtime/E2E validation before merge.
