#!/usr/bin/env node
// P4.5-B2 · cycle E2E navigateur complet sur P-1.
//
// Ce script est appelé exclusivement depuis run-p4-5-b2-p1.mjs : le
// chargeur strict est donc l'unique autorité pour l'environnement P-1.
// Il provisionne les données et les identités Auth attendues par Playwright,
// puis restaure les deux plans de données, même après un échec navigateur.

import { spawnSync } from "node:child_process";

const MODES = {
  on: {
    port: "3105",
    match: "**/tests/e2e/p4-5-b2b3-b2/!(flag-off).spec.ts",
  },
  off: {
    port: "3106",
    match: "**/tests/e2e/p4-5-b2b3-b2/flag-off.spec.ts",
  },
};

function parseMode(argv) {
  if (argv.length === 2 && argv[0] === "--flag" && argv[1] in MODES) return argv[1];
  throw new Error("usage: node scripts/orchestrate-e2e-b2-p1.mjs --flag on|off");
}

function runNode(script) {
  return spawnSync("node", [script], { stdio: "inherit", env: process.env });
}

function runPlaywright(mode) {
  const { port, match } = MODES[mode];
  return spawnSync("npx", ["playwright", "test", "--config=playwright.p4-5-b2.config.ts"], {
    stdio: "inherit",
    env: {
      ...process.env,
      PW_FLAG: mode,
      PW_TESTMATCH: match,
      PLAYWRIGHT_PORT: port,
    },
  });
}

function failed(result) {
  return Boolean(result?.error || result?.signal || result?.status !== 0);
}

function resultCode(result) {
  return result?.status && result.status > 0 ? result.status : 1;
}

function describeResult(result) {
  if (result?.error) return result.error.message;
  if (result?.signal) return `signal ${result.signal}`;
  return `exit ${result?.status ?? "unknown"}`;
}

async function main() {
  const mode = parseMode(process.argv.slice(2));
  let primaryResult;
  let dataCleanup;
  let authCleanup;

  try {
    console.log(`[e2e-b2] PREP · data fixtures (${mode})`);
    const dataFixtures = runNode("scripts/test-baseline/p4-5-b-fixtures.mjs");
    if (failed(dataFixtures)) {
      primaryResult = dataFixtures;
    } else {
      console.log("[e2e-b2] PREP · Auth fixtures");
      const authFixtures = runNode("scripts/test-baseline/p4-5-b-auth-fixtures.mjs");
      if (failed(authFixtures)) {
        primaryResult = authFixtures;
      } else {
        console.log(`[e2e-b2] RUN · Playwright (${mode})`);
        primaryResult = runPlaywright(mode);
      }
    }
  } finally {
    console.log("[e2e-b2] CLEANUP · P-1 data fixtures");
    dataCleanup = runNode("scripts/test-baseline/p4-5-b-cleanup.mjs");

    console.log("[e2e-b2] CLEANUP · P-1 Auth fixtures");
    authCleanup = runNode("scripts/test-baseline/p4-5-b-auth-cleanup.mjs");
  }

  if (failed(dataCleanup)) {
    throw new Error(`data cleanup failed (${describeResult(dataCleanup)})`);
  }
  if (failed(authCleanup)) {
    throw new Error(`Auth cleanup failed (${describeResult(authCleanup)})`);
  }
  if (failed(primaryResult)) {
    throw new Error(`E2E setup or Playwright failed (${describeResult(primaryResult)})`);
  }

  console.log(`[e2e-b2] OK · ${mode} completed and P-1 fixtures removed`);
}

main().catch((error) => {
  console.error(`[e2e-b2] FAIL · ${error.message}`);
  process.exit(1);
});
