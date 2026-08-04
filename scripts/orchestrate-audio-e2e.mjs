#!/usr/bin/env node
// P4.6-C.1 · orchestrateur audio E2E · démarre next start + bake fixtures
// + provisionne 3 users E2E + lance test-messaging-audio-p1.
//
// Sécurité · P-1 UNIQUEMENT · credentials générés en mémoire.

import { randomBytes } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const P1_REF = "kzzagbojjkivdzzcrmxn";
const BLOCKED = new Set(["sbjhvlrkbyjckdxujjsk", "mamofhrurksyuuolucea", "qggwvonfumuimjfsgpdz"]);
const PORT = process.env.YEMA_AUDIO_PORT || "3140";

function fail(step, msg, code = 1) {
  console.error(`[audio] STEP ${step} FAIL · ${msg}`);
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
    active_space: role,
    role,
  };
  const list = await fetch(`${url}/auth/v1/admin/users?filter=${encodeURIComponent(email)}`, {
    headers: { apikey: svc, Authorization: `Bearer ${svc}` },
  });
  if (list.ok) {
    const data = await list.json();
    const existing = (data.users ?? []).find((u) => u.email === email);
    if (existing) {
      const upd = await fetch(`${url}/auth/v1/admin/users/${existing.id}`, {
        method: "PUT",
        headers: { apikey: svc, Authorization: `Bearer ${svc}`, "Content-Type": "application/json" },
        body: JSON.stringify({ password, email_confirm: true, user_metadata: metadata }),
      });
      if (!upd.ok) throw new Error(`update ${email} · ${upd.status}`);
      return { existed: true };
    }
  }
  const create = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: { apikey: svc, Authorization: `Bearer ${svc}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: metadata }),
  });
  if (!create.ok) throw new Error(`create ${email} · ${create.status}`);
  return { existed: false };
}

async function main() {
  console.log(`[audio] STEP 1 · ensure bucket`);
  const bucket = spawnSync("node", ["scripts/ensure-messaging-audio-bucket.mjs"], { stdio: "inherit", env: process.env });
  if (bucket.status !== 0) fail(1, "bucket");

  console.log(`[audio] STEP 2 · provisioning 3 auth users`);
  for (const [k, c] of Object.entries(CRED)) {
    const r = await upsertAuthUser(c.email, c.password, ROLES[k]);
    console.log(`  · ${k.padEnd(9)} ${r.existed ? "(reused)" : "(created)"}`);
  }

  console.log(`[audio] STEP 3 · messaging-fixtures (Prisma linkage)`);
  const linkEnv = {
    ...process.env,
    E2E_TEACHER_EMAIL: CRED.teacher.email, E2E_TEACHER_PASSWORD: CRED.teacher.password,
    E2E_STUDENT_EMAIL: CRED.student.email, E2E_STUDENT_PASSWORD: CRED.student.password,
    E2E_OUTSIDER_EMAIL: CRED.outsider.email, E2E_OUTSIDER_PASSWORD: CRED.outsider.password,
    P1_TEST_PASSWORD: process.env.P1_TEST_PASSWORD ?? strongPassword(),
  };
  const fx = spawnSync("node", ["scripts/test-baseline/messaging-fixtures.mjs"], { stdio: "inherit", env: linkEnv });
  if (fx.status !== 0) fail(3, "messaging-fixtures");

  console.log(`[audio] STEP 4 · next start on port ${PORT} (YEMA_MESSAGE_AUDIO_ENABLED=true)`);
  const serverEnv = { ...linkEnv, YEMA_MESSAGE_AUDIO_ENABLED: "true" };
  const server = spawn("npx", ["next", "start", "-p", PORT], {
    stdio: ["ignore", "pipe", "inherit"],
    env: serverEnv,
  });
  let ready = false;
  server.stdout.on("data", (b) => {
    const s = b.toString();
    if (/Ready|Started server on|ready in/i.test(s)) ready = true;
  });
  // Attend jusqu'à 30s.
  for (let i = 0; i < 30 && !ready; i++) await sleep(1000);
  if (!ready) { server.kill("SIGTERM"); fail(4, "next start not ready"); }
  console.log("[audio] server ready");

  console.log(`[audio] STEP 5 · test:messaging-audio:p1`);
  const test = spawnSync("node", ["scripts/test-messaging-audio-p1.mjs"], {
    stdio: "inherit",
    env: { ...linkEnv, YEMA_TEST_BASE_URL: `http://127.0.0.1:${PORT}` },
  });
  const testCode = test.status ?? 1;

  server.kill("SIGTERM");
  await sleep(500);
  process.exit(testCode);
}

main().catch((e) => fail("?", e.message));
