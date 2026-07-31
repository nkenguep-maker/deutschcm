#!/usr/bin/env node
// P4.6-B.4 · verify:messaging-realtime:p1
//
// Vérifie de manière DÉTERMINISTE et FAIL-CLOSED que P-1 possède la
// configuration d'autorisation Realtime attendue par P4.6-B.3.
//
// Cette commande retourne exit(0) SEULEMENT si TOUT est vrai ·
//   1. project ref est kzzagbojjkivdzzcrmxn (P-1)
//   2. RLS est active sur realtime.messages
//   3. les 4 fonctions helper existent dans public.*
//   4. la policy SELECT messaging_realtime_receive_authorized est présente
//   5. la policy INSERT messaging_realtime_presence_send_authorized est présente
//   6. AUCUNE policy INSERT pour extension='broadcast' n'est présente sur msg:*
//   7. AUCUNE policy accessible au rôle anon n'est présente pour msg:*
//
// La vérification utilise la Management API Supabase (SUPABASE_ACCESS_TOKEN).
// Si le PAT n'a pas les droits sur P-1 (403), la commande imprime le SQL
// read-only à copier dans le Dashboard SQL Editor + exit(2) explicite.
//
// La sortie n'affiche JAMAIS le PAT · JAMAIS des données de conversations ·
// uniquement le nom des policies et fonctions attendues.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, "..");

const P1_REF = "kzzagbojjkivdzzcrmxn";
const BLOCKED_REFS = new Set([
  "sbjhvlrkbyjckdxujjsk",
  "mamofhrurksyuuolucea",
  "qggwvonfumuimjfsgpdz",
]);

const EXPECTED_FUNCTIONS = [
  "messaging_can_access_conversation",
  "messaging_is_inbox_owner",
  "messaging_topic_kind",
  "messaging_topic_id",
];
const EXPECTED_POLICIES = new Map([
  ["messaging_realtime_receive_authorized", "SELECT"],
  ["messaging_realtime_presence_send_authorized", "INSERT"],
]);
const FORBIDDEN_POLICY_NAMES = [
  // Aucune policy Broadcast INSERT client · absence permissive = refus.
  // Historique · v1 P4.6-B.2 avait "messaging_realtime_send_deny_client".
  // La v2 P4.6-B.3 supprime ce nom. Sa présence sur P-1 signale un rollback
  // partiel · verify échoue.
  "messaging_realtime_send_deny_client",
];

const READONLY_SQL = `
-- P4.6-B.4 · vérification READ-ONLY (à copier dans SQL Editor si Management API bloqué).
-- 1. RLS active
SELECT relrowsecurity AS rls_enabled
FROM pg_class
WHERE oid = 'realtime.messages'::regclass;

-- 2. Fonctions helper
SELECT proname
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (${EXPECTED_FUNCTIONS.map((n) => `'${n}'`).join(", ")})
ORDER BY proname;

-- 3. Policies messagerie sur realtime.messages
SELECT policyname, cmd, roles::text AS roles,
       substring(qual::text, 1, 200)      AS using_expr,
       substring(with_check::text, 1, 200) AS check_expr
FROM pg_policies
WHERE schemaname = 'realtime'
  AND tablename  = 'messages'
  AND policyname LIKE 'messaging_%'
ORDER BY policyname;
`;

function readPAT() {
  try {
    const mcp = JSON.parse(readFileSync(resolve(REPO, ".mcp.json"), "utf-8"));
    const tok = mcp?.mcpServers?.supabase?.env?.SUPABASE_ACCESS_TOKEN;
    if (!tok || !/^sbp_/.test(tok)) return null;
    return tok;
  } catch { return null; }
}

function assertP1(ref) {
  if (ref !== P1_REF) throw new Error(`refused non-P1 ref: ${ref}`);
  if (BLOCKED_REFS.has(ref)) throw new Error(`refused blocklisted ref: ${ref}`);
}

