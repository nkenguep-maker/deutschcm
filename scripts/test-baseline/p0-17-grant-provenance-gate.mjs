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
    select g.id, g."sourceType"::text as source_type, g."sourceId"
    from public.access_grants g
    where g.status::text = 'ACTIVE'
      and g."sourceType"::text <> 'ORDER'
      and g."sourceId" !~ '^(test[_-]|internal-test:)'
      and not (
        (
          g."sourceType"::text = 'SUBSCRIPTION'
          and g."beneficiaryType"::text = 'USER'
          and g.metadata->>'seatType' = 'ADULT_ROOTS'
          and g.metadata->>'householdId' = g."sourceId"
          and exists (
            select 1
            from public.access_grants backing
            join public.product_variants pv on pv.id = backing."productVariantId"
            join public.products p on p.id = pv."productId"
            where backing.id = g.metadata->>'backingGrantId'
              and backing."beneficiaryType"::text = 'HOUSEHOLD'
              and backing."beneficiaryId" = g."sourceId"
              and backing."productVariantId" = g."productVariantId"
              and backing.status::text = 'ACTIVE'
              and backing."startsAt" <= now()
              and (backing."endsAt" is null or backing."endsAt" > now())
              and p.code::text = 'ROOTS_FAMILY'
          )
        )
        or
        (
          g."sourceType"::text = 'PROMO'
          and g."beneficiaryType"::text = 'LEARNING_PATH'
          and g."orderItemId" is null
          and g.metadata->>'kind' = 'MVP_TRIAL'
          and g.metadata->>'learningPathId' = g."beneficiaryId"
          and g.metadata->>'trialDays' = '30'
          and g."endsAt" = g."startsAt" + interval '30 days'
          and g."sourceId" = concat(
            'mvp-trial:',
            g.metadata->>'cohort',
            ':',
            g.metadata->>'userId',
            ':',
            g.metadata->>'productCode'
          )
          and exists (
            select 1
            from public.learning_paths lp
            join public.product_variants pv on pv.id = g."productVariantId"
            join public.products p on p.id = pv."productId"
            where lp.id = g."beneficiaryId"
              and lp."userId" = g.metadata->>'userId'
              and lp.status::text = 'ACTIVE'
              and pv.active = true
              and pv.currency::text = 'EUR'
              and p."isActive" = true
              and p.code::text = g.metadata->>'productCode'
              and (
                (
                  p.code::text = 'PASSAGE'
                  and lp.universe::text = 'MONDE'
                  and lp.language::text = 'DEUTSCH'
                  and (lp."currentLevel" is null or lp."currentLevel"::text = 'A1')
                  and pv.language::text = 'DEUTSCH'
                  and pv.level::text = 'A1'
                )
                or
                (
                  p.code::text = 'ROOTS_SOLO'
                  and lp.universe::text = 'RACINES'
                  and lp.language::text = 'BASSA'
                  and pv.language::text = 'BASSA'
                  and pv.level is null
                  and pv."durationDays" = 30
                )
              )
          )
        )
      )
  `);
  if (unexplainedNonOrder.rowCount !== 0) {
    fail(
      `${unexplainedNonOrder.rowCount} active non-ORDER grant(s) lack an audited fixture, backed adult-seat provenance, or valid MVP trial provenance`,
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
