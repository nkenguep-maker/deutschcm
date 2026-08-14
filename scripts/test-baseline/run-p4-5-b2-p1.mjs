#!/usr/bin/env node
// P4.5-B2b3b-b2 · wrapper d'exécution P-1 strict.
//
// Objectif · lancer un enfant (dev server Next, Playwright, fixtures,
// cleanup) sous un environnement contrôlé et vérifié qui pointe
// EXCLUSIVEMENT sur le projet Supabase P-1 (`kzzagbojjkivdzzcrmxn`).
//
// Contrats non négociables ·
//   1. Ne JAMAIS modifier .env.local (ni lire, ni renommer, ni restaurer).
//   2. Charger UNIQUEMENT .env.p1-baseline (avec override total).
//   3. Refuser toute variable dont la valeur contient une référence
//      production (sbjhvlrkbyjckdxujjsk) ou tout ref Supabase non P-1.
//   4. Auditer l'allowlist Supabase RÉELLEMENT utilisée dans le repo ·
//      NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
//      SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
//      SUPABASE_PROJECT_REF, DIRECT_URL, DATABASE_URL, SHADOW_DATABASE_URL.
//      Requis · une variable ABSENTE de .env.p1-baseline mais présente dans
//      cette allowlist ET requise doit faire échouer immédiatement.
//   5. Ne JAMAIS logger les clés ou tokens · uniquement projectRef + flag.
//   6. Définir explicitement le flag demandé (--flag on|off).
//   7. Exécuter la commande enfant avec cet env, puis propager son exit code.
//
// Usage ·
//   node scripts/test-baseline/run-p4-5-b2-p1.mjs --flag on -- <cmd> [args]
//   node scripts/test-baseline/run-p4-5-b2-p1.mjs --flag off -- <cmd> [args]
//   node scripts/test-baseline/run-p4-5-b2-p1.mjs --check    # dry-run
//
// Sortie standard (uniquement) ·
//   P-1 ENVIRONMENT VERIFIED
//   projectRef=kzzagbojjkivdzzcrmxn
//   assignmentsEnabled=true|false

import { readFileSync, existsSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const P1_REF = "kzzagbojjkivdzzcrmxn";
const FORBIDDEN_REFS = [
  "sbjhvlrkbyjckdxujjsk", // deutschcm PROD
  "mamofhrurksyuuolucea", // ancien dev
  "qggwvonfumuimjfsgpdz", // ancien dev
];

// Allowlist Supabase-related — exactement les variables utilisées dans le
// repo (résultat de l'audit `grep process.env` sur src/ scripts/ prisma/).
// Toute variable supplémentaire dans .env.p1-baseline non listée ici est
// tolérée (P1_TEST_PASSWORD, P1_BASELINE_CONFIRMED_NOT_PRODUCTION) mais
// vérifiée si ressemble à une URL/clé Supabase.
const SUPABASE_URL_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_URL",
  "DIRECT_URL",
  "DATABASE_URL",
  "SHADOW_DATABASE_URL",
];
const SUPABASE_KEY_VARS = [
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];
const SUPABASE_REF_VARS = [
  "SUPABASE_PROJECT_REF",
];
// Requis pour l'exécution E2E · absence = échec.
const REQUIRED_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DIRECT_URL",
  "DATABASE_URL",
  "P1_TEST_PASSWORD",
  "P1_BASELINE_CONFIRMED_NOT_PRODUCTION",
];

// ── Parse args ─────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { flag: null, check: false, cmd: [], help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--") { args.cmd = argv.slice(i + 1); break; }
    if (a === "--check") args.check = true;
    else if (a === "--help" || a === "-h") args.help = true;
    else if (a === "--flag") args.flag = argv[++i];
    else throw new Error(`unknown arg: ${a}`);
  }
  return args;
}

function printUsage() {
  process.stderr.write([
    "usage:",
    "  run-p4-5-b2-p1.mjs --flag on -- <cmd> [args...]",
    "  run-p4-5-b2-p1.mjs --flag off -- <cmd> [args...]",
    "  run-p4-5-b2-p1.mjs --check      # verify env without spawning",
    "",
    "Wrapper strict pour P4.5-B2b3b-b2 · charge .env.p1-baseline,",
    "verrouille projectRef=kzzagbojjkivdzzcrmxn, refuse toute reference",
    "prod, puis exec la commande fournie apres --.",
    "",
  ].join("\n"));
}

// ── Env loader (aucune fuite depuis process.env parent) ────────────────

