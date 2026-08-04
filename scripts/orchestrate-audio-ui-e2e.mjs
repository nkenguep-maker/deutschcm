#!/usr/bin/env node
// P4.6-C.3 · orchestrateur E2E audio UI adulte P-1.
//
// Provisionne, bake fixtures, start next server, exécute Playwright.
// NON-SKIPPABLE · exit 2 si un credential manque.

import { randomBytes } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const P1_REF = "kzzagbojjkivdzzcrmxn";
const BLOCKED = new Set(["sbjhvlrkbyjckdxujjsk", "mamofhrurksyuuolucea", "qggwvonfumuimjfsgpdz"]);
const PORT = process.env.YEMA_AUDIO_UI_PORT || "3160";

function fail(step, msg, code = 1) {
  console.error(`[audio-ui] STEP ${step} FAIL · ${msg}`);
  process.exit(code);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !url.includes(P1_REF)) fail(0, `URL non-P1 · ${url}`);
for (const b of BLOCKED) if (url.includes(b)) fail(0, `blocklisted ${b}`);
if (!svc) fail(0, "SUPABASE_SERVICE_ROLE_KEY absent");

function strongPassword() {
  return randomBytes(32).toString("base64url") + "!Aa1";
}
const CRED = {
  teacher:  { email: "e2e.teacher.p1@yema-test.local",  password: strongPassword() },
  student:  { email: "e2e.student.p1@yema-test.local",  password: strongPassword() },
  outsider: { email: "e2e.outsider.p1@yema-test.local", password: strongPassword() },
};
const ROLES = { teacher: "TEACHER", student: "STUDENT", outsider: "STUDENT" };

async function upsertAuthUser(email, password, role) {
  const metadata = {
    roles: [role],
    onboarded_map: { STUDENT: true, TEACHER: true, CENTER: true, ADMIN: true },
    active_space: role, role,
  };
  const list = await fetch(`${url}/auth/v1/admin/users?filter=${encodeURIComponent(email)}`, {
    headers: { apikey: svc, Authorization: `Bearer ${svc}` },
  });
  if (list.ok) {
    const d = await list.json();
    const existing = (d.users ?? []).find((u) => u.email === email);
    if (existing) {
      const r = await fetch(`${url}/auth/v1/admin/users/${existing.id}`, {
        method: "PUT",
        headers: { apikey: svc, Authorization: `Bearer ${svc}`, "Content-Type": "application/json" },
        body: JSON.stringify({ password, email_confirm: true, user_metadata: metadata }),
      });
      if (!r.ok) throw new Error(`update ${email} · ${r.status}`);
      return { existed: true };
    }
  }
  const c = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: { apikey: svc, Authorization: `Bearer ${svc}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: metadata }),
  });
  if (!c.ok) throw new Error(`create ${email} · ${c.status}`);
  return { existed: false };
}

async function main() {
  console.log("[audio-ui] STEP 1 · ensure bucket");
  const bucket = spawnSync("node", ["scripts/ensure-messaging-audio-bucket.mjs"], { stdio: "inherit", env: process.env });
  if (bucket.status !== 0) fail(1, "bucket");

  console.log("[audio-ui] STEP 2 · provisioning 3 users adultes");
  for (const [k, c] of Object.entries(CRED)) {
    const r = await upsertAuthUser(c.email, c.password, ROLES[k]);
    console.log(`  · ${k.padEnd(9)} ${r.existed ? "(reused)" : "(created)"}`);
  }

  console.log("[audio-ui] STEP 3 · messaging-fixtures Prisma linkage");
  const linkEnv = {
    ...process.env,
    E2E_TEACHER_EMAIL: CRED.teacher.email, E2E_TEACHER_PASSWORD: CRED.teacher.password,
    E2E_STUDENT_EMAIL: CRED.student.email, E2E_STUDENT_PASSWORD: CRED.student.password,
    E2E_OUTSIDER_EMAIL: CRED.outsider.email, E2E_OUTSIDER_PASSWORD: CRED.outsider.password,
    P1_TEST_PASSWORD: process.env.P1_TEST_PASSWORD ?? strongPassword(),
  };
  const fx = spawnSync("node", ["scripts/test-baseline/messaging-fixtures.mjs"], { stdio: "inherit", env: linkEnv });
  if (fx.status !== 0) fail(3, "messaging-fixtures");

  console.log(`[audio-ui] STEP 4 · next start port ${PORT} (YEMA_MESSAGE_AUDIO_ENABLED=true)`);
  const serverEnv = { ...linkEnv, YEMA_MESSAGE_AUDIO_ENABLED: "true" };
  const server = spawn("npx", ["next", "start", "-p", PORT], { stdio: ["ignore", "pipe", "inherit"], env: serverEnv });
  let ready = false;
  server.stdout.on("data", (b) => { if (/Ready|ready in|Started/i.test(b.toString())) ready = true; });
  for (let i = 0; i < 30 && !ready; i++) await sleep(1000);
  if (!ready) { server.kill("SIGTERM"); fail(4, "server not ready"); }

  console.log("[audio-ui] STEP 5 · Playwright audio UI (6 scenarios A-F, no skip)");
  const test = spawnSync("npx", [
    "playwright", "test",
    "--config", "playwright.p4-6-c-audio-ui.config.ts",
  ], {
    stdio: "inherit",
    env: { ...linkEnv, PLAYWRIGHT_BASE_URL: `http://127.0.0.1:${PORT}`, PLAYWRIGHT_PORT: PORT },
  });
  const code = test.status ?? 1;
  server.kill("SIGTERM");
  await sleep(500);
  process.exit(code);
}

main().catch((e) => fail("?", e.message));
