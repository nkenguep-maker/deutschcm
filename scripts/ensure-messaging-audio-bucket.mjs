#!/usr/bin/env node
// P4.6-C.1 · ensure bucket yema-messaging-audio-private sur P-1.
//
// Contrat ·
//   - P-1 UNIQUEMENT (kzzagbojjkivdzzcrmxn)
//   - refuse les 3 refs blocklistées
//   - private = true
//   - MIME whitelist : audio/webm, audio/ogg, audio/mp4, audio/mpeg, audio/wav
//   - fileSizeLimit = 8 MiB
//   - idempotent (get puis create)
//   - aucun log de secret

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, "..");

const P1_REF = "kzzagbojjkivdzzcrmxn";
const BLOCKED = new Set([
  "sbjhvlrkbyjckdxujjsk",
  "mamofhrurksyuuolucea",
  "qggwvonfumuimjfsgpdz",
]);

const BUCKET = "yema-messaging-audio-private";
const MIMES = ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/wav"];
const FILE_SIZE_LIMIT = 8 * 1024 * 1024;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url) { console.error("MISSING NEXT_PUBLIC_SUPABASE_URL"); process.exit(2); }
if (!svc) { console.error("MISSING SUPABASE_SERVICE_ROLE_KEY"); process.exit(2); }
if (!url.includes(P1_REF)) { console.error(`REFUSED · non-P1 · ${url}`); process.exit(2); }
for (const b of BLOCKED) if (url.includes(b)) { console.error(`REFUSED · blocklisted ref ${b}`); process.exit(2); }

const sb = createClient(url, svc, { auth: { persistSession: false, autoRefreshToken: false } });

async function main() {
  console.log(`[ensure-bucket] project=${P1_REF} bucket=${BUCKET}`);
  const list = await sb.storage.listBuckets();
  if (list.error) throw new Error(`listBuckets · ${list.error.message}`);
  const existing = (list.data ?? []).find((b) => b.name === BUCKET);

  if (!existing) {
    const create = await sb.storage.createBucket(BUCKET, {
      public: false,
      allowedMimeTypes: MIMES,
      fileSizeLimit: FILE_SIZE_LIMIT,
    });
    if (create.error) {
      // Storage API can refuse via 403 · fallback SQL Editor runbook.
      console.error(`createBucket · ${create.error.message}`);
      printFallbackSql();
      process.exit(1);
    }
    console.log(`[ensure-bucket] created · public=false · mimes=${MIMES.length} · maxBytes=${FILE_SIZE_LIMIT}`);
    return;
  }

  // Idempotent · update permet d'aligner en cas de drift.
  if (existing.public !== false) {
    console.log(`[ensure-bucket] WARN · existing bucket is public · attempting to make private`);
    const upd = await sb.storage.updateBucket(BUCKET, { public: false });
    if (upd.error) {
      console.error(`updateBucket · ${upd.error.message}`);
      printFallbackSql();
      process.exit(1);
    }
  }
  console.log(`[ensure-bucket] OK · bucket exists · public=${existing.public}`);
}

function printFallbackSql() {
  const sqlPath = resolve(REPO, "scripts/sql/p4-6-c-audio-storage-p1.sql");
  try {
    const sql = readFileSync(sqlPath, "utf-8");
    console.error("");
    console.error("========================================================");
    console.error("MANUAL APPLY REQUIRED · Supabase Dashboard SQL Editor");
    console.error("========================================================");
    console.error("");
    console.error(`Project · ${P1_REF} (P-1)`);
    console.error(`URL     · https://supabase.com/dashboard/project/${P1_REF}/sql/new`);
    console.error("");
    console.error("Copier / coller / exécuter ·");
    console.error(sql);
  } catch {
    console.error(`Fallback SQL file introuvable · ${sqlPath}`);
  }
}

main().catch((e) => {
  console.error(`FAIL · ${e.message}`);
  printFallbackSql();
  process.exit(1);
});
