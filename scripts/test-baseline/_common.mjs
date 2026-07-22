// P-1 Baseline — shared helpers + safety guards.
// Refuse to run on production. Refuse to touch entities without TEST_ prefix.

import "dotenv/config";
import { readFileSync } from "node:fs";

// Load .env.p1-baseline explicitly (dotenv/config only reads .env by default)
try {
  const raw = readFileSync(".env.p1-baseline", "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {}

export function assertNonProduction() {
  if (process.env.P1_BASELINE_CONFIRMED_NOT_PRODUCTION !== "true") {
    throw new Error(
      "REFUSED: P1_BASELINE_CONFIRMED_NOT_PRODUCTION is not true.\n" +
      "This script only runs on the dedicated P-1 Supabase project.\n" +
      "See .env.p1-baseline and scripts/test-baseline/README.md."
    );
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  // The dedicated P-1 project ref (nkengue.p@gmail.com org)
  const P1_REF = "kzzagbojjkivdzzcrmxn";
  // Explicit blacklist of known non-P1 projects
  const FORBIDDEN = ["sbjhvlrkbyjckdxujjsk", "mamofhrurksyuuolucea", "qggwvonfumuimjfsgpdz"];
  for (const bad of FORBIDDEN) {
    if (url.includes(bad)) {
      throw new Error(`REFUSED: NEXT_PUBLIC_SUPABASE_URL targets forbidden project ${bad}.`);
    }
  }
  if (!url.includes(P1_REF)) {
    throw new Error(
      `REFUSED: NEXT_PUBLIC_SUPABASE_URL (${url}) does not target the P-1 project.\n` +
      `Expected ref: ${P1_REF}. Refusing to touch any other Supabase project.`
    );
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("REFUSED: SUPABASE_SERVICE_ROLE_KEY missing.");
  }
  if (!process.env.DIRECT_URL) {
    throw new Error("REFUSED: DIRECT_URL missing.");
  }
}

export const TEST_PREFIX = "yema_test_";
export const TEST_NAME_PREFIX = "TEST_";

/** Guard: any DB entity to delete/mutate must match test convention. */
export function assertTestOnly(kind, id) {
  if (typeof id !== "string" || (!id.includes(TEST_PREFIX) && !id.startsWith(TEST_NAME_PREFIX.toLowerCase()) && !id.startsWith("test_"))) {
    throw new Error(`REFUSED: attempted to touch non-test ${kind}: ${id}`);
  }
}

export const ACCOUNTS = [
  {
    label: "monde",
    email: "paul+yema_test_monde@example.com",
    fullName: "TEST_Etudiant Monde",
    role: "STUDENT",
    territory: "MONDE",
  },
  {
    label: "racines_solo",
    email: "paul+yema_test_racines_solo@example.com",
    fullName: "TEST_Racines Solo",
    role: "STUDENT",
    territory: "RACINES",
  },
  {
    label: "racines_family",
    email: "paul+yema_test_racines_family@example.com",
    fullName: "TEST_Racines Famille",
    role: "STUDENT",
    territory: "RACINES",
  },
  {
    label: "teacher",
    email: "paul+yema_test_teacher@example.com",
    fullName: "TEST_Professeur",
    role: "TEACHER",
    territory: "MONDE",
  },
  {
    label: "center",
    email: "paul+yema_test_center@example.com",
    fullName: "TEST_Centre",
    role: "CENTER",
    territory: "MONDE",
  },
  {
    label: "admin",
    email: "paul+yema_test_admin@example.com",
    fullName: "TEST_Admin",
    role: "ADMIN",
    territory: null,
  },
];

/** Test password — provided by env var, never hardcoded, never logged. */
export function getTestPassword() {
  const pwd = process.env.P1_TEST_PASSWORD;
  if (!pwd || pwd.length < 12) {
    throw new Error(
      "REFUSED: P1_TEST_PASSWORD is missing or too short (< 12 chars).\n" +
      "Set it in .env.p1-baseline (gitignored) — never commit its value.\n" +
      "Example: P1_TEST_PASSWORD=<generate 24+ random chars>",
    );
  }
  return pwd;
}

/** Safe log helper — redacts any password-like value. */
export function redactPassword(str) {
  const pwd = process.env.P1_TEST_PASSWORD;
  if (!pwd) return str;
  return String(str).replaceAll(pwd, "***");
}
