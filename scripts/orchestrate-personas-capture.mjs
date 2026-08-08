#!/usr/bin/env node
// Lot 7C · orchestre npm run capture:personas:p1.
// Playwright captures pour les 9 personas × 3 viewports × 2 locales.
// Les deux enfants passent par une vraie session parent + PIN.

import { spawn, spawnSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { randomBytes } from "node:crypto";

const P1_REF = "kzzagbojjkivdzzcrmxn";
const BLOCKED = new Set([
  "sbjhvlrkbyjckdxujjsk",
  "mamofhrurksyuuolucea",
  "qggwvonfumuimjfsgpdz",
]);
const PORT = process.env.YEMA_PERSONAS_CAPTURE_PORT || "3250";

function fail(step, msg, code = 1) {
  console.error(`[personas-capture] STEP ${step} FAIL · ${msg}`);
  process.exit(code);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!url || !url.includes(P1_REF)) fail(0, "URL non-P1");
for (const b of BLOCKED) if (url.includes(b)) fail(0, `blocklisted ${b}`);
if (!process.env.P1_TEST_PASSWORD) fail(0, "P1_TEST_PASSWORD absent", 2);

async function main() {
  console.log("[personas-capture] STEP 1 · fixtures QA");
  const fixtures = spawnSync("node", ["scripts/test-baseline/yema-qa-fixtures.mjs"], {
    stdio: "inherit",
    env: process.env,
  });
  if (fixtures.error) fail(1, `fixtures impossibles à lancer · ${fixtures.error.message}`);
  if (fixtures.status !== 0) fail(1, `fixtures QA en échec · exit ${fixtures.status ?? "unknown"}`);

  console.log(`[personas-capture] STEP 2 · next start port ${PORT} (9 personas · workspaces P-1 ON)`);
  const hmacSecret = process.env.YEMA_CHILD_SESSION_SECRET
    ?? process.env.SUPABASE_JWT_SECRET
    ?? randomBytes(32).toString("base64");
  const server = spawn("npx", ["next", "start", "-p", PORT], {
    stdio: ["ignore", "pipe", "inherit"],
    env: {
      ...process.env,
      YEMA_DASHBOARD_REDESIGN_ENABLED: "true",
      YEMA_CHILD_SESSION_SECRET: hmacSecret,
      YEMA_CENTER_REAL_DATA_ENABLED: "true",
      YEMA_CENTER_RLS_CONFIRMED: "true",
      YEMA_COACH_WORKSPACE_ENABLED: "true",
      YEMA_ROOTS_COACH_RLS_CONFIRMED: "true",
      YEMA_CIRCLE_ENABLED: "true",
    },
  });
  let ready = false;
  server.stdout.on("data", (b) => { if (/Ready|ready in|Started/i.test(b.toString())) ready = true; });
  for (let i = 0; i < 30 && !ready; i++) await sleep(1000);
  if (!ready) { server.kill("SIGTERM"); fail(2, "server not ready"); }

  let captureCode = 1;
  try {
    console.log("[personas-capture] STEP 3 · Playwright captures 9 personas");
    const pw = spawnSync("npx", [
      "playwright", "test",
      "--config", "playwright.personas.config.ts",
    ], {
      stdio: "inherit",
      env: {
        ...process.env,
        PLAYWRIGHT_BASE_URL: `http://127.0.0.1:${PORT}`,
      },
    });
    if (pw.error) {
      console.error(`[personas-capture] Playwright impossible à lancer · ${pw.error.message}`);
      captureCode = 1;
    } else {
      captureCode = pw.status ?? 1;
    }
  } finally {
    server.kill("SIGTERM");
  }
  await sleep(500);
  process.exit(captureCode);
}

main().catch((e) => fail("?", e.message));
