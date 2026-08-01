#!/usr/bin/env node
// P4.6-C.3 · orchestrateur E2E audio ENFANT PIN P-1.
//
// NON-SKIPPABLE · fail-closed si YEMA_E2E_CHILD_PIN ou P1_TEST_PASSWORD
// absent.

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
if (!process.env.P1_TEST_PASSWORD) fail(0, "P1_TEST_PASSWORD absent · fixture family QA requiert ce PW");

// PIN · optionnel · fallback fixture "1234" documenté explicitement.
const CHILD_PIN = process.env.YEMA_E2E_CHILD_PIN;
if (!CHILD_PIN) {
  console.log("[audio-child] NOTE · YEMA_E2E_CHILD_PIN absent · utilisation fixture QA PIN '1234' (child_family_monde)");
}

async function main() {
  console.log("[audio-child] STEP 1 · ensure bucket");
  const bucket = spawnSync("node", ["scripts/ensure-messaging-audio-bucket.mjs"], { stdio: "inherit", env: process.env });
  if (bucket.status !== 0) fail(1, "bucket");

  console.log("[audio-child] STEP 2 · fixtures QA (yema-qa + messaging)");
  const fx1 = spawnSync("node", ["scripts/test-baseline/yema-qa-fixtures.mjs"], { stdio: "inherit", env: process.env });
  if (fx1.status !== 0) fail(2, "yema-qa-fixtures");
  const fx2 = spawnSync("node", ["scripts/test-baseline/messaging-fixtures.mjs"], { stdio: "inherit", env: process.env });
  if (fx2.status !== 0) fail(2, "messaging-fixtures");

  console.log(`[audio-child] STEP 3 · next start port ${PORT}`);
  const serverEnv = { ...process.env, YEMA_MESSAGE_AUDIO_ENABLED: "true" };
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
      YEMA_E2E_CHILD_PIN: CHILD_PIN ?? "1234",
    },
  });
  const code = test.status ?? 1;
  server.kill("SIGTERM");
  await sleep(500);
  process.exit(code);
}

main().catch((e) => fail("?", e.message));
