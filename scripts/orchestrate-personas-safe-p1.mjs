#!/usr/bin/env node
// Safety wrapper for the authenticated 9-persona P-1 runner.
// It makes fixture provisioning fail-closed and always attempts to restore
// idempotent QA fixtures after the runtime suite, including failure/signal paths.

import { spawnSync } from "node:child_process";

const FIXTURE_SCRIPT = "scripts/test-baseline/yema-qa-fixtures.mjs";
const PERSONA_SCRIPT = "scripts/orchestrate-personas-p1.mjs";

function runNode(script) {
  return spawnSync("node", [script], {
    stdio: "inherit",
    env: process.env,
  });
}

function describeResult(result) {
  if (result.error) return result.error.message;
  if (result.signal) return `signal ${result.signal}`;
  return `exit ${result.status ?? "unknown"}`;
}

console.log("[personas-safe] PREP · provision fixtures P-1");
const prep = runNode(FIXTURE_SCRIPT);
if (prep.status !== 0) {
  console.error(`[personas-safe] FAIL · fixture provisioning failed (${describeResult(prep)})`);
  process.exit(prep.status ?? 1);
}

let personaResult;
let cleanupResult;
try {
  console.log("[personas-safe] RUN · authenticated 9-persona QA");
  personaResult = runNode(PERSONA_SCRIPT);
} finally {
  console.log("[personas-safe] CLEANUP · restore idempotent P-1 fixtures");
  cleanupResult = runNode(FIXTURE_SCRIPT);
}

if (cleanupResult.status !== 0) {
  console.error(`[personas-safe] FAIL · fixture restoration failed (${describeResult(cleanupResult)})`);
  process.exit(cleanupResult.status ?? 1);
}

if (personaResult.status !== 0) {
  console.error(`[personas-safe] FAIL · persona QA failed (${describeResult(personaResult)})`);
  process.exit(personaResult.status ?? 1);
}

console.log("[personas-safe] OK · persona QA passed and fixtures restored");
