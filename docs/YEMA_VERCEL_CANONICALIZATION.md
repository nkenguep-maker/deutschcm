# YEMA · Vercel canonicalization

## Current state

Two Vercel projects remain connected to `nkenguep-maker/deutschcm` in team `Yema`:

- `deutschcm` · `prj_PLFNBguAjasd0WADQ2m63izD1RS7`
  - owns the canonical public domain `deutschcm.vercel.app`;
  - is the preferred canonical project;
  - most recently built P4.7 branch commit `9a4fa3f9f3a842e17fc971aa85d5f755d7b57e72` successfully as Preview;
- `deutschcm-fqsr` · `prj_tYT5aw4koV0BhcbuyK1BdF0b1f5n`
  - is still connected to the same GitHub repository;
  - its most recent observed Preview is older (`297ef2d63079d85d1b74f19abdd480f5cdc6eeff`);
  - no recent evidence shows it building the Sessions/Notes commits.

This reduces the immediate duplicate-build pressure on the latest commits, but it does **not** prove the duplicate project is safely disconnected. Both projects still exist and retain independent project configuration.

The current evidence makes `deutschcm` the canonical candidate because it owns the public canonical domain and is the project still advancing with the P4.7 branch. This remains a diagnosis, not authorization to delete or disconnect the other project blindly.

## Safe remediation

No destructive action has been performed through automation because the available Vercel connector does not expose a safe comparison of environment variable values together with Git-disconnect or project-deletion actions.

The required dashboard remediation is:

1. Compare Preview and Production environment variable names/targets between both projects (do not copy or expose secret values unnecessarily).
2. Compare build/root/framework settings and any non-default domains.
3. Keep `deutschcm` as canonical if no required configuration exists only on `deutschcm-fqsr`.
4. Keep `deutschcm.vercel.app` attached to the canonical project.
5. Disconnect the duplicate project's Git integration first; delete the duplicate only later if its configuration/domains are confirmed unnecessary.
6. Push one harmless test commit on a non-main branch and confirm exactly one Vercel Preview/check is created.
7. Confirm `main` maps to Production and non-main branches map to Preview only on the canonical project.
8. Re-run the P-1 release gate before any security PR merge.

## Latest validation checkpoint

The Sessions/Notes head `00b24a005aa7430d78b8c3842c776f84b2a24a62` passed all four GitHub workflows before its P-1 schema was applied. The P-1-only migration `roots_coach_sessions` was then applied to project `kzzagbojjkivdzzcrmxn` and verified with RLS enabled and no `anon`/`authenticated` SELECT privileges on either new table.

This documentation-only commit intentionally triggers a fresh non-main Preview so that the next runtime validation can target an exact head containing the complete Sessions/Notes lot rather than the earlier partial Preview commit.

## Selection constraint

Do not simply delete `deutschcm-fqsr`: it has received independent deployments and may still contain configuration that must be compared first.
Do not delete `deutschcm`: it owns the public canonical domain and currently has the strongest evidence for canonical status.

## Merge rule

Duplicate Vercel delivery is an infrastructure gate, not a passing state. A security branch must still obtain independent GitHub/static CI plus P-1 runtime/E2E validation before merge. No Production deployment or merge is authorized until those gates are green and Vercel canonicalization is resolved deliberately.
