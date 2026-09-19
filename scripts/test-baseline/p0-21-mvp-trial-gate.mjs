#!/usr/bin/env node
// P0.21 · MVP cohort trial gate for canonical P-1.
// Read-only: validates the catalogue, unique source invariant, and any trial
// records already present.

import pg from "pg";
import { assertNonProduction } from "./_common.mjs";

const { Client } = pg;
assertNonProduction();

const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
if (!connectionString) throw new Error("P0.21 gate: DATABASE_URL/DIRECT_URL missing");

const db = new Client({ connectionString });

try {
  await db.connect();

  const index = await db.query(`
    select indexdef
    from pg_indexes
    where schemaname='public'
      and tablename='access_grants'
      and indexname='access_grants_one_mvp_trial_per_source_idx'
  `);
  if (index.rowCount !== 1 || !/CREATE UNIQUE INDEX/i.test(index.rows[0].indexdef)) {
    throw new Error("P0.21 gate: MVP trial unique source index missing");
  }

  const catalogue = await db.query(`
    select p.code::text as code, count(*)::int as variants
    from public.product_variants pv
    join public.products p on p.id = pv."productId"
    where pv.active = true
      and p."isActive" = true
      and pv.currency::text = 'EUR'
      and (
        (
          p.code::text='PASSAGE'
          and pv.language::text='DEUTSCH'
          and pv.level::text='A1'
        )
        or
        (
          p.code::text='ROOTS_SOLO'
          and pv.language::text='WOLOF'
          and pv.level is null
          and pv."durationDays"=30
        )
      )
    group by p.code::text
  `);
  const products = new Map(catalogue.rows.map((row) => [row.code, Number(row.variants)]));
  if ((products.get("PASSAGE") ?? 0) < 1 || (products.get("ROOTS_SOLO") ?? 0) < 1) {
    throw new Error("P0.21 gate: launch trial catalogue variants missing");
  }

  const invalid = await db.query(`
    select g.id
    from public.access_grants g
    left join public.learning_paths lp on lp.id = g."beneficiaryId"
    left join public.product_variants pv on pv.id = g."productVariantId"
    left join public.products p on p.id = pv."productId"
    where g.metadata->>'kind'='MVP_TRIAL'
      and (
        g."sourceType"::text <> 'PROMO'
        or g."beneficiaryType"::text <> 'LEARNING_PATH'
        or g."orderItemId" is not null
        or g.metadata->>'learningPathId' <> g."beneficiaryId"
        or g.metadata->>'trialDays' <> '30'
        or g."endsAt" <> g."startsAt" + interval '30 days'
        or lp.id is null
        or lp."userId" <> g.metadata->>'userId'
        or lp.status::text <> 'ACTIVE'
        or pv.active is not true
        or p."isActive" is not true
        or pv.currency::text <> 'EUR'
        or p.code::text <> g.metadata->>'productCode'
        or g."sourceId" <> concat(
          'mvp-trial:',
          g.metadata->>'cohort',
          ':',
          g.metadata->>'userId',
          ':',
          g.metadata->>'productCode'
        )
        or not (
          (
            p.code::text='PASSAGE'
            and lp.universe::text='MONDE'
            and lp.language::text='DEUTSCH'
            and (lp."currentLevel" is null or lp."currentLevel"::text='A1')
            and pv.language::text='DEUTSCH'
            and pv.level::text='A1'
          )
          or
          (
            p.code::text='ROOTS_SOLO'
            and lp.universe::text='RACINES'
            and lp.language::text='WOLOF'
            and pv.language::text='WOLOF'
            and pv.level is null
            and pv."durationDays"=30
          )
        )
      )
  `);
  if (invalid.rowCount !== 0) {
    throw new Error(`P0.21 gate: ${invalid.rowCount} invalid MVP trial grant(s)`);
  }

  const duplicates = await db.query(`
    select "sourceId", count(*)::int as count
    from public.access_grants
    where metadata->>'kind'='MVP_TRIAL'
    group by "sourceId"
    having count(*) > 1
  `);
  if (duplicates.rowCount !== 0) {
    throw new Error(`P0.21 gate: ${duplicates.rowCount} duplicate MVP trial source(s)`);
  }

  process.stdout.write(
    "[P0.21] MVP TRIAL OK · catalogue PASSAGE A1 + ROOTS_SOLO · unique source invariant · invalid trials=0\n",
  );
} finally {
  await db.end().catch(() => {});
}
