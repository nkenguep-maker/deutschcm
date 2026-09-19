#!/usr/bin/env node
// P0.20 · Adult ROOTS_FAMILY seat concurrency/uniqueness gate.
// Read-only P-1 verification.

import pg from "pg";
import { assertNonProduction } from "./_common.mjs";

const { Client } = pg;
assertNonProduction();

const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
if (!connectionString) throw new Error("P0.20 gate: DATABASE_URL/DIRECT_URL missing");

const db = new Client({ connectionString });

try {
  await db.connect();

  const index = await db.query(`
    select indexdef
    from pg_indexes
    where schemaname='public'
      and tablename='access_grants'
      and indexname='access_grants_one_active_adult_roots_seat_per_household_user_idx'
  `);
  if (index.rowCount !== 1 || !/CREATE UNIQUE INDEX/i.test(index.rows[0].indexdef)) {
    throw new Error("P0.20 gate: adult seat unique partial index missing");
  }

  const duplicates = await db.query(`
    select "sourceId", "beneficiaryId", count(*)::int as count
    from public.access_grants
    where "sourceType"::text='SUBSCRIPTION'
      and "beneficiaryType"::text='USER'
      and status::text='ACTIVE'
      and metadata->>'seatType'='ADULT_ROOTS'
    group by "sourceId", "beneficiaryId"
    having count(*) > 1
  `);
  if (duplicates.rowCount !== 0) {
    throw new Error(
      `P0.20 gate: ${duplicates.rowCount} duplicate active adult seat assignment(s)`,
    );
  }

  process.stdout.write(
    "[P0.20] ADULT ROOTS SEATS OK · unique partial index present · duplicate active seats=0\n",
  );
} finally {
  await db.end().catch(() => {});
}
