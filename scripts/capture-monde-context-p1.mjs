#!/usr/bin/env node
// Lot 7B.1 · wrapper npm run capture:monde-context:p1.
// NON-SKIPPABLE · fail-closed si P-1 ou credentials manquants.

import { spawn } from "node:child_process";

const P1_REF = "kzzagbojjkivdzzcrmxn";
const BLOCKED = new Set([
  "sbjhvlrkbyjckdxujjsk",
  "mamofhrurksyuuolucea",
  "qggwvonfumuimjfsgpdz",
]);

function die(code, msg) {
  console.error(`[capture:monde-context:p1] ${msg}`);
  process.exit(code);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
if (!url.includes(P1_REF)) die(2, `URL non-P1 · refusé`);
for (const b of BLOCKED) if (url.includes(b)) die(2, `URL blocklisted · ${b}`);

// Lot 7B.2 · defaults canoniques (voir test-monde-context-p1.mjs).
process.env.MONDE_CONTEXT_TEACHER_EMAIL ||= "test_yema_qa_teacher@example.com";
process.env.MONDE_CONTEXT_FAMILY_EMAIL  ||= "test_yema_qa_family@example.com";
process.env.MONDE_CONTEXT_TEACHER_PASSWORD ||= process.env.P1_TEST_PASSWORD || "";
process.env.MONDE_CONTEXT_FAMILY_PASSWORD  ||= process.env.P1_TEST_PASSWORD || "";

const required = [
  "MONDE_CONTEXT_TEACHER_EMAIL",
  "MONDE_CONTEXT_TEACHER_PASSWORD",
  "MONDE_CONTEXT_FAMILY_EMAIL",
  "MONDE_CONTEXT_FAMILY_PASSWORD",
];
for (const k of required) {
  if (!process.env[k]) die(2, `MISSING ${k} · NON-SKIPPABLE`);
}

const child = spawn("node", [
  "scripts/test-baseline/run-p4-5-b2-p1.mjs",
  "--flag", "on", "--",
  "node", "scripts/orchestrate-monde-context-capture.mjs",
], { stdio: "inherit", env: process.env });
child.on("exit", (code) => process.exit(code ?? 1));
