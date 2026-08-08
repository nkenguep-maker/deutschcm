#!/usr/bin/env node
// Consolidated P-1 release gate · never targets Production.
//
// Expected invocation:
//   node scripts/test-baseline/run-p4-5-b2-p1.mjs --flag on -- \
//     node scripts/orchestrate-release-gate-p1.mjs
//
// Order is intentional: cheapest/static checks first, then build, then
// authenticated runtime/persona/E2E checks. Any failure stops the gate.

import { spawnSync } from "node:child_process";

const P1_REF = "kzzagbojjkivdzzcrmxn";
const BLOCKED = [
  "sbjhvlrkbyjckdxujjsk",
  "mamofhrurksyuuolucea",
  "qggwvonfumuimjfsgpdz",
];

function die(message) {
  console.error(`[release-gate:p1] ${message}`);
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
if (!supabaseUrl.includes(P1_REF)) die("REFUSED · NEXT_PUBLIC_SUPABASE_URL is not P-1");
for (const ref of BLOCKED) {
  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === "string" && value.includes(ref)) {
      die(`REFUSED · ${key} contains blocked Supabase ref ${ref}`);
    }
  }
}
if (process.env.P1_BASELINE_CONFIRMED_NOT_PRODUCTION !== "true") {
  die("REFUSED · P1_BASELINE_CONFIRMED_NOT_PRODUCTION must be true");
}

const steps = [
  { name: "Vitest", cmd: "npm", args: ["test"] },
  { name: "TypeScript", cmd: "npx", args: ["tsc", "--noEmit"] },
  { name: "Next build", cmd: "npm", args: ["run", "build"] },
  // Run fixture provisioning as its own fail-closed gate. The persona runner
  // also invokes this helper defensively; keeping it explicit prevents a
  // false-green release when provisioning fails before runtime QA.
  { name: "QA persona fixtures", cmd: "node", args: ["scripts/test-baseline/yema-qa-fixtures.mjs"] },
  { name: "QA beta admission", cmd: "node", args: ["scripts/test-baseline/ensure-qa-beta-access-p1.mjs"] },
  { name: "9 personas runtime", cmd: "node", args: ["scripts/orchestrate-personas-p1.mjs"] },
  // The legacy runtime checks accept <400 for the home route. This strict gate
  // rejects redirects so a privileged persona cannot silently land in Solo or
  // another workspace while the release remains green.
  { name: "Canonical persona homes", cmd: "node", args: ["scripts/test-persona-home-routes-p1.mjs"] },
  { name: "9 personas visual", cmd: "node", args: ["scripts/orchestrate-personas-capture.mjs"] },
  { name: "Monde assignments E2E", cmd: "npm", args: ["run", "test:e2e:b2"] },
  { name: "Messaging Realtime", cmd: "npm", args: ["run", "test:messaging-realtime:p1"] },
  { name: "Messaging audio", cmd: "npm", args: ["run", "test:messaging-audio:p1"] },
  { name: "Final browser acceptance", cmd: "npm", args: ["run", "test:final-browser-acceptance:p1"] },
];

console.log(`[release-gate:p1] projectRef=${P1_REF}`);
console.log(`[release-gate:p1] steps=${steps.length}`);

for (let i = 0; i < steps.length; i += 1) {
  const step = steps[i];
  console.log(`\n[release-gate:p1] STEP ${i + 1}/${steps.length} · ${step.name}`);
  const result = spawnSync(step.cmd, step.args, {
    stdio: "inherit",
    env: process.env,
  });
  if (result.error) die(`${step.name} spawn failed · ${result.error.message}`);
  if ((result.status ?? 1) !== 0) {
    die(`${step.name} failed · exit=${result.status ?? "unknown"}`);
  }
  console.log(`[release-gate:p1] ✓ ${step.name}`);
}

console.log("\n[release-gate:p1] ALL GREEN · P-1 release gate passed");
