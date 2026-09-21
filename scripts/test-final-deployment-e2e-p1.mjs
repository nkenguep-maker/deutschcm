#!/usr/bin/env node
// Gate 8D · wrapper npm run test:final-deployment-e2e:p1.
// NON-SKIPPABLE · fail-closed si P-1 ou credentials manquants.

import { spawn } from "node:child_process";

// The strict wrapper is the sole environment loader. Validating process.env
// here would reject before it can load the ignored P-1 configuration.

const child = spawn("node", [
  "scripts/test-baseline/run-p4-5-b2-p1.mjs",
  "--flag", "on", "--",
  "npx", "tsx", "scripts/orchestrate-final-deployment-e2e-p1.ts",
], { stdio: "inherit", env: process.env });
child.on("exit", (code) => process.exit(code ?? 1));
