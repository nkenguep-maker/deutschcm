#!/usr/bin/env node
// P4.6-B.2 · applique la migration realtime.messages via Supabase
// Management API (runs as supabase_admin, ce que le rôle postgres du
// pooler ne peut pas faire).
//
// Sécurité · refuse toute ref autre que P-1 (kzzagbojjkivdzzcrmxn).
// PAT lu depuis .mcp.json (déjà en place · read-only mais Management API
// utilise WRITE via DB query endpoint).

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

function readPAT() {
  const mcp = JSON.parse(readFileSync(resolve(REPO, ".mcp.json"), "utf-8"));
  const tok = mcp?.mcpServers?.supabase?.env?.SUPABASE_ACCESS_TOKEN;
  if (!tok || !/^sbp_/.test(tok)) throw new Error("SUPABASE_ACCESS_TOKEN missing in .mcp.json");
  return tok;
}

async function applySql(sql, ref) {
  if (ref !== P1_REF || BLOCKED_REFS.has(ref)) {
    throw new Error(`refused non-P1 ref: ${ref}`);
  }
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
    throw new Error(`Management API ${res.status}: ${text}`);
  }
  return text;
}

async function main() {
  const migrationPath = resolve(
    REPO,
    "prisma/migrations/20260731000003_p4_6_b_2_realtime_authorization/migration.sql",
  );
  const sql = readFileSync(migrationPath, "utf-8");
  console.log(`P4.6-B.2 · applying migration on P-1 (${P1_REF}) via Management API…`);
  const out = await applySql(sql, P1_REF);
  console.log("OK ·", out.slice(0, 200));
}

main().catch((e) => {
  console.error("FAIL ·", e.message);
  process.exit(1);
});
