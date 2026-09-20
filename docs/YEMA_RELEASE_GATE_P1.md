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
5. Adult ROOTS_FAMILY seat uniqueness/concurrency invariant (P-1 read-only)
6. MVP trial provenance + launch catalogue invariant (P-1 read-only)
7. German A1 refonte v2 invariants (legacy 6×6 archived, 12×5 source contract, 480-card memory surface, public READY closed; P-1 read-only)
8. Next.js build
9. QA persona fixture + beta-admission checks
10. 9-persona authenticated runtime matrix
11. Canonical persona home-route verification
12. 9-persona FR/EN visual sweep (390 / 768 / 1440)
13. Monde assignments E2E
14. Messaging Realtime E2E
15. Messaging audio E2E
16. Final browser acceptance

The gate is fail-fast. No later step runs after an earlier failure.

Passing this gate is required before merging the P4.7 security branch. A Vercel
`build-rate-limit` status is not a passing build and cannot replace this gate.


## A1 refonte note

The A1 gate deliberately does not declare the level READY. It proves that the
superseded 6-unit runtime remains archived, the canonical refonte source now
contains 12 units / 60 lessons / 300 exercises / 480 stable cards / 36 guided
hours, and the server-side learning memory remains closed to client roles.

The source-integration gate is now complete (`fullLevelIntegrated=true`), but
public A1 must remain unavailable while `status=REFONTE_IN_PROGRESS`.
Two detailed generic mock exams are now integrated in QA. Critical native
audio, user QA, the full P-1 release gate, and explicit signoff are still
required before any Production publication or READY status.
