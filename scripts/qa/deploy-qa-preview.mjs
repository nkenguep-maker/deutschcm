#!/usr/bin/env node
// QA-b2a · wrapper de déploiement Preview QA scoped.
//
// Génère localement les 2 secrets QA éphémères (session + link signing)
// via crypto.randomBytes, valide P-1 exclusif, spawn `vercel build` puis
// `vercel deploy --prebuilt --env KEY=VALUE ...` avec les variables QA
// injectées UNIQUEMENT dans ce déploiement (pas via `vercel env add`).
//
// Doctrine · aucun secret n'est jamais loggué en clair (stdout/stderr/
// argv). Les secrets restent en mémoire du process. Après deploy, les
// secrets sont écrits dans un fichier tmp `/tmp/yema-qa-b2a-secrets.env`
// UNIQUEMENT si `--stash-secrets` est passé (pour permettre la génération
// ultérieure du lien bootstrap avec la MÊME valeur de link secret).
// Ce fichier est chmod 600 et doit être supprimé par l'appelant.
//
// Sortie stdout · JSON compact avec `deploymentUrl` + `deploymentId` +
// `deploymentHost`. Rien d'autre.

import { readFileSync, writeFileSync, chmodSync } from "node:fs";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";

const P1_REF = "kzzagbojjkivdzzcrmxn";
const FORBIDDEN = ["sbjhvlrkbyjckdxujjsk", "mamofhrurksyuuolucea", "qggwvonfumuimjfsgpdz"];

function fatal(msg) {
  process.stderr.write(`[deploy-qa-preview] ${msg}\n`);
  process.exit(2);
}

function readDotEnv(path) {
  const out = {};
  try {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const m = line.trim().match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch { fatal(`missing ${path}`); }
  return out;
}

function assertRefIsP1(url, label) {
  if (!url) fatal(`${label} missing`);
  const m = url.match(/https:\/\/([a-z0-9]{20})\.supabase\.co/i);
  if (m) {
    const ref = m[1].toLowerCase();
    if (FORBIDDEN.includes(ref)) fatal(`REFUSED · ${label} contains forbidden ref ${ref}`);
    if (ref !== P1_REF) fatal(`REFUSED · ${label} ref ${ref} != P-1`);
    return ref;
  }
  const p = url.match(/postgres\.([a-z0-9]{20})/i);
  if (p) {
    const ref = p[1].toLowerCase();
    if (FORBIDDEN.includes(ref)) fatal(`REFUSED · ${label} contains forbidden ref ${ref}`);
    if (ref !== P1_REF) fatal(`REFUSED · ${label} ref ${ref} != P-1`);
    return ref;
  }
  fatal(`REFUSED · ${label} unrecognized format`);
}

const args = process.argv.slice(2);
const stashSecrets = args.includes("--stash-secrets");
const skipBuild = args.includes("--skip-build");

// Load P-1 env
const dot = readDotEnv(".env.p1-baseline");
for (const k of ["NEXT_PUBLIC_SUPABASE_URL", "DIRECT_URL"]) {
  assertRefIsP1(dot[k], k);
}
if (!dot.NEXT_PUBLIC_SUPABASE_ANON_KEY || !dot.SUPABASE_SERVICE_ROLE_KEY) {
  fatal("P-1 keys missing");
}
if (!dot.P1_BASELINE_CONFIRMED_NOT_PRODUCTION) fatal("P1_BASELINE_CONFIRMED_NOT_PRODUCTION missing");

// Génération secrets QA · 32 octets base64url (~43 chars, > 32 min)
const sessionSecret = randomBytes(32).toString("base64url");
const linkSecret = randomBytes(32).toString("base64url");

const adminEmail = process.env.YEMA_QA_ADMIN_EMAIL || "";
if (!adminEmail || !adminEmail.includes("@")) {
  fatal("YEMA_QA_ADMIN_EMAIL missing or invalid · set via env before running wrapper");
}

// Env vars pour build + runtime · combinées P-1 + QA + flags métier.
// Ne PAS logger cet objet.
const qaEnv = {
  // P-1 (Supabase)
  NEXT_PUBLIC_SUPABASE_URL: dot.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: dot.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: dot.SUPABASE_SERVICE_ROLE_KEY,
  DATABASE_URL: dot.DATABASE_URL,
  DIRECT_URL: dot.DIRECT_URL,
  // QA config
  YEMA_QA_MODE_ENABLED: "true",
  YEMA_QA_ADMIN_EMAIL: adminEmail,
  YEMA_QA_SESSION_SECRET: sessionSecret,
  YEMA_QA_LINK_SIGNING_SECRET: linkSecret,
  YEMA_QA_SESSION_TTL_MINUTES: "120",
  YEMA_QA_ALLOWED_PROJECT_REF: P1_REF,
  YEMA_QA_ALLOW_LOCAL: "false",
  // Business flags · QA Preview teste les espaces validés
  YEMA_ASSIGNMENTS_ENABLED: "true",
  YEMA_TEACHER_WORKSPACE_ENABLED: "true",
  YEMA_TEACHER_RLS_CONFIRMED: "true",
  YEMA_RACINES_COACH_OPERATIONAL: "true",
  YEMA_COACH_WORKSPACE_ENABLED: "true",
  YEMA_AUDIO_FEEDBACK_ENABLED: "false",
};

// Env pour le build/deploy · hérité PATH/HOME/USER + qaEnv (aucun leak).
const passthrough = ["PATH", "HOME", "USER", "SHELL", "LANG", "LC_ALL", "TZ", "TMPDIR", "NODE_ENV"];
const childEnv = {};
for (const k of passthrough) if (process.env[k]) childEnv[k] = process.env[k];
Object.assign(childEnv, qaEnv);

// Utility · spawn sans logger les args (les args peuvent contenir des
// valeurs sensibles quand on passe --env KEY=VALUE).
function spawnSafe(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const c = spawn(cmd, args, { ...opts, env: childEnv, shell: false });
    let stdout = "", stderr = "";
    c.stdout.on("data", (d) => { stdout += d.toString(); process.stderr.write(d); });
    c.stderr.on("data", (d) => { stderr += d.toString(); process.stderr.write(d); });
    c.on("error", reject);
    c.on("close", (code) => {
      if (code !== 0) return reject(new Error(`${cmd} exited ${code}`));
      resolve({ stdout, stderr });
    });
  });
}

