#!/usr/bin/env node
// Lot 7A.2 · capture:monde-ivory:p1 · captures 5 parcours + états + EN.
//
// Fixture QA temporaire · bascule `User.learningGoal` du Student Monde
// QA pour chaque scénario (STUDIES/WORK/TRAVEL/EXAM/DAILY_LIFE +
// no_pathway + incomplete_goal + completed QA). Restauration EXACTE
// dans finally · échec si restauration incorrecte.
//
// Sécurité ·
//   - P-1 UNIQUEMENT (kzzagbojjkivdzzcrmxn)
//   - refs blocklistées refusées
//   - aucune valeur originale écrite sur disque · uniquement en mémoire
//   - PNG locaux gitignorés

import { spawn, spawnSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const P1_REF = "kzzagbojjkivdzzcrmxn";
const BLOCKED = new Set(["sbjhvlrkbyjckdxujjsk", "mamofhrurksyuuolucea", "qggwvonfumuimjfsgpdz"]);
const PORT = process.env.YEMA_MONDE_CAPTURE_PORT || "3210";
const STUDENT_EMAIL = "test_yema_qa_student_monde@example.com";

function fail(step, msg, code = 1) {
  console.error(`[monde-ivory-capture] STEP ${step} FAIL · ${msg}`);
  process.exit(code);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!url || !url.includes(P1_REF)) fail(0, `URL non-P1`);
for (const b of BLOCKED) if (url.includes(b)) fail(0, `blocklisted ${b}`);
if (!process.env.P1_TEST_PASSWORD) fail(0, "P1_TEST_PASSWORD absent");

async function main() {
  console.log("[monde-ivory-capture] STEP 1 · fixtures QA");
  spawnSync("node", ["scripts/test-baseline/yema-qa-fixtures.mjs"], { stdio: "inherit", env: process.env });

  // Lire et sauvegarder EN MÉMOIRE l'état original.
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }) });
  const original = await db.user.findUnique({
    where: { email: STUDENT_EMAIL },
    select: { id: true, learningGoal: true, city: true },
  });
  if (!original) fail(1, `Student Monde QA introuvable · ${STUDENT_EMAIL}`);
  console.log(`[monde-ivory-capture] original en mémoire · learningGoal=${original.learningGoal ?? "null"} · city=${original.city ?? "null"}`);

  console.log(`[monde-ivory-capture] STEP 2 · next start port ${PORT}`);
  const server = spawn("npx", ["next", "start", "-p", PORT], { stdio: ["ignore", "pipe", "inherit"], env: process.env });
  let ready = false;
  server.stdout.on("data", (b) => { if (/Ready|ready in|Started/i.test(b.toString())) ready = true; });
  for (let i = 0; i < 30 && !ready; i++) await sleep(1000);
  if (!ready) { server.kill("SIGTERM"); fail(2, "server not ready"); }

  let captureCode = 1;
  try {
    console.log("[monde-ivory-capture] STEP 3 · Playwright captures");
    const pw = spawnSync("npx", [
      "playwright", "test",
      "--config", "playwright.monde-ivory.config.ts",
    ], {
      stdio: "inherit",
      env: {
        ...process.env,
        PLAYWRIGHT_BASE_URL: `http://127.0.0.1:${PORT}`,
        MONDE_QA_STUDENT_EMAIL: STUDENT_EMAIL,
        MONDE_QA_STUDENT_USER_ID: original.id,
        MONDE_QA_ORIGINAL_LEARNING_GOAL: original.learningGoal ?? "",
        MONDE_QA_ORIGINAL_CITY: original.city ?? "",
      },
    });
    captureCode = pw.status ?? 1;
  } finally {
    // Restauration EXACTE de la valeur originale (learningGoal + city).
    console.log(`[monde-ivory-capture] STEP 4 · restauration fixture originale`);
    try {
      await db.user.update({
        where: { id: original.id },
        data: {
          learningGoal: original.learningGoal ?? null,
          city: original.city ?? null,
        },
      });
      // Re-lire pour confirmer restauration exacte.
      const check = await db.user.findUnique({
        where: { id: original.id },
        select: { learningGoal: true, city: true },
      });
      if ((check?.learningGoal ?? null) !== (original.learningGoal ?? null)) {
        console.error(`  · WARN · learningGoal restauré ${check?.learningGoal} ≠ original ${original.learningGoal}`);
        captureCode = Math.max(captureCode, 3);
      }
      if ((check?.city ?? null) !== (original.city ?? null)) {
        console.error(`  · WARN · city restauré ${check?.city} ≠ original ${original.city}`);
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
