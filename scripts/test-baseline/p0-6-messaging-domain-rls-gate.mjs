#!/usr/bin/env node
// P0.6 · Runtime gate for the public messaging relational domain.
//
// Read-only verification. Run only through the strict P-1 wrapper.
// Realtime authorization lives separately on realtime.messages and is not
// modified by this gate.

import pg from "pg";
import { assertNonProduction } from "./_common.mjs";

const { Client } = pg;
const TABLES = [
  "messaging_conversations",
  "messaging_conversation_participants",
  "messaging_conversation_read_states",
  "messaging_messages",
  "messaging_message_attachments",
  "messaging_message_receipts",
  "messaging_guided_phrases",
  "messaging_moderation_actions",
  "messaging_audio_assets",
];

function fail(message) {
  throw new Error(`P0.6 RLS gate failed: ${message}`);
}

assertNonProduction();

const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
if (!connectionString) fail("DATABASE_URL/DIRECT_URL missing");

const db = new Client({ connectionString });

try {
  await db.connect();

  const posture = await db.query(
    `
      select c.relname as table_name,
             c.relrowsecurity as rls_enabled,
             c.relforcerowsecurity as rls_forced
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relkind = 'r'
        and c.relname = any($1::text[])
      order by c.relname
    `,
    [TABLES],
  );

  if (posture.rows.length !== TABLES.length) {
    fail(`expected ${TABLES.length} tables, found ${posture.rows.length}`);
  }

  for (const table of TABLES) {
    const row = posture.rows.find((candidate) => candidate.table_name === table);
    if (!row) fail(`missing public.${table}`);
    if (row.rls_enabled !== true) fail(`RLS disabled on public.${table}`);
    if (row.rls_forced !== false) fail(`RLS unexpectedly forced on public.${table}`);
  }

  const policies = await db.query(
    `
      select tablename, policyname
      from pg_policies
      where schemaname = 'public'
        and tablename = any($1::text[])
    `,
    [TABLES],
  );
  if (policies.rows.length !== 0) {
    fail(
      `public messaging tables must remain deny-by-default; policies found on: ${[
        ...new Set(policies.rows.map((row) => row.tablename)),
      ].join(", ")}`,
    );
  }

  const grants = await db.query(
    `
      select table_name, grantee, privilege_type
      from information_schema.role_table_grants
      where table_schema = 'public'
        and table_name = any($1::text[])
        and grantee in ('anon', 'authenticated')
    `,
    [TABLES],
  );
  if (grants.rows.length !== 0) {
    fail(
      `client table privileges found on: ${[
        ...new Set(grants.rows.map((row) => `${row.table_name}:${row.grantee}`)),
      ].join(", ")}`,
    );
  }

  const role = await db.query(
    `
      select current_user as role_name, rolbypassrls
      from pg_roles
      where rolname = current_user
    `,
  );
  if (role.rows.length !== 1 || role.rows[0].rolbypassrls !== true) {
    fail("trusted Prisma database role no longer bypasses RLS");
  }

  for (const table of TABLES) {
    await db.query(`select 1 from public.${table} limit 1`);
  }

  process.stdout.write(
    `P0.6 RLS GATE OK · ${TABLES.length}/${TABLES.length} messaging tables RLS-enabled · client grants=0 · policies=0 · trusted server read=OK\n`,
  );
} finally {
  await db.end().catch(() => {});
}
