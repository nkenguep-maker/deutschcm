#!/usr/bin/env node
// German A1 adult runtime gate · canonical P-1 only.
// Read-only: the static course registry and the database runtime rows must agree.

import { readFileSync } from "node:fs";
import pg from "pg";
import { assertNonProduction } from "./_common.mjs";

const { Client } = pg;
assertNonProduction();

const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
if (!connectionString) throw new Error("A1 runtime gate: DATABASE_URL/DIRECT_URL missing");

const meta = JSON.parse(
  readFileSync("src/data/courses/monde/adulte/de-a1/meta.json", "utf8"),
);
const units = [1, 2, 3, 4, 5, 6].map((n) =>
  JSON.parse(readFileSync(`src/data/courses/monde/adulte/de-a1/u${n}.json`, "utf8")),
);
const expected = units.flatMap((unit) =>
  unit.lessons.map((lesson, index) => ({
    id: lesson.id,
    title: lesson.title,
    description: lesson.objective,
    xpReward: lesson.xp,
    unitId: unit.id,
    phase: lesson.phase,
    exerciseCount: lesson.exercises.length,
  })),
);

if (meta.course.id !== "monde-adulte-de-a1") throw new Error("A1 runtime gate: unexpected course id");
if (units.length !== 6 || expected.length !== 36) throw new Error("A1 runtime gate: source contract is not 6 units / 36 lessons");

const db = new Client({ connectionString });

try {
  await db.connect();

  const course = await db.query(`
    select id, title, description, level::text as level,
           "isPublished", "isFree", "durationHours", tags, "sortOrder"
    from public.courses
    where id = $1
  `, [meta.course.id]);

  if (course.rowCount !== 1) throw new Error("A1 runtime gate: canonical course row missing");
  const c = course.rows[0];
  if (c.level !== "A1" || c.isPublished !== true || c.isFree !== false) {
    throw new Error("A1 runtime gate: canonical course flags are invalid");
  }

  const modules = await db.query(`
    select id, "courseId", title, description, type::text as type,
           content, "sortOrder", "xpReward", "isPublished"
    from public.modules
    where "courseId" = $1
    order by "sortOrder", id
  `, [meta.course.id]);

  if (modules.rowCount !== expected.length) {
    throw new Error(`A1 runtime gate: expected ${expected.length} modules, got ${modules.rowCount}`);
  }

  for (let index = 0; index < expected.length; index += 1) {
    const want = expected[index];
    const got = modules.rows[index];
    if (
      got.id !== want.id ||
      got.title !== want.title ||
      got.description !== want.description ||
      got.type !== "LESSON" ||
      Number(got.sortOrder) !== index ||
      Number(got.xpReward) !== Number(want.xpReward) ||
      got.isPublished !== true
    ) {
      throw new Error(`A1 runtime gate: module mismatch at index ${index} (${want.id})`);
    }
    const content = got.content ?? {};
    if (
      content.source !== "yema-course-registry" ||
      content.contentVersion !== meta.contentVersion ||
      content.unitId !== want.unitId ||
      content.lessonId !== want.id ||
      content.phase !== want.phase ||
      Number(content.exerciseCount) !== Number(want.exerciseCount)
    ) {
      throw new Error(`A1 runtime gate: module metadata mismatch for ${want.id}`);
    }
  }

  process.stdout.write(
    `[A1] RUNTIME OK · ${meta.course.id} · ${units.length} units · ${expected.length} lessons · contentVersion=${meta.contentVersion}\n`,
  );
} finally {
  await db.end().catch(() => {});
}
