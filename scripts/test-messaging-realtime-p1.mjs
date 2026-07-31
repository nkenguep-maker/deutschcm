#!/usr/bin/env node
// P4.6-B.3 · commande obligatoire pour la validation E2E Realtime P-1.
//
// Cette commande N'EST PAS SKIPPABLE ·
//   - échoue immédiatement si les credentials E2E sont absents (exit 2)
//   - échoue si le project ref n'est pas P-1
//   - échoue si Playwright retourne un code != 0
//   - le rapport final doit citer cette commande, pas juste vitest ou tsc
//
// USAGE ·
//   E2E_TEACHER_EMAIL=... E2E_TEACHER_PASSWORD=... \
//   E2E_STUDENT_EMAIL=... E2E_STUDENT_PASSWORD=... \
//   E2E_OUTSIDER_EMAIL=... E2E_OUTSIDER_PASSWORD=... \
//     npm run test:messaging-realtime:p1

import { spawn } from "node:child_process";

const P1_REF = "kzzagbojjkivdzzcrmxn";

const REQUIRED = [
  "E2E_TEACHER_EMAIL", "E2E_TEACHER_PASSWORD",
  "E2E_STUDENT_EMAIL", "E2E_STUDENT_PASSWORD",
  "E2E_OUTSIDER_EMAIL", "E2E_OUTSIDER_PASSWORD",
];

function fail(msg, code = 2) {
  console.error(`[test:messaging-realtime:p1] ${msg}`);
  process.exit(code);
}

const missing = REQUIRED.filter((k) => !process.env[k]);
if (missing.length > 0) {
  fail(`MISSING credentials · ${missing.join(", ")}. NON-SKIPPABLE.`);
}

// Le wrapper P-1 pose NEXT_PUBLIC_SUPABASE_URL depuis .env.p1-baseline ·
// on vérifie ici le ref au cas où l'invocation vient sans wrapper.
if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes(P1_REF)) {
  fail(`URL Supabase n'est pas P-1 · ${process.env.NEXT_PUBLIC_SUPABASE_URL}. Refusé.`);
}

const args = [
  "scripts/test-baseline/run-p4-5-b2-p1.mjs",
  "--flag", "on", "--",
  "npx", "playwright", "test",
  "--config", "playwright.p4-6-b-2-realtime.config.ts",
];

const child = spawn("node", args, {
  stdio: "inherit",
  env: process.env,
});
child.on("exit", (code) => {
  if (code !== 0) {
    console.error(`[test:messaging-realtime:p1] Playwright exit ${code}`);
    process.exit(code ?? 1);
  }
});
