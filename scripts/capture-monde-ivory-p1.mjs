#!/usr/bin/env node
// Lot 7A.2 · orchestre les captures Monde Ivory sur P-1.
// NON-SKIPPABLE · exit 2 si P1_TEST_PASSWORD manquant.

import { spawn } from "node:child_process";

const P1_REF = "kzzagbojjkivdzzcrmxn";

if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes(P1_REF)) {
  console.error(`[capture:monde-ivory:p1] URL non-P1 · refusé`);
  process.exit(2);
}
if (!process.env.P1_TEST_PASSWORD) {
  console.error("[capture:monde-ivory:p1] MISSING P1_TEST_PASSWORD · NON-SKIPPABLE");
  process.exit(2);
}

const child = spawn("node", [
  "scripts/test-baseline/run-p4-5-b2-p1.mjs",
  "--flag", "on", "--",
  "node", "scripts/orchestrate-monde-ivory-capture.mjs",
], { stdio: "inherit", env: process.env });
child.on("exit", (code) => process.exit(code ?? 1));
