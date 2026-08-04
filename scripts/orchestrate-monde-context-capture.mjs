#!/usr/bin/env node
// Lot 7B.1 · capture:monde-context:p1 · Teacher + Family + Racines toggle.
//
// Fixture QA temporaire · swap ChildProfile.learningGoal pour un enfant
// Monde du Family QA à chaque scénario (STUDIES / EXAM / null / RACINES).
// Restauration EXACTE dans finally · exit ≥3 si restauration incorrecte.
//
// Sécurité ·
//   - P-1 UNIQUEMENT (kzzagbojjkivdzzcrmxn)
//   - refs blocklistées refusées
//   - originaux en mémoire uniquement (jamais disque)
//   - PNG locaux gitignorés (voir .gitignore playwright-report)

import { spawn, spawnSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const P1_REF = "kzzagbojjkivdzzcrmxn";
const BLOCKED = new Set([
  "sbjhvlrkbyjckdxujjsk",
  "mamofhrurksyuuolucea",
  "qggwvonfumuimjfsgpdz",
]);
const PORT = process.env.YEMA_MONDE_CONTEXT_CAPTURE_PORT || "3230";

function fail(step, msg, code = 1) {
  console.error(`[monde-context-capture] STEP ${step} FAIL · ${msg}`);
  process.exit(code);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!url || !url.includes(P1_REF)) fail(0, `URL non-P1`);
for (const b of BLOCKED) if (url.includes(b)) fail(0, `blocklisted ${b}`);

// Lot 7B.2 · defaults canoniques (voir orchestrate-monde-context-p1.mjs).
process.env.MONDE_CONTEXT_TEACHER_EMAIL ||= "test_yema_qa_teacher@example.com";
process.env.MONDE_CONTEXT_FAMILY_EMAIL  ||= "test_yema_qa_family@example.com";
process.env.MONDE_CONTEXT_TEACHER_PASSWORD ||= process.env.P1_TEST_PASSWORD || "";
process.env.MONDE_CONTEXT_FAMILY_PASSWORD  ||= process.env.P1_TEST_PASSWORD || "";

const required = [
  "MONDE_CONTEXT_TEACHER_EMAIL",
  "MONDE_CONTEXT_TEACHER_PASSWORD",
  "MONDE_CONTEXT_FAMILY_EMAIL",
  "MONDE_CONTEXT_FAMILY_PASSWORD",
];
for (const k of required) {
  if (!process.env[k]) fail(0, `MISSING ${k} · NON-SKIPPABLE`, 2);
}

async function main() {
  console.log("[monde-context-capture] STEP 1 · fixtures QA (héritage)");
  spawnSync("node", ["scripts/test-baseline/yema-qa-fixtures.mjs"], { stdio: "inherit", env: process.env });

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }) });

  // Résoudre parent Family QA + ses ChildProfile Monde.
  const familyParent = await db.user.findUnique({
    where: { email: process.env.MONDE_CONTEXT_FAMILY_EMAIL },
    select: { id: true },
  });
  if (!familyParent) fail(1, `Family QA introuvable · ${process.env.MONDE_CONTEXT_FAMILY_EMAIL}`);
  const mondeChild = await db.childProfile.findFirst({
    where: { parentUserId: familyParent.id, universe: "MONDE" },
    select: { id: true, learningGoal: true, universe: true },
  });
  if (!mondeChild) fail(1, `ChildProfile Monde introuvable pour Family QA`);

  const original = { id: mondeChild.id, learningGoal: mondeChild.learningGoal ?? null };
  console.log(`[monde-context-capture] original en mémoire · child=${original.id} · learningGoal=${original.learningGoal ?? "null"}`);

  console.log(`[monde-context-capture] STEP 2 · next start port ${PORT}`);
  const server = spawn("npx", ["next", "start", "-p", PORT], { stdio: ["ignore", "pipe", "inherit"], env: process.env });
  let ready = false;
  server.stdout.on("data", (b) => { if (/Ready|ready in|Started/i.test(b.toString())) ready = true; });
  for (let i = 0; i < 30 && !ready; i++) await sleep(1000);
  if (!ready) { server.kill("SIGTERM"); fail(2, "server not ready"); }

  let captureCode = 1;
  try {
    console.log("[monde-context-capture] STEP 3 · Playwright captures Teacher + Family");
    const pw = spawnSync("npx", [
      "playwright", "test",
      "--config", "playwright.monde-context.config.ts",
    ], {
      stdio: "inherit",
      env: {
        ...process.env,
        PLAYWRIGHT_BASE_URL: `http://127.0.0.1:${PORT}`,
        MONDE_CONTEXT_CHILD_ID: original.id,
        MONDE_CONTEXT_ORIGINAL_LEARNING_GOAL: original.learningGoal ?? "",
      },
    });
    captureCode = pw.status ?? 1;
  } finally {
    console.log(`[monde-context-capture] STEP 4 · restauration fixture originale`);
    try {
      await db.childProfile.update({
        where: { id: original.id },
        data: { learningGoal: original.learningGoal },
      });
      const check = await db.childProfile.findUnique({
        where: { id: original.id },
        select: { learningGoal: true },
      });
      if ((check?.learningGoal ?? null) !== (original.learningGoal ?? null)) {
        console.error(`  · WARN · learningGoal restauré ${check?.learningGoal} ≠ original ${original.learningGoal}`);
        captureCode = Math.max(captureCode, 3);
      }
      console.log("  · restauration confirmée par relecture DB");
    } catch (e) {
      console.error(`  · restauration ÉCHOUÉE · ${e.message}`);
      captureCode = 4;
    }
    server.kill("SIGTERM");
    await db.$disconnect();
  }
  await sleep(500);
  process.exit(captureCode);
}

main().catch((e) => fail("?", e.message));
