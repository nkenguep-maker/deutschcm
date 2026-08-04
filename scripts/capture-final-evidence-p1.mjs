#!/usr/bin/env node
// Gate 8G · wrapper npm run capture:final-evidence:p1.
// Delegue au test orchestrator qui produit deja les captures Playwright.

import { spawn } from "node:child_process";

const P1_REF = "kzzagbojjkivdzzcrmxn";
const BLOCKED = new Set(["sbjhvlrkbyjckdxujjsk", "mamofhrurksyuuolucea", "qggwvonfumuimjfsgpdz"]);

function die(code, msg) {
  console.error(`[capture:final-evidence:p1] ${msg}`);
  process.exit(code);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
if (!url.includes(P1_REF)) die(2, `URL non-P1 · refusé`);
for (const b of BLOCKED) if (url.includes(b)) die(2, `URL blocklisted · ${b}`);
if (!process.env.P1_TEST_PASSWORD) die(2, "MISSING P1_TEST_PASSWORD · NON-SKIPPABLE");

const child = spawn("node", ["scripts/test-final-evidence-p1.mjs"], {
  stdio: "inherit",
  env: { ...process.env, YEMA_FINAL_EVIDENCE_CAPTURES: "true" },
});
child.on("exit", (code) => process.exit(code ?? 1));
