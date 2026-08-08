#!/usr/bin/env node
// Safe entrypoint for the consolidated P-1 release gate.
// The strict wrapper loads .env.p1-baseline itself and rejects Production refs.

import { spawn } from "node:child_process";

const child = spawn("node", [
  "scripts/test-baseline/run-p4-5-b2-p1.mjs",
  "--flag", "on",
  "--",
  "node", "scripts/orchestrate-release-gate-p1.mjs",
], {
  stdio: "inherit",
  env: process.env,
});

child.on("error", (error) => {
  console.error(`[release-gate:p1] spawn failed · ${error.message}`);
  process.exit(1);
});
child.on("exit", (code) => process.exit(code ?? 1));
