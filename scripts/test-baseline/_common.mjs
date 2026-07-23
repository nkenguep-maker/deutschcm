// P-1 Baseline — shared helpers + safety guards.
// Refuse to run on production. Refuse to touch entities without TEST_ prefix.

import { readFileSync } from "node:fs";

// P4.3a hardening · **AUCUN** chargement automatique de `.env`. Historique ·
// 2026-07-23, `dotenv/config` chargeait `.env` puis `.env.p1-baseline` en
// override conditionnel (`if (!process.env[m[1]])`). Sur poste dev où `.env`
// contient `DIRECT_URL` de PRODUCTION, cela faisait pointer les scripts test
// vers la DB production. Résultat · 12 fixtures Prisma écrites sur
// `sbjhvlrkbyjckdxujjsk` (voir docs/incidents/2026-07-23-p4-3a-production-fixture-write.md).
//
// Correction · on charge UNIQUEMENT `.env.p1-baseline` **avec override
// total** (les variables shell préalables sont écrasées si `.env.p1-baseline`
// les définit). Aucune autre source d'env vars n'est autorisée. Toute
// tentative de contournement par override permanent est explicitement
// interdite par les gardes de `assertNonProduction`.

// The dedicated P-1 project ref (nkengue.p@gmail.com org).
const P1_REF = "kzzagbojjkivdzzcrmxn";
// Explicit blacklist of known non-P1 projects (deutschcm prod + prior dev).
const FORBIDDEN_REFS = ["sbjhvlrkbyjckdxujjsk", "mamofhrurksyuuolucea", "qggwvonfumuimjfsgpdz"];

// Charge `.env.p1-baseline` avec override total. Toutes les variables
// définies dans ce fichier écrasent l'environnement processus. Aucune
// autre source n'est lue.
try {
  const raw = readFileSync(".env.p1-baseline", "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {}

/**
 * Extrait le project ref d'une URL Supabase ou d'une connection string
 * PostgreSQL du pooler Supabase. Refuse toute forme non reconnue.
 *
 * Formats acceptés ·
 *   - https://<ref>.supabase.co
 *   - postgresql://postgres.<ref>:<pwd>@aws-N-<region>.pooler.supabase.com:<port>/postgres
 *   - postgres://... (idem)
 *
 * Retourne · { ref, kind: "https" | "postgres" }
 * Throw · si l'URL ne peut pas être analysée ou si le format ne correspond
 * à aucun template Supabase attendu.
 */
function parseSupabaseRef(rawUrl, label) {
  if (!rawUrl || typeof rawUrl !== "string") {
    throw new Error(`REFUSED: ${label} missing or invalid.`);
  }
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error(`REFUSED: ${label} is not a parseable URL.`);
  }
  // Supabase HTTP endpoint
  if (url.protocol === "https:") {
    const m = url.hostname.match(/^([a-z0-9]{20})\.supabase\.co$/i);
    if (!m) throw new Error(`REFUSED: ${label} is not a supabase.co URL (${url.hostname}).`);
    return { ref: m[1].toLowerCase(), kind: "https" };
  }
  // PostgreSQL pooler
  if (url.protocol === "postgresql:" || url.protocol === "postgres:") {
    if (!url.hostname.endsWith(".pooler.supabase.com")) {
      throw new Error(`REFUSED: ${label} is not a supabase pooler host (${url.hostname}).`);
    }
    // Username is `postgres.<ref>` (transaction pooler).
    const userMatch = decodeURIComponent(url.username).match(/^postgres\.([a-z0-9]{20})$/i);
    if (!userMatch) {
      throw new Error(`REFUSED: ${label} username does not encode a supabase project ref.`);
    }
    return { ref: userMatch[1].toLowerCase(), kind: "postgres" };
  }
  throw new Error(`REFUSED: ${label} protocol ${url.protocol} is not recognized.`);
}

function assertRefIsP1(rawUrl, label) {
  const { ref, kind } = parseSupabaseRef(rawUrl, label);
  if (FORBIDDEN_REFS.includes(ref)) {
    throw new Error(`REFUSED: ${label} targets forbidden project ref ${ref} (kind=${kind}).`);
  }
  if (ref !== P1_REF) {
    throw new Error(
      `REFUSED: ${label} project ref (${ref}) does not match P-1 (${P1_REF}). ` +
      `Refusing to connect. kind=${kind}.`
    );
  }
}

export function assertNonProduction() {
  if (process.env.P1_BASELINE_CONFIRMED_NOT_PRODUCTION !== "true") {
    throw new Error(
      "REFUSED: P1_BASELINE_CONFIRMED_NOT_PRODUCTION is not true.\n" +
      "This script only runs on the dedicated P-1 Supabase project.\n" +
      "See .env.p1-baseline and scripts/test-baseline/README.md."
    );
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("REFUSED: SUPABASE_SERVICE_ROLE_KEY missing.");
  }
  // Toute variable URL vers Supabase doit cibler P-1 exclusivement · l'échec
  // d'une seule d'entre elles bloque l'exécution avant toute connexion.
  assertRefIsP1(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL");
  assertRefIsP1(process.env.DIRECT_URL, "DIRECT_URL");
  if (process.env.DATABASE_URL) {
    assertRefIsP1(process.env.DATABASE_URL, "DATABASE_URL");
  }
  if (process.env.SUPABASE_URL) {
    assertRefIsP1(process.env.SUPABASE_URL, "SUPABASE_URL");
  }
  // Aucun mode d'override permettant de cibler la production · si un futur
  // développeur ajoute une telle variable ici, elle sera reviewée.
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
