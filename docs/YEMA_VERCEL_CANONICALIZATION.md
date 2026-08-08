# YEMA · Vercel canonicalization

## Current state

Two Vercel projects are connected to `nkenguep-maker/deutschcm` in team `Yema`:

- `deutschcm` · `prj_PLFNBguAjasd0WADQ2m63izD1RS7`
  - owns the canonical public domain `deutschcm.vercel.app`;
  - built the current P4.7 branch head `a61210d2146463a43fd2403b716198044d724b6b` successfully as Preview;
- `deutschcm-fqsr` · `prj_tYT5aw4koV0BhcbuyK1BdF0b1f5n`
  - is connected to the same GitHub repository;
  - also creates Preview deployments from the same branch;
  - also receives `target=production` deployments from `main`;
  - its latest P4.7 Preview currently trails the branch head by one commit (`fa918148e99c596bcb0b4311868638bc14ea516b`).

This is therefore not only duplicate Preview capacity: both projects are eligible to produce Production deployments from `main`.

The current evidence makes `deutschcm` the preferred canonical candidate because it owns the public canonical domain and has a READY Preview for the exact current P4.7 head. This is still a diagnosis, not authorization to delete or disconnect the other project.

## Safe remediation

No destructive action has been performed through automation because the available Vercel connector does not expose a safe comparison of environment variables/secrets together with Git-disconnect or project-deletion actions.

The required dashboard remediation is:

1. Compare Preview and Production environment variable names/targets between both projects (do not copy or expose secret values unnecessarily).
2. Compare build/root/framework settings and any non-default domains.
3. Keep `deutschcm` as canonical if no required configuration exists only on `deutschcm-fqsr`.
4. Keep `deutschcm.vercel.app` attached to the canonical project.
5. Disconnect the duplicate project's Git integration first; delete the duplicate only later if its configuration/domains are confirmed unnecessary.
6. Push one harmless test commit on a non-main branch and confirm exactly one Vercel Preview/check is created.
7. Confirm `main` maps to Production and non-main branches map to Preview only on the canonical project.
8. Re-run the P-1 release gate before any security PR merge.

## Selection constraint

Do not simply delete `deutschcm-fqsr`: it has received independent Production deployments and may still contain configuration that must be compared first.
Do not delete `deutschcm`: it owns the public canonical domain and currently has the strongest evidence for canonical status.

## Merge rule

Duplicate Vercel delivery is an infrastructure gate, not a passing state. A security branch must still obtain independent GitHub/static CI plus P-1 runtime/E2E validation before merge. No Production deployment or merge is authorized until those gates are green and Vercel canonicalization is resolved deliberately.
