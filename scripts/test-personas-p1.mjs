#!/usr/bin/env node
// Lot 7C · wrapper npm run test:personas:p1.
// NON-SKIPPABLE · fail-closed si P-1 ou P1_TEST_PASSWORD manquants.

import { spawn } from "node:child_process";

// The strict wrapper is the sole environment loader. Checking process.env
// here would reject before it can load the ignored P-1 configuration.

const child = spawn("node", [
  "scripts/test-baseline/run-p4-5-b2-p1.mjs",
  "--flag", "on", "--",
  "node", "scripts/orchestrate-personas-safe-p1.mjs",
], { stdio: "inherit", env: process.env });
child.on("exit", (code) => process.exit(code ?? 1));
