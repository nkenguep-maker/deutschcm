#!/usr/bin/env node

import pg from "pg";

const { Pool } = pg;
const P1_REF = "kzzagbojjkivdzzcrmxn";
const FORBIDDEN_REFS = ["sbjhvlrkbyjckdxujjsk", "mamofhrurksyuuolucea", "qggwvonfumuimjfsgpdz"];

const EMAIL_ENV = {
  student_monde: "P1_PERSONA_STUDENT_MONDE_EMAIL",
  student_racines: "P1_PERSONA_STUDENT_RACINES_EMAIL",
  family: "P1_PERSONA_FAMILY_EMAIL",
  teacher: "P1_PERSONA_TEACHER_EMAIL",
  coach: "P1_PERSONA_COACH_EMAIL",
  center_admin: "P1_PERSONA_CENTER_EMAIL",
  super_admin: "P1_PERSONA_ADMIN_EMAIL",
};

function fail(message) {
  console.error(`[persona-matrix:p1] FAIL · ${message}`);
  process.exitCode = 1;
}

function assertP1Environment() {
  if (process.env.P1_BASELINE_CONFIRMED_NOT_PRODUCTION !== "true") {
    throw new Error("P1_BASELINE_CONFIRMED_NOT_PRODUCTION must be true");
  }
  if (process.env.VERCEL_ENV === "production") {
    throw new Error("refusing Vercel Production environment");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is invalid");
  }
  if (parsed.protocol !== "https:" || parsed.hostname !== `${P1_REF}.supabase.co`) {
    throw new Error(`NEXT_PUBLIC_SUPABASE_URL must target canonical P-1 ${P1_REF}`);
  }

  const db = process.env.DATABASE_URL ?? "";
  if (!db) throw new Error("DATABASE_URL is required");
  for (const forbidden of FORBIDDEN_REFS) {
    if (db.includes(forbidden) || url.includes(forbidden)) {
      throw new Error(`forbidden Supabase ref detected: ${forbidden}`);
    }
  }
}

function normalizeEmail(value, envName) {
  const email = (value ?? "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error(`${envName} is missing or invalid`);
  }
  return email;
}

async function getUser(client, email) {
  const { rows } = await client.query(
    `select id, email, "fullName", "onboardingDone", "centerId"
       from public.users
      where lower(email) = $1
      limit 2`,
    [email],
  );
  return rows;
}

async function getRole(client, userId, role) {
  const { rows } = await client.query(
    `select role, status, onboarded
       from public.user_roles
      where "userId" = $1 and role = $2
      limit 2`,
    [userId, role],
  );
  return rows;
}

async function hasAppRole(client, userId, role) {
  const { rowCount } = await client.query(
    `select 1 from public.user_app_roles where "userId" = $1 and role = $2 limit 1`,
    [userId, role],
  );
  return rowCount > 0;
}

async function hasPath(client, userId, universe) {
  const { rowCount } = await client.query(
    `select 1
       from public.learning_paths
      where "userId" = $1 and universe = $2 and status = 'ACTIVE'
      limit 1`,
    [userId, universe],
  );
  return rowCount > 0;
}

async function verifyActiveRole(client, label, userId, role) {
  const rows = await getRole(client, userId, role);
  if (rows.length !== 1) {
    fail(`${label}: expected exactly one ${role} role row, found ${rows.length}`);
    return false;
  }
  if (rows[0].status !== "ACTIVE") {
    fail(`${label}: ${role} role is ${rows[0].status}, expected ACTIVE`);
    return false;
  }
  if (rows[0].onboarded !== true) {
    fail(`${label}: ${role} onboarding is not complete`);
    return false;
  }
  return true;
}

async function main() {
  assertP1Environment();

  const emails = Object.fromEntries(
    Object.entries(EMAIL_ENV).map(([persona, envName]) => [persona, normalizeEmail(process.env[envName], envName)]),
  );
  const uniqueEmails = new Set(Object.values(emails));
  if (uniqueEmails.size !== Object.keys(emails).length) {
    throw new Error("the seven adult persona emails must be distinct");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  const client = await pool.connect();
  try {
    const users = {};
    for (const [persona, email] of Object.entries(emails)) {
      const rows = await getUser(client, email);
      if (rows.length !== 1) {
        fail(`${persona}: expected one YEMA user row, found ${rows.length}`);
        continue;
      }
      const user = rows[0];
      users[persona] = user;
      if (!user.fullName || !String(user.fullName).trim()) {
        fail(`${persona}: fullName is missing`);
      }
    }

    const monde = users.student_monde;
    if (monde) {
      await verifyActiveRole(client, "student_monde", monde.id, "STUDENT");
      if (!(await hasAppRole(client, monde.id, "LEARNER"))) fail("student_monde: LEARNER app role missing");
      if (!(await hasPath(client, monde.id, "MONDE"))) fail("student_monde: active MONDE LearningPath missing");
    }

    const racines = users.student_racines;
    if (racines) {
      await verifyActiveRole(client, "student_racines", racines.id, "STUDENT");
      if (!(await hasAppRole(client, racines.id, "LEARNER"))) fail("student_racines: LEARNER app role missing");
      if (!(await hasPath(client, racines.id, "RACINES"))) fail("student_racines: active RACINES LearningPath missing");
    }

    const family = users.family;
    if (family) {
      await verifyActiveRole(client, "family", family.id, "STUDENT");
      if (!(await hasAppRole(client, family.id, "PARENT"))) fail("family: PARENT app role missing");
      const { rows: children } = await client.query(
        `select id, universe, "pinHash"
           from public.child_profiles
          where "parentUserId" = $1 and universe in ('MONDE','RACINES')`,
        [family.id],
      );
      const mondeChild = children.find((row) => row.universe === "MONDE");
      const rootsChild = children.find((row) => row.universe === "RACINES");
      if (!mondeChild) fail("family: child_monde profile missing");
      if (!rootsChild) fail("family: child_racines profile missing");
      if (mondeChild && !mondeChild.pinHash) fail("child_monde: PIN is not configured");
      if (rootsChild && !rootsChild.pinHash) fail("child_racines: PIN is not configured");
    }

    const teacher = users.teacher;
    if (teacher) {
      await verifyActiveRole(client, "teacher", teacher.id, "TEACHER");
      const { rowCount } = await client.query(`select 1 from public.teachers where "userId" = $1 limit 1`, [teacher.id]);
      if (rowCount !== 1) fail("teacher: Teacher binding row missing");
    }

    const coach = users.coach;
    if (coach) {
      if (coach.onboardingDone !== true) fail("coach: onboardingDone is false");
      if (!(await hasAppRole(client, coach.id, "RACINES_COACH"))) fail("coach: RACINES_COACH app role missing");
    }

    const center = users.center_admin;
    if (center) {
      await verifyActiveRole(client, "center_admin", center.id, "CENTER");
      if (!center.centerId) {
        fail("center_admin: centerId missing");
      } else {
        const { rowCount } = await client.query(`select 1 from public.language_centers where id = $1 limit 1`, [center.centerId]);
        if (rowCount !== 1) fail("center_admin: LanguageCenter binding row missing");
      }
    }

    const admin = users.super_admin;
    if (admin) {
      await verifyActiveRole(client, "super_admin", admin.id, "ADMIN");
    }

    if (!process.exitCode) {
      console.log("[persona-matrix:p1] OK · 7 adult accounts + 2 child profiles satisfy the canonical persona contract");
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(`[persona-matrix:p1] REFUSED · ${error instanceof Error ? error.message : String(error)}`);
  process.exit(2);
});
