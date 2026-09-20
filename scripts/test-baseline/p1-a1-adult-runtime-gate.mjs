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

const EXPECTED_UNITS = 12;
const EXPECTED_LESSONS = 60;
const EXPECTED_EXERCISES = 300;
const EXPECTED_CARDS = 480;
const EXPECTED_GUIDED_MINUTES = 2160;

const units = Array.from({ length: EXPECTED_UNITS }, (_, index) => {
  const order = index + 1;
  return JSON.parse(
    readFileSync(`src/content/monde-a1-v2/u${order}.reference.json`, "utf8"),
  );
});

const allLessons = [];
const allExercises = [];
const allCards = [];

for (const [index, unit] of units.entries()) {
  const order = index + 1;
  const lessons = unit.lessons ?? [];
  const exercises = lessons.flatMap((lesson) => lesson.exercises ?? []);
  const cards = unit.cards ?? [];
  const guidedMinutes = lessons.reduce((sum, lesson) => sum + Number(lesson.durationMinutes ?? 0), 0);

  if (unit.id !== `de-a1-u${order}`) {
    throw new Error(`A1 refonte gate: U${order} id mismatch · ${unit.id}`);
  }
  if (unit.order !== order) {
    throw new Error(`A1 refonte gate: U${order} order mismatch · ${unit.order}`);
  }
  if (unit.schemaVersion !== "2.0") {
    throw new Error(`A1 refonte gate: U${order} schemaVersion must be 2.0`);
  }
  if (lessons.length !== 5 || exercises.length !== 25 || cards.length !== 40 || guidedMinutes !== 180) {
    throw new Error(
      `A1 refonte gate: U${order} expected 5 lessons / 25 exercises / 40 cards / 180 min, got ${lessons.length}/${exercises.length}/${cards.length}/${guidedMinutes}`,
    );
  }

  allLessons.push(...lessons);
  allExercises.push(...exercises);
  allCards.push(...cards);
}

if (allLessons.length !== EXPECTED_LESSONS) {
  throw new Error(`A1 refonte gate: expected ${EXPECTED_LESSONS} lessons, got ${allLessons.length}`);
}
if (allExercises.length !== EXPECTED_EXERCISES) {
  throw new Error(`A1 refonte gate: expected ${EXPECTED_EXERCISES} exercises, got ${allExercises.length}`);
}
if (allCards.length !== EXPECTED_CARDS) {
  throw new Error(`A1 refonte gate: expected ${EXPECTED_CARDS} cards, got ${allCards.length}`);
}
const guidedMinutes = allLessons.reduce((sum, lesson) => sum + Number(lesson.durationMinutes ?? 0), 0);
if (guidedMinutes !== EXPECTED_GUIDED_MINUTES) {
  throw new Error(`A1 refonte gate: expected ${EXPECTED_GUIDED_MINUTES} guided minutes, got ${guidedMinutes}`);
}

const manifestSource = readFileSync("src/content/monde-a1-v2/index.ts", "utf8");
const integratedMatch = manifestSource.match(/integratedUnits:\s*\[([\s\S]*?)\]/);
if (!integratedMatch) throw new Error("A1 refonte gate: integratedUnits manifest missing");
const integratedUnits = [...integratedMatch[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
const expectedIds = units.map((unit) => unit.id);
if (JSON.stringify(integratedUnits) !== JSON.stringify(expectedIds)) {
  throw new Error(
    `A1 refonte gate: integratedUnits mismatch · expected=${expectedIds.join(",")} actual=${integratedUnits.join(",")}`,
  );
}
if (!/status:\s*"REFONTE_IN_PROGRESS"/.test(manifestSource)) {
  throw new Error("A1 refonte gate: public status must remain REFONTE_IN_PROGRESS");
}
if (!/fullLevelIntegrated:\s*true/.test(manifestSource)) {
  throw new Error("A1 refonte gate: fullLevelIntegrated must be true after U12");
}
if (!/criticalNativeAudioReady:\s*false/.test(manifestSource)) {
  throw new Error("A1 refonte gate: critical native audio must remain closed until real recordings are approved");
}
if (!/mockExamsReady:\s*false/.test(manifestSource)) {
  throw new Error("A1 refonte gate: mock exams must remain closed until both detailed exams are integrated");
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
    `[A1-V2] GATE OK · legacy 6×6 archived · source ${units.length} units / ${allLessons.length} lessons / ${allExercises.length} exercises / ${allCards.length} cards · public READY closed · memory RLS closed\n`,
  );
} finally {
  await db.end().catch(() => {});
}
