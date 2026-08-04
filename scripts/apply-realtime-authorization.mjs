#!/usr/bin/env node
// P4.6-B.2 / P4.6-B.3 · runbook d'application des policies realtime.messages
// sur Supabase P-1 (kzzagbojjkivdzzcrmxn).
//
// Ce script tente d'appliquer via la Management API. Si le PAT en
// .mcp.json n'a pas les droits sur P-1 (403 attendu quand le PAT est lié
// à un autre org), l'opérateur DOIT appliquer manuellement le SQL via le
// Supabase Dashboard SQL Editor.
//
// SÉCURITÉ · refuse toute ref !== P-1 · blocklist explicite Production +
// staging historiques. Aucun secret loggé (PAT masqué).
//
// USAGE ·
//   node scripts/apply-realtime-authorization.mjs            # apply
//   node scripts/apply-realtime-authorization.mjs --verify   # read-only
//   node scripts/apply-realtime-authorization.mjs --print    # dump SQL

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, "..");

const P1_REF = "kzzagbojjkivdzzcrmxn";
const BLOCKED_REFS = new Set([
  "sbjhvlrkbyjckdxujjsk",     // Production
  "mamofhrurksyuuolucea",     // Historique
  "qggwvonfumuimjfsgpdz",     // Historique
]);

const MIGRATION_PATH = resolve(
  REPO,
  "prisma/migrations/20260731000003_p4_6_b_2_realtime_authorization/migration.sql",
);

const VERIFY_SQL = `
-- P4.6-B.3 · vérification READ-ONLY des policies attendues.
SELECT
  policyname,
  cmd,
  roles::text AS roles,
  substring(qual::text, 1, 120)      AS using_expr_head,
  substring(with_check::text, 1, 120) AS check_expr_head
FROM pg_policies
WHERE schemaname = 'realtime'
  AND tablename  = 'messages'
  AND policyname LIKE 'messaging_%'
ORDER BY policyname;

SELECT relrowsecurity AS rls_enabled
FROM pg_class
WHERE oid = 'realtime.messages'::regclass;

-- Fonctions helper doivent exister ·
SELECT proname
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'messaging_can_access_conversation',
    'messaging_is_inbox_owner',
    'messaging_topic_kind',
    'messaging_topic_id'
  )
ORDER BY proname;
`;

function readPAT() {
  const mcp = JSON.parse(readFileSync(resolve(REPO, ".mcp.json"), "utf-8"));
  const tok = mcp?.mcpServers?.supabase?.env?.SUPABASE_ACCESS_TOKEN;
  if (!tok || !/^sbp_/.test(tok)) {
    throw new Error("SUPABASE_ACCESS_TOKEN missing in .mcp.json (expected sbp_*)");
  }
  return tok;
}

function assertP1(ref) {
  if (ref !== P1_REF) throw new Error(`refused non-P1 ref: ${ref}`);
  if (BLOCKED_REFS.has(ref)) throw new Error(`refused blocklisted ref: ${ref}`);
}

async function callManagementApi(sql, ref) {
  assertP1(ref);
  const pat = readPAT();
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pat}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Management API ${res.status}: ${text.slice(0, 400)}`);
  }
  return text;
}

function printDashboardRunbook(sql) {
  console.log("");
  console.log("========================================================");
  console.log("MANUAL APPLY REQUIRED · Supabase Dashboard SQL Editor");
  console.log("========================================================");
  console.log("");
  console.log(`Project · ${P1_REF} (P-1)`);
  console.log(`URL     · https://supabase.com/dashboard/project/${P1_REF}/sql/new`);
  console.log("");
  console.log("Étapes ·");
  console.log("  1. Confirmer visuellement le project ref dans l'URL");
  console.log("  2. Vérifier que ce n'est pas Production ni ref blocklistée");
  console.log("  3. Coller le contenu de :");
  console.log(`     ${MIGRATION_PATH}`);
  console.log("  4. Exécuter · attendu · aucune erreur, 4 fonctions + 2 policies");
  console.log("  5. Relancer ce script en mode --verify pour valider");
  console.log("");
  if (process.env.YEMA_PRINT_SQL === "1") {
    console.log("--- SQL ---");
    console.log(sql);
  } else {
    console.log("(SQL masqué · relancer avec YEMA_PRINT_SQL=1 pour l'afficher)");
  }
}

async function main() {
  const args = process.argv.slice(2);
  const mode = args.includes("--verify") ? "verify"
    : args.includes("--print") ? "print"
    : "apply";

  const sql = readFileSync(MIGRATION_PATH, "utf-8");

  if (mode === "print") {
    console.log(sql);
    return;
  }

  if (mode === "verify") {
    console.log(`P4.6-B.3 · verify policies on P-1 (${P1_REF}) · read-only…`);
    try {
      const out = await callManagementApi(VERIFY_SQL, P1_REF);
      console.log(out);
    } catch (e) {
      console.error("VERIFY FAIL ·", e.message);
      console.log("");
      console.log("Fallback · exécuter dans le SQL Editor Supabase Dashboard :");
      console.log(VERIFY_SQL);
      process.exit(2);
    }
    return;
  }

  console.log(`P4.6-B.3 · applying migration on P-1 (${P1_REF}) via Management API…`);
  try {
    const out = await callManagementApi(sql, P1_REF);
    console.log("OK ·", out.slice(0, 200));
  } catch (e) {
    console.error("APPLY FAIL ·", e.message);
    printDashboardRunbook(sql);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("FAIL ·", e.message);
  process.exit(1);
});
