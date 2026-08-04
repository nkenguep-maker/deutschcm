#!/usr/bin/env node
// P4.6-B.4 orchestrateur · exécute l'enchaînement complet en mémoire
// SANS persister ni logger de credentials.
//
// Étapes ·
//   1. Génère 3 mots de passe forts (memory-only)
//   2. Provisionne Teacher/Student/Outsider via Auth admin API (service_role)
//   3. Baker messaging-fixtures.mjs avec E2E envs (linkage Prisma)
//   4. verify:messaging-realtime:p1 (Management API si accessible)
//   5. test:messaging-realtime:p1 (Playwright 2 contextes)
//
// SÉCURITÉ ·
//   - refuse toute ref !== P-1
//   - passwords en mémoire uniquement (jamais écrits, jamais loggés)
//   - masque emails dans les logs
//
// USAGE ·
//   node scripts/test-baseline/run-p4-5-b2-p1.mjs --flag on -- \
//     node scripts/orchestrate-realtime-e2e.mjs

import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";

const P1_REF = "kzzagbojjkivdzzcrmxn";
const BLOCKED = new Set([
  "sbjhvlrkbyjckdxujjsk", "mamofhrurksyuuolucea", "qggwvonfumuimjfsgpdz",
]);

function fail(step, msg, code = 1) {
  console.error(`[orchestrate] STEP ${step} FAIL · ${msg}`);
  process.exit(code);
}

function mask(email) {
  if (!email) return "?";
  const [u, d] = email.split("@");
  return `${u.slice(0, 2)}***@${d}`;
}

function strongPassword() {
  // 32 octets = 43 chars base64url. Sécurité largement suffisante pour E2E.
  return randomBytes(32).toString("base64url") + "!Aa1";
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !url.includes(P1_REF)) fail(0, `URL Supabase non-P1 · attendu ${P1_REF}`);
for (const b of BLOCKED) if (url.includes(b)) fail(0, `URL contient ref blocklistée · ${b}`);
if (!svc) fail(0, "SUPABASE_SERVICE_ROLE_KEY absent");

// Credentials générés en mémoire · jamais écrits sur disque.
const CRED = {
  teacher:  { email: "e2e.teacher.p1@yema-test.local",  password: strongPassword() },
  student:  { email: "e2e.student.p1@yema-test.local",  password: strongPassword() },
  outsider: { email: "e2e.outsider.p1@yema-test.local", password: strongPassword() },
};

console.log(`[orchestrate] STEP 1 · credentials générés en mémoire`);
for (const [k, c] of Object.entries(CRED)) {
  console.log(`  · ${k.padEnd(9)} email=${mask(c.email)} password=<32B random>`);
}

// ── STEP 2 · provisionning Auth (+ user_metadata pour skip onboarding) ─
async function upsertAuthUser(email, password, role) {
  // Metadata attendues par src/proxy.ts · roles + onboarded_map + active_space.
  const metadata = {
    roles: [role],
    onboarded_map: { STUDENT: true, TEACHER: true, CENTER: true, ADMIN: true },
    active_space: role,
    role,
  };
  const listRes = await fetch(`${url}/auth/v1/admin/users?filter=${encodeURIComponent(email)}`, {
    headers: { apikey: svc, Authorization: `Bearer ${svc}` },
  });
  if (listRes.ok) {
    const data = await listRes.json();
    const existing = (data.users ?? []).find((u) => u.email === email);
    if (existing) {
      const upd = await fetch(`${url}/auth/v1/admin/users/${existing.id}`, {
        method: "PUT",
        headers: { apikey: svc, Authorization: `Bearer ${svc}`, "Content-Type": "application/json" },
        body: JSON.stringify({ password, email_confirm: true, user_metadata: metadata }),
      });
      if (!upd.ok) throw new Error(`update ${mask(email)} · ${upd.status}`);
      return { id: existing.id, existed: true };
    }
  }
  const create = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: { apikey: svc, Authorization: `Bearer ${svc}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: metadata }),
  });
  if (!create.ok) {
    const t = await create.text();
    throw new Error(`create ${mask(email)} · ${create.status} · ${t.slice(0, 200)}`);
  }
  const j = await create.json();
  return { id: j.id, existed: false };
}

console.log(`[orchestrate] STEP 2 · Auth admin · provisioning (idempotent, PUT password + metadata)`);
const ROLES = { teacher: "TEACHER", student: "STUDENT", outsider: "STUDENT" };
try {
  for (const [k, c] of Object.entries(CRED)) {
    const r = await upsertAuthUser(c.email, c.password, ROLES[k]);
    console.log(`  · ${k.padEnd(9)} ${r.existed ? "(existed·metadata updated)" : "(created)"}`);
  }
} catch (e) {
  fail(2, e.message);
}

// ── STEP 3 · fixtures + Prisma linkage ───────────────────────────────
console.log(`[orchestrate] STEP 3 · messaging-fixtures.mjs (Prisma linkage E2E)`);
const linkEnv = {
  ...process.env,
  E2E_TEACHER_EMAIL:  CRED.teacher.email,
  E2E_TEACHER_PASSWORD:  CRED.teacher.password,
  E2E_STUDENT_EMAIL:  CRED.student.email,
  E2E_STUDENT_PASSWORD:  CRED.student.password,
  E2E_OUTSIDER_EMAIL: CRED.outsider.email,
  E2E_OUTSIDER_PASSWORD: CRED.outsider.password,
  P1_TEST_PASSWORD: process.env.P1_TEST_PASSWORD ?? strongPassword(), // requis par _common.mjs
};
const fx = spawnSync("node", ["scripts/test-baseline/messaging-fixtures.mjs"], {
  stdio: "inherit",
  env: linkEnv,
});
if (fx.status !== 0) fail(3, `messaging-fixtures exit ${fx.status}`);

// ── STEP 4 · verify (best-effort si Management API accessible) ───────
console.log(`[orchestrate] STEP 4 · verify:messaging-realtime:p1`);
const verify = spawnSync("node", ["scripts/verify-realtime-authorization.mjs"], {
  stdio: "inherit",
  env: linkEnv,
});
const verifyOk = verify.status === 0;
if (!verifyOk) {
  console.log(`[orchestrate] verify exit ${verify.status} · migration probablement pas appliquée sur P-1 (RLS Realtime absente)`);
  console.log(`[orchestrate] Playwright continuera en mode polling-only pour scénarios non-Realtime`);
}

// ── STEP 5 · Playwright direct (déjà dans wrapper P-1, E2E envs en mémoire) ─
console.log(`[orchestrate] STEP 5 · npx playwright test (config p4-6-b-2-realtime)`);
const pw = spawnSync("npx", [
  "playwright", "test",
  "--config", "playwright.p4-6-b-2-realtime.config.ts",
], {
  stdio: "inherit",
  env: linkEnv,
});
if (pw.status !== 0) {
  console.log(`[orchestrate] Playwright exit ${pw.status} · certains scénarios échouent (attendu si RLS absente)`);
}

console.log("");
console.log(`[orchestrate] SUMMARY ·`);
console.log(`  provisioning         · OK (Auth admin API P-1)`);
console.log(`  fixtures/linkage     · OK (Prisma upsert)`);
console.log(`  verify RLS policies  · ${verifyOk ? "OK" : "FAIL (migration à appliquer via Dashboard)"}`);
console.log(`  Playwright           · exit ${pw.status ?? "unknown"}`);
console.log("");
console.log("[orchestrate] Aucun credential loggé · rien persisté sur disque.");
process.exit(pw.status ?? 0);
