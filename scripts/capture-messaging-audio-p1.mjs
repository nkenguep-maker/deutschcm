#!/usr/bin/env node
// P4.6-C.3 · capture Preview messagerie audio · P-1 uniquement.
//
// Utilise Playwright pour prendre les captures desktop/tablette/mobile
// des états principaux (IDLE / RECORDING / RECORDED / bulle AUDIO /
// PARENT_COPY). Génère un manifeste textuel sans données personnelles.
//
// Les captures binaires restent locales sous playwright-report/captures/
// et sont IGNORÉES par git.

import { spawn, spawnSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const P1_REF = "kzzagbojjkivdzzcrmxn";
const BLOCKED = new Set(["sbjhvlrkbyjckdxujjsk", "mamofhrurksyuuolucea", "qggwvonfumuimjfsgpdz"]);
const PORT = process.env.YEMA_CAPTURE_PORT || "3180";
const OUT_DIR = resolve(process.cwd(), "playwright-report/captures/p4-6-c-audio");

function fail(step, msg, code = 1) {
  console.error(`[capture] STEP ${step} FAIL · ${msg}`);
  process.exit(code);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!url || !url.includes(P1_REF)) fail(0, `URL non-P1 · ${url}`);
for (const b of BLOCKED) if (url.includes(b)) fail(0, `blocklisted ${b}`);

mkdirSync(OUT_DIR, { recursive: true });

async function main() {
  console.log("[capture] STEP 1 · ensure bucket + fixtures");
  spawnSync("node", ["scripts/ensure-messaging-audio-bucket.mjs"], { stdio: "inherit", env: process.env });
  spawnSync("node", ["scripts/test-baseline/messaging-fixtures.mjs"], { stdio: "inherit", env: process.env });

  console.log(`[capture] STEP 2 · next start port ${PORT}`);
  const serverEnv = { ...process.env, YEMA_MESSAGE_AUDIO_ENABLED: "true" };
  const server = spawn("npx", ["next", "start", "-p", PORT], { stdio: ["ignore", "pipe", "inherit"], env: serverEnv });
  let ready = false;
  server.stdout.on("data", (b) => { if (/Ready|ready in|Started/i.test(b.toString())) ready = true; });
  for (let i = 0; i < 30 && !ready; i++) await sleep(1000);
  if (!ready) { server.kill("SIGTERM"); fail(2, "server not ready"); }

  console.log(`[capture] STEP 3 · Playwright screenshots · output=${OUT_DIR}`);
  const test = spawnSync("npx", [
    "playwright", "test",
    "--config", "playwright.p4-6-c-audio-ui.config.ts",
    "tests/e2e/p4-6-c-audio/captures.spec.ts",
  ], {
    stdio: "inherit",
    env: {
      ...serverEnv,
      PLAYWRIGHT_BASE_URL: `http://127.0.0.1:${PORT}`,
      PLAYWRIGHT_PORT: PORT,
      YEMA_CAPTURE_OUT: OUT_DIR,
    },
  });
  const code = test.status ?? 1;
  server.kill("SIGTERM");
  await sleep(500);
  console.log(`[capture] captures écrites dans ${OUT_DIR}`);
  console.log(`[capture] MANIFEST · voir ${OUT_DIR}/MANIFEST.txt`);
  process.exit(code);
}

main().catch((e) => fail("?", e.message));
