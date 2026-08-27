#!/usr/bin/env node
// Closed-beta Production activation preflight.
//
// This is stricter than the generic production preflight: rollback/open modes
// may legitimately run with YEMA_CLOSED_BETA_ENABLED=false, while an intended
// closed-beta activation must fail if that flag is absent or false.
// No secret value is ever logged.

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const GENERIC_PREFLIGHT = resolve(HERE, "preflight-release-prod.mjs");
const MIN_INVITE_SECRET_LENGTH = 32;

function fail(name, message) {
  console.error(`[preflight-closed-beta-prod] FAIL · ${name} · ${message}`);
  process.exit(2);
}

if (process.env.VERCEL_ENV !== "production") {
  fail("VERCEL_ENV", "must be production");
}
if (process.env.YEMA_CLOSED_BETA_ENABLED !== "true") {
  fail("YEMA_CLOSED_BETA_ENABLED", "must be explicitly true");
}

const inviteSecret = process.env.YEMA_BETA_INVITE_SECRET ?? "";
if (inviteSecret.length < MIN_INVITE_SECRET_LENGTH) {
  fail("YEMA_BETA_INVITE_SECRET", `must contain at least ${MIN_INVITE_SECRET_LENGTH} characters`);
}

const generic = spawnSync(process.execPath, [GENERIC_PREFLIGHT], {
  stdio: "inherit",
  env: process.env,
});
if (generic.error) {
  console.error("[preflight-closed-beta-prod] FAIL · generic preflight could not start");
  process.exit(3);
}
if ((generic.status ?? 1) !== 0) {
  console.error("[preflight-closed-beta-prod] FAIL · generic production preflight failed");
  process.exit(generic.status ?? 1);
}

console.log("[preflight-closed-beta-prod] OK · closed-beta Production configuration is explicit and complete");
