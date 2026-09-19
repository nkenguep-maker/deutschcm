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
3. RLS inventory + all P0 domain RLS gates (P-1 read-only)
4. AccessGrant provenance (P-1 read-only audit)
5. Next.js build
6. QA persona fixture + beta-admission checks
7. 9-persona authenticated runtime matrix
8. Canonical persona home-route verification
9. 9-persona FR/EN visual sweep (390 / 768 / 1440)
10. Monde assignments E2E
11. Messaging Realtime E2E
12. Messaging audio E2E
13. Final browser acceptance

The gate is fail-fast. No later step runs after an earlier failure.

Passing this gate is required before merging the P4.7 security branch. A Vercel
`build-rate-limit` status is not a passing build and cannot replace this gate.
