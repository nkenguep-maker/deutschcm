#!/usr/bin/env node
// P4.6-C.3 · orchestre l'E2E audio ENFANT PIN via wrapper P-1.
// NON-SKIPPABLE.

import { spawn } from "node:child_process";

const P1_REF = "kzzagbojjkivdzzcrmxn";

if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes(P1_REF)) {
  console.error(`[test:messaging-audio-child:p1] URL non-P1 · refusé`);
  process.exit(2);
}
const MISSING = ["P1_TEST_PASSWORD", "YEMA_E2E_CHILD_PIN"].filter((k) => !process.env[k]);
if (MISSING.length > 0) {
  console.error(`[test:messaging-audio-child:p1] MISSING ${MISSING.join(", ")} · NON-SKIPPABLE`);
  process.exit(2);
}

const child = spawn("node", [
  "scripts/test-baseline/run-p4-5-b2-p1.mjs",
  "--flag", "on", "--",
  "node", "scripts/orchestrate-audio-child-e2e.mjs",
], { stdio: "inherit", env: process.env });
child.on("exit", (code) => process.exit(code ?? 1));
