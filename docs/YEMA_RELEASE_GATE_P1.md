# YEMA · P-1 Release Gate

Canonical command:

```bash
node scripts/test-release-gate-p1.mjs
```

The entrypoint loads `.env.p1-baseline` through the existing strict P-1 wrapper,
rejects known Production/legacy Supabase refs, and then runs the checks below in
order.

1. Vitest
2. TypeScript (`tsc --noEmit`)
3. Next.js build
4. 9-persona authenticated runtime matrix
5. 9-persona FR/EN visual sweep (390 / 768 / 1440)
6. Monde assignments E2E
7. Messaging Realtime E2E
8. Messaging audio E2E
9. Final browser acceptance

The gate is fail-fast. No later step runs after an earlier failure.

Passing this gate is required before merging the P4.7 security branch. A Vercel
`build-rate-limit` status is not a passing build and cannot replace this gate.
