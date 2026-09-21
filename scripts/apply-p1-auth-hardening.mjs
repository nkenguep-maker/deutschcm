#!/usr/bin/env node
// P0.11 · P-1 Supabase Auth hardening.
//
// Applies ONLY the leaked-password protection switch on the canonical P-1
// project through Supabase Management API. This script intentionally requires
// a local SUPABASE_ACCESS_TOKEN and never prints it.
//
// Usage:
//   SUPABASE_ACCESS_TOKEN=... npm run auth:hardening:p1
//
// Production and historical non-P1 refs are hard-blocked.

const P1_REF = "kzzagbojjkivdzzcrmxn";
const FORBIDDEN_REFS = new Set([
  "sbjhvlrkbyjckdxujjsk",
  "mamofhrurksyuuolucea",
  "qggwvonfumuimjfsgpdz",
]);
const API = "https://api.supabase.com/v1";

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function assertP1() {
  if (FORBIDDEN_REFS.has(P1_REF)) throw new Error("forbidden Supabase ref");
  if (P1_REF !== "kzzagbojjkivdzzcrmxn") {
    throw new Error("refusing non-canonical P-1 project");
  }
}

async function management(path, init = {}) {
  const token = required("SUPABASE_ACCESS_TOKEN");
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  let body = null;
  if (text) {
    try { body = JSON.parse(text); }
    catch { body = { message: "non-JSON response" }; }
  }
  if (!response.ok) {
    throw new Error(
      `Supabase Management API ${response.status}: ${body?.message ?? body?.error ?? "request failed"}`,
    );
  }
  return body;
}

async function main() {
  assertP1();

  const before = await management(`/projects/${P1_REF}/config/auth`);
  if (before?.password_hibp_enabled === true) {
    console.log("[auth-hardening:p1] OK · leaked-password protection already enabled");
    return;
  }

  await management(`/projects/${P1_REF}/config/auth`, {
    method: "PATCH",
    body: JSON.stringify({ password_hibp_enabled: true }),
  });

  const after = await management(`/projects/${P1_REF}/config/auth`);
  if (after?.password_hibp_enabled !== true) {
    throw new Error("password_hibp_enabled was not enabled after PATCH");
  }

  console.log("[auth-hardening:p1] OK · leaked-password protection enabled on P-1");
}

main().catch((error) => {
  console.error(
    `[auth-hardening:p1] FAIL · ${error instanceof Error ? error.message : "unknown error"}`,
  );
  process.exit(1);
});