function readDotEnv(path) {
  if (!existsSync(path)) {
    fatal(`missing env file: ${path}`);
  }
  const st = statSync(path);
  if (!st.isFile()) fatal(`${path} is not a file`);
  const out = {};
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const m = trimmed.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    const key = m[1];
    let value = m[2];
    // Trim inline comments only if preceded by whitespace and outside quotes.
    // Strip surrounding quotes.
    value = value.replace(/^["']|["']$/g, "");
    out[key] = value;
  }
  return out;
}

// ── Ref extractor · reprend la logique de _common.mjs ──────────────────

function parseSupabaseRef(rawUrl, label) {
  if (!rawUrl || typeof rawUrl !== "string") {
    fatal(`${label} missing or invalid`);
  }
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    fatal(`${label} is not a parseable URL`);
  }
  if (url.protocol === "https:") {
    const m = url.hostname.match(/^([a-z0-9]{20})\.supabase\.co$/i);
    if (!m) fatal(`${label} is not a supabase.co URL (${url.hostname})`);
    return { ref: m[1].toLowerCase(), kind: "https" };
  }
  if (url.protocol === "postgresql:" || url.protocol === "postgres:") {
    if (!url.hostname.endsWith(".pooler.supabase.com") && !url.hostname.endsWith(".supabase.co")) {
      fatal(`${label} is not a supabase host (${url.hostname})`);
    }
    const userMatch = decodeURIComponent(url.username).match(/^postgres\.([a-z0-9]{20})$/i);
    if (userMatch) return { ref: userMatch[1].toLowerCase(), kind: "postgres" };
    // db.<ref>.supabase.co direct connection
    const hostMatch = url.hostname.match(/^db\.([a-z0-9]{20})\.supabase\.co$/i);
    if (hostMatch) return { ref: hostMatch[1].toLowerCase(), kind: "postgres-direct" };
    fatal(`${label} does not encode a supabase project ref`);
  }
  fatal(`${label} protocol ${url.protocol} is not recognized`);
}

function assertRefIsP1(rawUrl, label) {
  const { ref, kind } = parseSupabaseRef(rawUrl, label);
  if (FORBIDDEN_REFS.includes(ref)) {
    fatal(`REFUSED: ${label} targets forbidden project ref ${ref} (kind=${kind})`);
  }
  if (ref !== P1_REF) {
    fatal(`REFUSED: ${label} project ref (${ref}) does not match P-1 (${P1_REF}) · kind=${kind}`);
  }
}

// ── Anti-leak scan · aucune value ne doit contenir un ref interdit ─────

function assertNoForbiddenSubstring(env) {
  for (const [k, v] of Object.entries(env)) {
    if (typeof v !== "string" || !v) continue;
    for (const bad of FORBIDDEN_REFS) {
      if (v.includes(bad)) {
        fatal(`REFUSED: ${k} contains forbidden ref substring ${bad}`);
      }
    }
  }
}

// ── Required keys enforcement ──────────────────────────────────────────

function assertRequiredKeysPresent(env) {
  const missing = REQUIRED_KEYS.filter((k) => !env[k] || env[k].length === 0);
  if (missing.length > 0) {
    fatal(`REFUSED: .env.p1-baseline missing required keys: ${missing.join(", ")}`);
  }
  if (env.P1_BASELINE_CONFIRMED_NOT_PRODUCTION !== "true") {
    fatal("REFUSED: P1_BASELINE_CONFIRMED_NOT_PRODUCTION must be 'true'");
  }
  if (env.P1_TEST_PASSWORD.length < 12) {
    fatal("REFUSED: P1_TEST_PASSWORD too short (<12 chars)");
  }
}

// ── URL/ref validation on the loaded env only ──────────────────────────

function assertAllUrlsP1(env) {
  for (const k of SUPABASE_URL_VARS) {
    if (env[k]) assertRefIsP1(env[k], k);
  }
  for (const k of SUPABASE_REF_VARS) {
    if (env[k] && env[k] !== P1_REF) {
      fatal(`REFUSED: ${k}=${env[k]} does not equal P-1 ref ${P1_REF}`);
    }
  }
  // Sanity · si des clés Supabase sont présentes, elles doivent contenir
  // le suffixe P-1 (les JWT Supabase encodent le ref dans le payload · on
  // vérifie sur le prefix visible pour éviter tout leak).
  for (const k of SUPABASE_KEY_VARS) {
    if (!env[k]) continue;
    // JWT format · header.payload.signature · payload contient "ref":"<...>"
    if (env[k].startsWith("eyJ")) {
      const parts = env[k].split(".");
      if (parts.length >= 2) {
        try {
          const payload = JSON.parse(
            Buffer.from(parts[1], "base64url").toString("utf8"),
          );
          if (payload && typeof payload.ref === "string" && payload.ref !== P1_REF) {
            fatal(`REFUSED: ${k} JWT ref=${payload.ref} does not match P-1`);
          }
        } catch {
          // JWT non-parseable · on refuse plutôt que d'ignorer silencieusement.
          fatal(`REFUSED: ${k} JWT payload is not parseable`);
        }
      }
    }
    // sb_secret_* et sb_publishable_* (nouveau format Supabase) ne portent
    // pas le ref dans la clé; on ne peut pas les valider offline, mais
    // l'URL cible aura été validée · defense-in-depth suffisante.
  }
}