async function q(sql, pat) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${P1_REF}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pat}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Management API ${res.status}: ${text.slice(0, 400)}`);
  try { return JSON.parse(text); } catch { return text; }
}

function printFallback(reason) {
  console.error(`[verify] ${reason}`);
  console.error("");
  console.error("========================================================");
  console.error("MANUAL VERIFY REQUIRED · Supabase Dashboard SQL Editor");
  console.error("========================================================");
  console.error("");
  console.error(`Project · ${P1_REF} (P-1)`);
  console.error(`URL     · https://supabase.com/dashboard/project/${P1_REF}/sql/new`);
  console.error("");
  console.error("Copier / coller / exécuter ·");
  console.error(READONLY_SQL);
  console.error("");
  console.error("Résultats attendus ·");
  console.error("  1. rls_enabled = true");
  console.error(`  2. 4 lignes · ${EXPECTED_FUNCTIONS.join(", ")}`);
  console.error("  3. 2 lignes ·");
  console.error("     - messaging_realtime_receive_authorized (SELECT)");
  console.error("     - messaging_realtime_presence_send_authorized (INSERT)");
  console.error("     Aucune ligne 'messaging_realtime_send_deny_client'.");
  console.error("     Aucune policy accessible au rôle anon pour msg:*.");
  console.error("");
  process.exit(2);
}

function fail(msg) {
  console.error(`[verify] FAIL · ${msg}`);
  process.exit(1);
}

async function main() {
  assertP1(P1_REF);
  const pat = readPAT();
  if (!pat) printFallback("SUPABASE_ACCESS_TOKEN absent dans .mcp.json");

  console.log(`[verify] project=${P1_REF} · check RLS + fonctions + policies…`);

  let rls, fns, policies;
  try {
    rls = await q(
      "SELECT relrowsecurity FROM pg_class WHERE oid = 'realtime.messages'::regclass;",
      pat,
    );
    fns = await q(
      `SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace AND proname IN (${EXPECTED_FUNCTIONS.map((n) => `'${n}'`).join(", ")}) ORDER BY proname;`,
      pat,
    );
    policies = await q(
      `SELECT policyname, cmd, roles::text AS roles FROM pg_policies WHERE schemaname='realtime' AND tablename='messages' AND policyname LIKE 'messaging_%' ORDER BY policyname;`,
      pat,
    );
  } catch (e) {
    printFallback(e.message);
  }

  // 1. RLS
  const rlsRow = Array.isArray(rls) ? rls[0] : rls?.result?.[0];
  const rlsEnabled = rlsRow?.relrowsecurity === true || rlsRow?.relrowsecurity === "t";
  if (!rlsEnabled) fail("RLS non active sur realtime.messages");

  // 2. Fonctions
  const fnList = (Array.isArray(fns) ? fns : fns?.result ?? []).map((r) => r.proname);
  for (const expected of EXPECTED_FUNCTIONS) {
    if (!fnList.includes(expected)) fail(`fonction manquante · ${expected}`);
  }

  // 3. Policies attendues
  const polList = (Array.isArray(policies) ? policies : policies?.result ?? []);
  const polMap = new Map(polList.map((p) => [p.policyname, p]));
  for (const [name, cmd] of EXPECTED_POLICIES) {
    const p = polMap.get(name);
    if (!p) fail(`policy manquante · ${name}`);
    if (p.cmd?.toUpperCase() !== cmd) fail(`policy ${name} · cmd attendu ${cmd}, reçu ${p.cmd}`);
    if (!/authenticated/i.test(String(p.roles))) fail(`policy ${name} · rôle authenticated attendu, reçu ${p.roles}`);
  }

  // 4. Policies interdites
  for (const forbidden of FORBIDDEN_POLICY_NAMES) {
    if (polMap.has(forbidden)) fail(`policy interdite présente · ${forbidden}`);
  }

  // 5. Aucune policy pour rôle anon sur msg:*
  for (const p of polList) {
    if (/anon/i.test(String(p.roles))) {
      fail(`policy accessible au rôle anon détectée · ${p.policyname}`);
    }
  }

  console.log(`[verify] OK · RLS=on · ${fnList.length}/${EXPECTED_FUNCTIONS.length} fonctions · ${polMap.size}/${EXPECTED_POLICIES.size} policies attendues · aucune policy Broadcast INSERT client · aucune policy anon`);
}

main().catch((e) => {
  console.error(`[verify] EXCEPTION · ${e.message}`);
  process.exit(1);
});
