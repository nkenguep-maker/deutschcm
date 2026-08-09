#!/usr/bin/env node
// Safety wrapper for the authenticated 9-persona P-1 runner.
// It makes fixture provisioning fail-closed and always attempts to restore
// idempotent QA fixtures after provisioning/runtime failures.

import { spawnSync } from "node:child_process";

const FIXTURE_SCRIPT = "scripts/test-baseline/yema-qa-fixtures.mjs";
const PERSONA_SCRIPT = "scripts/orchestrate-personas-p1.mjs";
const ADULT_PERSONAS_VERIFY_SCRIPT = "scripts/verify-adult-persona-routes-p1.mjs";
const CHILD_RACINES_VERIFY_SCRIPT = "scripts/verify-child-racines-session-p1.mjs";

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

function failed(result) {
  return Boolean(result?.error || result?.signal || result?.status !== 0);
}

function attemptFixtureRecovery(context) {
  console.log(`[personas-safe] RECOVERY · restore idempotent P-1 fixtures after ${context}`);
  const recovery = runNode(FIXTURE_SCRIPT);
  if (failed(recovery)) {
    console.error(`[personas-safe] FAIL · fixture recovery failed (${describeResult(recovery)})`);
  }
  return recovery;
}

console.log("[personas-safe] PREP · provision fixtures P-1");
const prep = runNode(FIXTURE_SCRIPT);
if (failed(prep)) {
  console.error(`[personas-safe] FAIL · fixture provisioning failed (${describeResult(prep)})`);
  const recovery = attemptFixtureRecovery("provisioning failure");
  process.exit(failed(recovery) ? (recovery.status ?? 1) : (prep.status ?? 1));
}

let personaResult;
let adultRoutesResult;
let childRacinesResult;
let cleanupResult;
try {
  console.log("[personas-safe] RUN · authenticated 9-persona QA");
  personaResult = runNode(PERSONA_SCRIPT);

  if (!failed(personaResult)) {
    console.log("[personas-safe] VERIFY · all allowed routes for 7 adult personas");
    adultRoutesResult = runNode(ADULT_PERSONAS_VERIFY_SCRIPT);
  }

  if (!failed(personaResult) && !failed(adultRoutesResult)) {
    console.log("[personas-safe] VERIFY · Child Racines session identity");
    childRacinesResult = runNode(CHILD_RACINES_VERIFY_SCRIPT);
  }
} finally {
  console.log("[personas-safe] CLEANUP · restore idempotent P-1 fixtures");
  cleanupResult = runNode(FIXTURE_SCRIPT);
}

if (failed(cleanupResult)) {
  console.error(`[personas-safe] FAIL · fixture restoration failed (${describeResult(cleanupResult)})`);
  process.exit(cleanupResult.status ?? 1);
}

if (failed(personaResult)) {
  console.error(`[personas-safe] FAIL · persona QA failed (${describeResult(personaResult)})`);
  process.exit(personaResult?.status ?? 1);
}

if (failed(adultRoutesResult)) {
  console.error(`[personas-safe] FAIL · adult persona route verification failed (${describeResult(adultRoutesResult)})`);
  process.exit(adultRoutesResult?.status ?? 1);
}

if (failed(childRacinesResult)) {
  console.error(`[personas-safe] FAIL · Child Racines session verification failed (${describeResult(childRacinesResult)})`);
  process.exit(childRacinesResult?.status ?? 1);
}

console.log("[personas-safe] OK · persona QA passed, all adult routes verified, Child Racines identity verified and fixtures restored");
