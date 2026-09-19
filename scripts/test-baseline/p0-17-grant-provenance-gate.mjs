#!/usr/bin/env node
// P0.17 · AccessGrant provenance gate for canonical P-1.
//
// Read-only verification. Must run through the strict P-1 wrapper.
// Runtime ORDER grants must be fully derivable from a paid order item and an
// exactly matching confirmed payment. Non-ORDER active grants are permitted
// on P-1 only when they are explicit test fixtures.

import pg from "pg";
import { assertNonProduction } from "./_common.mjs";

const { Client } = pg;

function fail(message) {
  throw new Error(`P0.17 grant provenance gate failed: ${message}`);
}

assertNonProduction();

const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
if (!connectionString) fail("DATABASE_URL/DIRECT_URL missing");

const db = new Client({ connectionString });

try {
  await db.connect();

  const constraint = await db.query(`
    select convalidated
    from pg_constraint
    where conname = 'access_grants_order_source_consistency'
      and conrelid = 'public.access_grants'::regclass
  `);
  if (constraint.rowCount !== 1 || constraint.rows[0].convalidated !== true) {
    fail("order/source consistency constraint missing or unvalidated");
  }

  const uniqueIndex = await db.query(`
    select indexdef
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'access_grants'
      and indexname = 'access_grants_one_grant_per_order_item_idx'
  `);
  if (
    uniqueIndex.rowCount !== 1 ||
    !/CREATE UNIQUE INDEX/i.test(uniqueIndex.rows[0].indexdef) ||
    !/WHERE .*orderItemId.* IS NOT NULL/i.test(uniqueIndex.rows[0].indexdef)
  ) {
    fail("one-grant-per-order-item unique partial index missing");
  }

  const invalidOrder = await db.query(`
    select g.id
    from public.access_grants g
    left join public.order_items oi on oi.id = g."orderItemId"
    left join public.orders o on o.id = oi."orderId"
    where g."sourceType"::text = 'ORDER'
      and (
        g."orderItemId" is null
        or oi.id is null
        or o.id is null
        or g."sourceId" <> oi."orderId"
        or g."productVariantId" <> oi."productVariantId"
        or g."beneficiaryType" <> oi."beneficiaryType"
        or g."beneficiaryId" <> oi."beneficiaryId"
        or o.status::text <> 'PAID'
        or not exists (
          select 1
          from public.payments p
          where p."orderId" = o.id
            and p.status::text = 'CONFIRMED'
            and p."confirmedAt" is not null
            and p.currency = o.currency
            and p.amount = o.total
        )
      )
  `);
  if (invalidOrder.rowCount !== 0) {
    fail(`${invalidOrder.rowCount} ORDER grant(s) lack canonical payment provenance`);
  }

  const duplicates = await db.query(`
    select "orderItemId", count(*)::int as count
    from public.access_grants
    where "orderItemId" is not null
    group by "orderItemId"
    having count(*) > 1
  `);
  if (duplicates.rowCount !== 0) {
    fail(`${duplicates.rowCount} order item(s) have duplicate grants`);
  }

  const unexplainedNonOrder = await db.query(`
    select id, "sourceType"::text as source_type, "sourceId"
    from public.access_grants
    where status::text = 'ACTIVE'
      and "sourceType"::text <> 'ORDER'
      and "sourceId" !~ '^(test[_-]|internal-test:)'
  `);
  if (unexplainedNonOrder.rowCount !== 0) {
    fail(
      `${unexplainedNonOrder.rowCount} active non-ORDER grant(s) are not explicit P-1 test fixtures`,
    );
  }

  const unsupportedSources = await db.query(`
    select distinct "sourceType"::text as source_type
    from public.access_grants
    where "sourceType"::text not in ('ORDER', 'SUBSCRIPTION', 'CENTER_SEAT', 'PROMO')
  `);
  if (unsupportedSources.rowCount !== 0) {
    fail("unsupported grant source type present");
  }

  process.stdout.write(
    "[P0.17] GRANT PROVENANCE OK · DB invariants=2 · invalid ORDER=0 · duplicate orderItem=0 · unexplained active non-ORDER=0\n",
  );
} finally {
  await db.end().catch(() => {});
}
