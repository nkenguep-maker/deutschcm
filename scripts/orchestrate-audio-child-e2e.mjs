#!/usr/bin/env node
// P4.6-C.3 · orchestrateur E2E audio ENFANT PIN P-1.
//
// NON-SKIPPABLE · fail-closed si YEMA_E2E_CHILD_PIN ou P1_TEST_PASSWORD
// absent.

import { randomBytes } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const P1_REF = "kzzagbojjkivdzzcrmxn";
const BLOCKED = new Set(["sbjhvlrkbyjckdxujjsk", "mamofhrurksyuuolucea", "qggwvonfumuimjfsgpdz"]);
const PORT = process.env.YEMA_AUDIO_CHILD_PORT || "3170";

function fail(step, msg, code = 1) {
  console.error(`[audio-child] STEP ${step} FAIL · ${msg}`);
  process.exit(code);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!url || !url.includes(P1_REF)) fail(0, `URL non-P1 · ${url}`);
for (const b of BLOCKED) if (url.includes(b)) fail(0, `blocklisted ${b}`);
if (!process.env.P1_TEST_PASSWORD) fail(0, "P1_TEST_PASSWORD absent · NON-SKIPPABLE");
if (!process.env.YEMA_E2E_CHILD_PIN) fail(0, "YEMA_E2E_CHILD_PIN absent · NON-SKIPPABLE (aucun fallback autorisé)");
if (process.env.YEMA_E2E_CHILD_PIN.length < 4) fail(0, "YEMA_E2E_CHILD_PIN trop court (min 4)");
const CHILD_PIN = process.env.YEMA_E2E_CHILD_PIN;

function strongPassword() {
  return randomBytes(32).toString("base64url") + "!Aa1";
}

async function upsertAuthUser(email, password, role) {
  const svcUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const metadata = {
    roles: [role],
    onboarded_map: { STUDENT: true, TEACHER: true, CENTER: true, ADMIN: true },
    active_space: role, role,
  };
  const list = await fetch(`${svcUrl}/auth/v1/admin/users?filter=${encodeURIComponent(email)}`, {
    headers: { apikey: svcKey, Authorization: `Bearer ${svcKey}` },
  });
  if (list.ok) {
    const d = await list.json();
    const existing = (d.users ?? []).find((u) => u.email === email);
    if (existing) {
      await fetch(`${svcUrl}/auth/v1/admin/users/${existing.id}`, {
        method: "PUT",
        headers: { apikey: svcKey, Authorization: `Bearer ${svcKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ password, email_confirm: true, user_metadata: metadata }),
      });
      return { existed: true };
    }
  }
  await fetch(`${svcUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: { apikey: svcKey, Authorization: `Bearer ${svcKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: metadata }),
  });
  return { existed: false };
}

async function main() {
  console.log("[audio-child] STEP 1 · ensure bucket");
  const bucket = spawnSync("node", ["scripts/ensure-messaging-audio-bucket.mjs"], { stdio: "inherit", env: process.env });
  if (bucket.status !== 0) fail(1, "bucket");

  // P4.6-C.3.1 · Family2 · parent non lié · credentials en mémoire.
  const FAMILY2_EMAIL = "e2e.family2.p1@yema-test.local";
  const FAMILY2_PASSWORD = strongPassword();
  console.log("[audio-child] STEP 2a · Auth admin · family2 parent non lié");
  await upsertAuthUser(FAMILY2_EMAIL, FAMILY2_PASSWORD, "STUDENT");

  console.log("[audio-child] STEP 2b · fixtures QA (yema-qa + messaging avec E2E_FAMILY2)");
  const fxEnv = { ...process.env, E2E_FAMILY2_EMAIL: FAMILY2_EMAIL, E2E_FAMILY2_PASSWORD: FAMILY2_PASSWORD };
  const fx1 = spawnSync("node", ["scripts/test-baseline/yema-qa-fixtures.mjs"], { stdio: "inherit", env: fxEnv });
  if (fx1.status !== 0) fail(2, "yema-qa-fixtures");
  // Pour que messaging-fixtures fasse le linkage family2 (opt-in via E2E envs),
  // il faut aussi passer les E2E adultes · s'ils manquent, il skip mais family2 aussi.
  // Pour ce lot, on passe seulement family2 si les autres ne sont pas fournis (limité).
  const fixtEnv = {
    ...fxEnv,
    E2E_TEACHER_EMAIL: process.env.E2E_TEACHER_EMAIL ?? "e2e.teacher.p1@yema-test.local",
    E2E_TEACHER_PASSWORD: process.env.E2E_TEACHER_PASSWORD ?? strongPassword(),
    E2E_STUDENT_EMAIL: process.env.E2E_STUDENT_EMAIL ?? "e2e.student.p1@yema-test.local",
    E2E_STUDENT_PASSWORD: process.env.E2E_STUDENT_PASSWORD ?? strongPassword(),
    E2E_OUTSIDER_EMAIL: process.env.E2E_OUTSIDER_EMAIL ?? "e2e.outsider.p1@yema-test.local",
    E2E_OUTSIDER_PASSWORD: process.env.E2E_OUTSIDER_PASSWORD ?? strongPassword(),
  };
  const fx2 = spawnSync("node", ["scripts/test-baseline/messaging-fixtures.mjs"], { stdio: "inherit", env: fixtEnv });
  if (fx2.status !== 0) fail(2, "messaging-fixtures");

  console.log(`[audio-child] STEP 3 · next start port ${PORT}`);
  // P4.6-C.3.1 · CHILD session secret · injecté au serveur uniquement.
  // Généré aléatoirement pour cette exécution E2E si absent · aucun log.
  const CHILD_SECRET = process.env.YEMA_CHILD_SESSION_SECRET
    ?? randomBytes(48).toString("base64url");
  const serverEnv = {
    ...process.env,
    YEMA_MESSAGE_AUDIO_ENABLED: "true",
    YEMA_CHILD_SESSION_SECRET: CHILD_SECRET,
  };
  const server = spawn("npx", ["next", "start", "-p", PORT], { stdio: ["ignore", "pipe", "inherit"], env: serverEnv });
  let ready = false;
  server.stdout.on("data", (b) => { if (/Ready|ready in|Started/i.test(b.toString())) ready = true; });
  for (let i = 0; i < 30 && !ready; i++) await sleep(1000);
  if (!ready) { server.kill("SIGTERM"); fail(3, "server not ready"); }

  console.log("[audio-child] STEP 4 · Playwright audio enfant PIN");
  const test = spawnSync("npx", [
    "playwright", "test",
    "--config", "playwright.p4-6-c-audio-child.config.ts",
  ], {
    stdio: "inherit",
    env: {
      ...serverEnv,
      PLAYWRIGHT_BASE_URL: `http://127.0.0.1:${PORT}`,
      PLAYWRIGHT_PORT: PORT,
      YEMA_E2E_CHILD_PIN: CHILD_PIN,
      E2E_FAMILY2_EMAIL: FAMILY2_EMAIL,
      E2E_FAMILY2_PASSWORD: FAMILY2_PASSWORD,
    },
  });
  const code = test.status ?? 1;
  server.kill("SIGTERM");
  await sleep(500);
  process.exit(code);
}

main().catch((e) => fail("?", e.message));
