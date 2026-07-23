// P4.3a incident closure · Tests de refus environnement `_common.mjs`.
//
// Simule différents scenarii shell + fichier `.env.p1-baseline` absent et
// vérifie que `assertNonProduction` REFUSE avant toute connexion Supabase
// ou Prisma. Chaque scénario est isolé dans un child-process avec un cwd
// temporaire dépourvu de `.env.p1-baseline` (via env -i · aucune fuite).
//
// Scénarios ·
//   1. Prod NEXT_PUBLIC_SUPABASE_URL      → REFUSED (targets forbidden ref).
//   2. P-1 URL mais PROD DIRECT_URL       → REFUSED (le bug 2026-07-23).
//   3. URL malformée                      → REFUSED (unparseable).
//   4. Postgres URL non-supabase           → REFUSED (not pooler host).
//   5. Absence P1_BASELINE_CONFIRMED      → REFUSED (safety opt-in).
//   6. P-1 partout                        → PASS.
//
// Contrat · le script se termine avec exit 0 seulement si les 6 assertions
// tombent comme attendu. Aucune connexion réseau, aucune fixture créée.

import { spawnSync } from "node:child_process";
import { mkdtempSync, symlinkSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const REPO = resolve(new URL("../..", import.meta.url).pathname);

function runCase({ label, env, expectRefusal }) {
  const cwd = mkdtempSync(join(tmpdir(), "p43a-env-"));
  // Lien symbolique vers node_modules + scripts du repo · aucun `.env.p1-baseline`
  // dans le cwd temporaire.
  symlinkSync(join(REPO, "node_modules"), join(cwd, "node_modules"));
  symlinkSync(join(REPO, "scripts"), join(cwd, "scripts"));
  const code = `
    import("./scripts/test-baseline/_common.mjs").then(({ assertNonProduction }) => {
      try { assertNonProduction(); console.log("__PASS__"); }
      catch (e) { console.log("__REFUSED__:" + e.message.split("\\n")[0]); }
    }).catch(e => { console.log("__ERR__:" + e.message); });
  `;
  const res = spawnSync("node", ["-e", code], { cwd, env, encoding: "utf8" });
  const stdout = (res.stdout || "").trim();
  const stderr = (res.stderr || "").trim();
  const ok =
    (expectRefusal && stdout.startsWith("__REFUSED__")) ||
    (!expectRefusal && stdout === "__PASS__");
  process.stderr.write(`  ${ok ? "✓" : "✗"} ${label}\n    ${stdout || stderr}\n`);
  if (!existsSync(join(cwd, "scripts"))) throw new Error("cwd broken");
  return ok;
}

const PATH_ENV = process.env.PATH ?? "/usr/local/bin:/usr/bin:/bin";
const CASES = [
  {
    label: "1. Prod NEXT_PUBLIC_SUPABASE_URL",
    env: {
      PATH: PATH_ENV,
      P1_BASELINE_CONFIRMED_NOT_PRODUCTION: "true",
      NEXT_PUBLIC_SUPABASE_URL: "https://sbjhvlrkbyjckdxujjsk.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "fake",
      DIRECT_URL: "postgresql://postgres.kzzagbojjkivdzzcrmxn:p@aws-0-eu-central-1.pooler.supabase.com:5432/postgres",
    },
    expectRefusal: true,
  },
  {
    label: "2. P-1 URL but PROD DIRECT_URL (the 2026-07-23 bug)",
    env: {
      PATH: PATH_ENV,
      P1_BASELINE_CONFIRMED_NOT_PRODUCTION: "true",
      NEXT_PUBLIC_SUPABASE_URL: "https://kzzagbojjkivdzzcrmxn.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "fake",
      DIRECT_URL: "postgresql://postgres.sbjhvlrkbyjckdxujjsk:p@aws-1-eu-central-1.pooler.supabase.com:5432/postgres",
    },
    expectRefusal: true,
  },
  {
    label: "3. Malformed URL",
    env: {
      PATH: PATH_ENV,
      P1_BASELINE_CONFIRMED_NOT_PRODUCTION: "true",
      NEXT_PUBLIC_SUPABASE_URL: "not-a-url",
      SUPABASE_SERVICE_ROLE_KEY: "fake",
      DIRECT_URL: "postgresql://x@y/z",
    },
    expectRefusal: true,
  },
  {
    label: "4. Postgres non-supabase host",
    env: {
      PATH: PATH_ENV,
      P1_BASELINE_CONFIRMED_NOT_PRODUCTION: "true",
      NEXT_PUBLIC_SUPABASE_URL: "https://kzzagbojjkivdzzcrmxn.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "fake",
      DIRECT_URL: "postgresql://postgres:pwd@some-other-host.example.com:5432/postgres",
    },
    expectRefusal: true,
  },
  {
    label: "5. Missing P1_BASELINE_CONFIRMED_NOT_PRODUCTION",
    env: {
      PATH: PATH_ENV,
      NEXT_PUBLIC_SUPABASE_URL: "https://kzzagbojjkivdzzcrmxn.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "fake",
      DIRECT_URL: "postgresql://postgres.kzzagbojjkivdzzcrmxn:p@aws-0-eu-central-1.pooler.supabase.com:5432/postgres",
    },
    expectRefusal: true,
  },
  {
    label: "6. All-P-1 (must PASS)",
    env: {
      PATH: PATH_ENV,
      P1_BASELINE_CONFIRMED_NOT_PRODUCTION: "true",
      NEXT_PUBLIC_SUPABASE_URL: "https://kzzagbojjkivdzzcrmxn.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "fake",
      DIRECT_URL: "postgresql://postgres.kzzagbojjkivdzzcrmxn:p@aws-0-eu-central-1.pooler.supabase.com:5432/postgres",
    },
    expectRefusal: false,
  },
];

process.stderr.write("═══ P4.3a · env refusal tests ═══\n");
const results = CASES.map(runCase);
const passed = results.filter(Boolean).length;
process.stderr.write(`\n${passed}/${CASES.length} scenarios matched expectations\n`);
process.exit(passed === CASES.length ? 0 : 1);