async function main() {
  process.stderr.write(`[deploy-qa-preview] P-1 verified · projectRef=${P1_REF}\n`);
  process.stderr.write(`[deploy-qa-preview] admin email = <${adminEmail.length} chars>\n`);
  process.stderr.write(`[deploy-qa-preview] secrets generated (session=${sessionSecret.length} chars, link=${linkSecret.length} chars) · never logged\n`);

  if (!skipBuild) {
    process.stderr.write("[deploy-qa-preview] vercel build starting...\n");
    await spawnSafe("npx", ["--yes", "vercel@latest", "build"]);
  }

  process.stderr.write("[deploy-qa-preview] vercel deploy --prebuilt starting...\n");
  // Deploy scoped · aucune option --prod. Chaque --env KEY=VALUE injecte
  // la variable dans le runtime de ce déploiement uniquement.
  const deployArgs = ["--yes", "vercel@latest", "deploy", "--prebuilt"];
  for (const [k, v] of Object.entries(qaEnv)) {
    // Format `--env KEY=VALUE` · le CLI parse la valeur brute.
    deployArgs.push("--env", `${k}=${v}`);
  }
  // Aussi côté build (au cas où le build en cours réutilise l'env)
  for (const [k, v] of Object.entries(qaEnv)) {
    deployArgs.push("--build-env", `${k}=${v}`);
  }

  const deployResult = await spawnSafe("npx", deployArgs);

  // Parse URL sur stdout+stderr · Vercel CLI écrit le Preview URL sur
  // stderr en mode compact.
  const combined = deployResult.stdout + "\n" + deployResult.stderr;
  const urlMatch = combined.match(/https:\/\/(deutschcm-[a-z0-9-]+\.vercel\.app)/);
  if (!urlMatch) fatal("could not parse deployment URL from vercel output");
  const deploymentUrl = `https://${urlMatch[1]}`;
  const deploymentHost = urlMatch[1];

  // Deployment ID · récupéré via API par host (le CLI compact ne l'expose pas).
  let deploymentId = "";
  const inspectMatch = combined.match(/(dpl_[A-Za-z0-9]+)/);
  if (inspectMatch) {
    deploymentId = inspectMatch[1];
  } else {
    // Fallback API · lookup by URL.
    try {
      const { readFileSync } = await import("node:fs");
      const { join } = await import("node:path");
      const { homedir } = await import("node:os");
      const auth = JSON.parse(readFileSync(join(homedir(), "Library", "Application Support", "com.vercel.cli", "auth.json"), "utf8"));
      const r = await fetch(`https://api.vercel.com/v13/deployments/${deploymentHost}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      const j = await r.json();
      deploymentId = j.id || "";
    } catch { /* silent · deploymentId reste vide */ }
  }

  if (stashSecrets) {
    // Écrire les secrets dans un fichier chmod 600 pour permettre à la
    // génération de lien bootstrap ultérieure d'utiliser le MÊME
    // linkSecret. L'appelant doit supprimer ce fichier immédiatement
    // après usage.
    const stashPath = "/tmp/yema-qa-b2a-secrets.env";
    const content = [
      `YEMA_QA_ADMIN_EMAIL=${adminEmail}`,
      `YEMA_QA_SESSION_SECRET=${sessionSecret}`,
      `YEMA_QA_LINK_SIGNING_SECRET=${linkSecret}`,
      `YEMA_QA_PREVIEW_HOST=${deploymentHost}`,
      `YEMA_QA_DEPLOYMENT_ID=${deploymentId}`,
    ].join("\n") + "\n";
    writeFileSync(stashPath, content, { encoding: "utf8" });
    chmodSync(stashPath, 0o600);
    process.stderr.write(`[deploy-qa-preview] secrets stashed to ${stashPath} (chmod 600) · CALLER MUST DELETE\n`);
  }

  // Sortie stdout · JSON compact avec URL/ID/host uniquement.
  process.stdout.write(JSON.stringify({ deploymentUrl, deploymentHost, deploymentId }) + "\n");
}

await main();
