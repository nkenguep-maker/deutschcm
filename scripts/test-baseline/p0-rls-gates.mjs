#!/usr/bin/env node
// P0 · Aggregate P-1 RLS gates.

import { spawnSync } from "node:child_process";

const gates = [
  "scripts/test-baseline/p0-1-identity-rls-gate.mjs",
  "scripts/test-baseline/p0-2-commerce-rls-gate.mjs",
  "scripts/test-baseline/p0-3-family-ownership-rls-gate.mjs",
  "scripts/test-baseline/p0-4-learning-runtime-rls-gate.mjs",
  "scripts/test-baseline/p0-5-pedagogical-catalogue-rls-gate.mjs",
  "scripts/test-baseline/p0-6-messaging-domain-rls-gate.mjs",
  "scripts/test-baseline/p0-7-social-legacy-rls-gate.mjs",
  "scripts/test-baseline/p0-8-classes-centres-rls-gate.mjs",
  "scripts/test-baseline/p0-9-study-groups-rls-gate.mjs",
  "scripts/test-baseline/p0-10-rls-inventory-gate.mjs",
];

for (const gate of gates) {
  const result = spawnSync(process.execPath, [gate], {
    stdio: "inherit",
    env: process.env,
  });
  if (result.error) {
    console.error(`[p0-rls-gates] failed to start ${gate}: ${result.error.message}`);
    process.exit(2);
  }
  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log(`P0 RLS GATES OK · ${gates.length}/${gates.length} slices green`);
