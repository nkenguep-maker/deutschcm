#!/usr/bin/env node
// Lot 7C · wrapper npm run test:entitlements:p1.
// NON-SKIPPABLE · fail-closed si P-1 ou credentials manquants.

import { spawn } from "node:child_process";

const P1_REF = "kzzagbojjkivdzzcrmxn";
const BLOCKED = new Set([
  "sbjhvlrkbyjckdxujjsk",
  "mamofhrurksyuuolucea",
  "qggwvonfumuimjfsgpdz",
]);

function die(code, msg) {
  console.error(`[test:entitlements:p1] ${msg}`);
  process.exit(code);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
if (!url.includes(P1_REF)) die(2, `URL non-P1 · refusé`);
for (const b of BLOCKED) if (url.includes(b)) die(2, `URL blocklisted · ${b}`);
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) die(2, "MISSING SUPABASE_SERVICE_ROLE_KEY · NON-SKIPPABLE");

const child = spawn("node", [
  "scripts/test-baseline/run-p4-5-b2-p1.mjs",
  "--flag", "on", "--",
  "node", "scripts/orchestrate-entitlements-p1.mjs",
], { stdio: "inherit", env: process.env });
child.on("exit", (code) => process.exit(code ?? 1));
