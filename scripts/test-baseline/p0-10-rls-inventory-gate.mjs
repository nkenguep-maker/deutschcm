#!/usr/bin/env node
// P0.10 · Public RLS inventory closure gate.
//
// Read-only verification. Run only through the strict P-1 wrapper.
//
// Contract:
//   - every ordinary public application table has RLS enabled;
//   - the sole exception is Prisma's internal migration ledger;
//   - that internal ledger has no anon/authenticated table grants.

import pg from "pg";
import { assertNonProduction } from "./_common.mjs";

const { Client } = pg;
const INTERNAL_EXCEPTIONS = new Set(["_prisma_migrations"]);

function fail(message) {
  throw new Error(`P0.10 RLS inventory gate failed: ${message}`);
}

assertNonProduction();

const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
if (!connectionString) fail("DATABASE_URL/DIRECT_URL missing");

const db = new Client({ connectionString });

try {
  await db.connect();

  const tables = await db.query(
    `
      select c.relname as table_name,
             c.relrowsecurity as rls_enabled
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relkind = 'r'
      order by c.relname
    `,
  );

  const unprotectedApplicationTables = tables.rows
    .filter((row) => row.rls_enabled !== true && !INTERNAL_EXCEPTIONS.has(row.table_name))
    .map((row) => row.table_name);

  if (unprotectedApplicationTables.length > 0) {
    fail(
      `application tables without RLS: ${unprotectedApplicationTables.join(", ")}`,
    );
  }

  const remainingWithoutRls = tables.rows
    .filter((row) => row.rls_enabled !== true)
    .map((row) => row.table_name);

  if (
    remainingWithoutRls.length !== 1 ||
    remainingWithoutRls[0] !== "_prisma_migrations"
  ) {
    fail(
      `expected only _prisma_migrations without RLS; found: ${remainingWithoutRls.join(", ") || "none"}`,
    );
  }

  const internalClientGrants = await db.query(
    `
      select grantee, privilege_type
      from information_schema.role_table_grants
      where table_schema = 'public'
        and table_name = '_prisma_migrations'
        and grantee in ('anon', 'authenticated')
    `,
  );
  if (internalClientGrants.rows.length !== 0) {
    fail("_prisma_migrations unexpectedly has anon/authenticated table grants");
  }

  process.stdout.write(
    `P0.10 RLS INVENTORY OK · application tables without RLS=0 · only _prisma_migrations exempt · internal client grants=0\n`,
  );
} finally {
  await db.end().catch(() => {});
}
