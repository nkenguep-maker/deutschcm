#!/usr/bin/env node
// German A1 refonte v2 gate · canonical P-1 only.
// Read-only. Proves the superseded 6-unit runtime is archived and the new
// server-side memory substrate exists while the 12-unit level remains closed.

import { readFileSync } from "node:fs";
import pg from "pg";
import { assertNonProduction } from "./_common.mjs";

const { Client } = pg;
assertNonProduction();

const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
if (!connectionString) throw new Error("A1 refonte gate: DATABASE_URL/DIRECT_URL missing");

const unit = JSON.parse(
  readFileSync("src/content/monde-a1-v2/u1.reference.json", "utf8"),
);
const lessons = unit.lessons ?? [];
const exercises = lessons.flatMap((lesson) => lesson.exercises ?? []);

if (unit.schemaVersion !== "2.0") throw new Error("A1 refonte gate: schemaVersion must be 2.0");
if (unit.contentVersion !== "2026.09.20-u1-refonte-reference") {
  throw new Error("A1 refonte gate: unexpected U1 contentVersion");
}
if (unit.status !== "gabarit-a-valider") {
  throw new Error("A1 refonte gate: U1 must remain gabarit-a-valider until editorial signoff");
}
if (lessons.length !== 2 || exercises.length !== 10) {
  throw new Error(`A1 refonte gate: expected received U1 = 2 lessons / 10 exercises, got ${lessons.length}/${exercises.length}`);
}

const db = new Client({ connectionString });

try {
  await db.connect();

  const legacy = await db.query(`
    select id, "isPublished", tags
    from public.courses
    where id='monde-adulte-de-a1'
  `);
  if (legacy.rowCount !== 1) throw new Error("A1 refonte gate: archived legacy course row missing");
  if (legacy.rows[0].isPublished !== false) {
    throw new Error("A1 refonte gate: superseded 6-unit A1 course is still published");
  }
  if (!Array.isArray(legacy.rows[0].tags) || !legacy.rows[0].tags.includes("LEGACY_A1_2026_08_04")) {
    throw new Error("A1 refonte gate: legacy A1 archive marker missing");
  }

  const legacyModules = await db.query(`
    select count(*)::int as total,
           count(*) filter (where "isPublished"=true)::int as published
    from public.modules
    where "courseId"='monde-adulte-de-a1'
  `);
  if (Number(legacyModules.rows[0].total) !== 36 || Number(legacyModules.rows[0].published) !== 0) {
    throw new Error("A1 refonte gate: legacy module archive invariant failed");
  }

  const memory = await db.query(`
    select c.relrowsecurity as rls_enabled,
           has_table_privilege('anon', 'public.learning_memory_states', 'SELECT') as anon_select,
           has_table_privilege('authenticated', 'public.learning_memory_states', 'SELECT') as authenticated_select
    from pg_class c
    join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname='learning_memory_states'
  `);
  if (memory.rowCount !== 1) throw new Error("A1 refonte gate: learning_memory_states missing");
  if (memory.rows[0].rls_enabled !== true) throw new Error("A1 refonte gate: learning_memory_states RLS disabled");
  if (memory.rows[0].anon_select === true || memory.rows[0].authenticated_select === true) {
    throw new Error("A1 refonte gate: learning_memory_states exposed to client roles");
  }

  const uniqueIndex = await db.query(`
    select indexdef
    from pg_indexes
    where schemaname='public'
      and tablename='learning_memory_states'
      and indexname='learning_memory_states_user_course_kind_item_key'
  `);
  if (uniqueIndex.rowCount !== 1 || !/CREATE UNIQUE INDEX/i.test(uniqueIndex.rows[0].indexdef)) {
    throw new Error("A1 refonte gate: memory uniqueness invariant missing");
  }

  process.stdout.write(
    `[A1-V2] GATE OK · legacy 6×6 archived · U1 reference ${lessons.length} lessons / ${exercises.length} exercises · memory RLS closed\n`,
  );
} finally {
  await db.end().catch(() => {});
}
