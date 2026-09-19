#!/usr/bin/env node
// P0.11 · Verify P-1 Supabase Auth leaked-password protection.
//
// Read-only Management API verification. Requires a local
// SUPABASE_ACCESS_TOKEN and refuses every project except canonical P-1.

const P1_REF = "kzzagbojjkivdzzcrmxn";
const FORBIDDEN_REFS = new Set([
  "sbjhvlrkbyjckdxujjsk",
  "mamofhrurksyuuolucea",
  "qggwvonfumuimjfsgpdz",
]);

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function main() {
  if (FORBIDDEN_REFS.has(P1_REF) || P1_REF !== "kzzagbojjkivdzzcrmxn") {
    throw new Error("refusing non-canonical P-1 project");
  }

  const token = required("SUPABASE_ACCESS_TOKEN");
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${P1_REF}/config/auth`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!response.ok) {
    throw new Error(`Supabase Management API returned ${response.status}`);
  }

  const config = await response.json();
  if (config?.password_hibp_enabled !== true) {
    throw new Error("leaked-password protection is disabled on P-1");
  }

  console.log("[verify-auth-hardening:p1] OK · password_hibp_enabled=true");
}

main().catch((error) => {
  console.error(
    `[verify-auth-hardening:p1] FAIL · ${error instanceof Error ? error.message : "unknown error"}`,
  );
  process.exit(1);
});
