#!/usr/bin/env node
// P4.6-C.3 · orchestre l'E2E audio UI adulte via wrapper P-1.
// NON-SKIPPABLE · exit 2 si un credential manque.

import { spawn } from "node:child_process";

const P1_REF = "kzzagbojjkivdzzcrmxn";

if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes(P1_REF)) {
  console.error(`[test:messaging-audio-ui:p1] URL non-P1 · refusé`);
  process.exit(2);
}

const child = spawn("node", [
  "scripts/test-baseline/run-p4-5-b2-p1.mjs",
  "--flag", "on", "--",
  "node", "scripts/orchestrate-audio-ui-e2e.mjs",
], { stdio: "inherit", env: process.env });
child.on("exit", (code) => process.exit(code ?? 1));