// ── Flag ───────────────────────────────────────────────────────────────

function applyFlag(env, flag) {
  if (flag === "on") {
    // Workflow Monde end-to-end · assignments + Teacher workspace requis.
    // Le resolver Teacher exige `TEACHER_WORKSPACE_ENABLED` en 1er (§3),
    // le resolver Student exige `ASSIGNMENTS_ENABLED`. Sous `next start`
    // (NODE_ENV=production), `isTeacherWorkspaceActive` exige EN PLUS
    // `TEACHER_RLS_CONFIRMED=true`. P-1 a RLS activée sur les tables
    // Teacher · on acknowledge ici.
    env.YEMA_ASSIGNMENTS_ENABLED = "true";
    env.YEMA_TEACHER_WORKSPACE_ENABLED = "true";
    env.YEMA_TEACHER_RLS_CONFIRMED = "true";
    // P4.6-B.4 · messagerie ON pour E2E Realtime · MESSAGE_AUDIO reste off.
    env.YEMA_MESSAGING_ENABLED = "true";
    env.YEMA_MESSAGE_AUDIO_ENABLED = "false";
    // CIRCLE + CENTER + COACH restent OFF sauf demande explicite · b2 est
    // périmètre Monde uniquement.
  } else if (flag === "off") {
    env.YEMA_ASSIGNMENTS_ENABLED = "false";
    env.YEMA_TEACHER_WORKSPACE_ENABLED = "false";
    env.YEMA_TEACHER_RLS_CONFIRMED = "false";
    env.YEMA_MESSAGING_ENABLED = "false";
    env.YEMA_MESSAGE_AUDIO_ENABLED = "false";
  } else {
    fatal(`REFUSED: --flag must be 'on' or 'off' (got: ${flag ?? "none"})`);
  }
  // Défauts sûrs · ces flags doivent rester off pendant b2 (§17 protocole).
  env.YEMA_AUDIO_FEEDBACK_ENABLED = "false";
  env.YEMA_RACINES_COACH_OPERATIONAL = "false";
  env.YEMA_COACH_WORKSPACE_ENABLED = "false";
}

// ── Fatal helper (never logs env values) ───────────────────────────────

function fatal(msg) {
  process.stderr.write(`[wrapper-p1] ${msg}\n`);
  process.exit(2);
}

// ── Main ───────────────────────────────────────────────────────────────

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { printUsage(); process.exit(0); }

  const dotenv = readDotEnv(".env.p1-baseline");
  assertRequiredKeysPresent(dotenv);
  assertNoForbiddenSubstring(dotenv);
  assertAllUrlsP1(dotenv);

  const flag = args.check ? (args.flag ?? "on") : args.flag;
  applyFlag(dotenv, flag);

  // Print (only) the verified banner. Never log secrets.
  process.stdout.write("P-1 ENVIRONMENT VERIFIED\n");
  process.stdout.write(`projectRef=${P1_REF}\n`);
  process.stdout.write(`assignmentsEnabled=${dotenv.YEMA_ASSIGNMENTS_ENABLED}\n`);

  if (args.check) {
    process.stdout.write("check ok · no command spawned\n");
    process.exit(0);
  }
  if (args.cmd.length === 0) {
    fatal("no command after '--' · use --check or provide a command");
  }

  // Env final · on part d'une base minimale (PATH, HOME) + dotenv.
  // Aucune propagation des vars parent susceptibles de leak (celles du
  // shell qui contiennent des refs prod, si présentes).
  const passthrough = ["PATH", "HOME", "USER", "SHELL", "LANG", "LC_ALL", "TZ", "TMPDIR"];
  const childEnv = {};
  for (const k of passthrough) if (process.env[k]) childEnv[k] = process.env[k];
  for (const [k, v] of Object.entries(dotenv)) childEnv[k] = v;
  // Next.js charge normalement .env.local au démarrage. Le wrapper vient déjà
  // de construire et vérifier l'environnement P-1 complet : signaler à Next
  // qu'il est traité empêche toute lecture implicite d'un fichier local.
  childEnv.__NEXT_PROCESSED_ENV = "true";
  // Next 16 peut forcer une recharge malgré ce marqueur. Le preload fait
  // apparaître les .env conventionnels comme absents, sans toucher au fichier
  // local et sans empêcher l'environnement P-1 déjà injecté ci-dessus.
  childEnv.NODE_OPTIONS = `--require=${resolve("scripts/test-baseline/block-next-local-env.cjs")}`;
  // Bloc final · vérifier une dernière fois qu'aucune value ne contient
  // un ref forbidden (defense-in-depth contre une fuite de env parent).
  assertNoForbiddenSubstring(childEnv);

  const [bin, ...rest] = args.cmd;
  const res = spawnSync(bin, rest, {
    env: childEnv,
    stdio: "inherit",
  });
  if (res.error) fatal(`child spawn error: ${res.error.message}`);
  process.exit(res.status ?? 0);
}

main();
