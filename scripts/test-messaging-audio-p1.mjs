#!/usr/bin/env node
// P4.6-C.1 · npm run test:messaging-audio:p1
//
// NON-SKIPPABLE · échoue si ·
//   - E2E_TEACHER/STUDENT/OUTSIDER credentials absents
//   - bucket absent
//   - service_role absent
//   - project ref !== P-1
//
// Actions ·
//   1. vérifie env + wrapper
//   2. génère un fixture WAV valide en mémoire (1 sec, mono, 8kHz)
//   3. utilise les credentials E2E existants (orchestrator provisioning)
//   4. upload Teacher → t_em_en (attend 201)
//   5. playback Teacher → 200 + URL signée
//   6. playback Student → 200 (participant actif)
//   7. playback Outsider → 403/404
//   8. supprime asset via cleanup dry-run (compteurs)

import { spawnSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const P1_REF = "kzzagbojjkivdzzcrmxn";
const REQUIRED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DIRECT_URL",
  "E2E_TEACHER_EMAIL", "E2E_TEACHER_PASSWORD",
  "E2E_STUDENT_EMAIL", "E2E_STUDENT_PASSWORD",
  "E2E_OUTSIDER_EMAIL", "E2E_OUTSIDER_PASSWORD",
];

function fail(msg, code = 2) {
  console.error(`[test:messaging-audio:p1] ${msg}`);
  process.exit(code);
}

const missing = REQUIRED.filter((k) => !process.env[k]);
if (missing.length > 0) fail(`MISSING · ${missing.join(", ")} · NON-SKIPPABLE`);
if (!process.env.NEXT_PUBLIC_SUPABASE_URL.includes(P1_REF)) fail(`URL non-P1 · ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
if (!process.env.DIRECT_URL.includes(P1_REF)) fail("DIRECT_URL non-P1");

// 1. Ensure bucket.
const ensure = spawnSync("node", ["scripts/ensure-messaging-audio-bucket.mjs"], { stdio: "inherit", env: process.env });
if (ensure.status !== 0) fail("bucket non prêt", ensure.status ?? 1);

// 2. Génère un fixture WAV minimal (44 bytes header + PCM silence 1s @8kHz mono).
function makeWav(sampleRate = 8000, seconds = 1) {
  const numSamples = sampleRate * seconds;
  const dataSize = numSamples * 2; // 16-bit
  const buf = Buffer.alloc(44 + dataSize);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(dataSize, 40);
  return buf;
}

// 3. Auth · login teacher/student/outsider via Supabase Auth signInWithPassword.
async function signIn(email, password) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anon) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY missing");
  const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anon, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`signIn ${res.status}`);
  return await res.json();
}

// Construit le cookie Supabase SSR format · sb-<ref>-auth-token=base64-<JSON(session)>
function buildAuthCookie(session) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const ref = new URL(url).host.split(".")[0];
  // @supabase/ssr encode la session sous forme base64-<json>. Voir
  // https://github.com/supabase/auth-js · Session serialization.
  const payload = {
    access_token: session.access_token,
    token_type: session.token_type,
    expires_in: session.expires_in,
    expires_at: session.expires_at ?? (Math.floor(Date.now() / 1000) + session.expires_in),
    refresh_token: session.refresh_token,
    user: session.user,
  };
  const encoded = "base64-" + Buffer.from(JSON.stringify(payload)).toString("base64");
  return `sb-${ref}-auth-token=${encoded}`;
}

const BASE = process.env.YEMA_TEST_BASE_URL ?? "http://127.0.0.1:3140";
const HOST = new URL(BASE).host;

async function apiPost(path, session, opts = {}) {
  const cookie = buildAuthCookie(session);
  const headers = { Cookie: cookie, Origin: `http://${HOST}`, Host: HOST };
  if (opts.jsonBody) headers["Content-Type"] = "application/json";
  return fetch(`${BASE}${path}`, {
    method: "POST",
    headers,
    body: opts.body ?? (opts.jsonBody ? JSON.stringify(opts.jsonBody) : undefined),
  });
}

// 4-7. La commande orchestrateur lance next start + fixtures, puis ce script
// exécute le scénario. Voir orchestrate-audio-e2e.mjs. Ici on assume que le
// serveur tourne à BASE avec fixtures baked.

async function findConversationId() {
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }) });
  try {
    const c = await db.messagingConversation.findFirst({
      where: { id: "test_yema_qa_t_em_en" },
      select: { id: true },
    });
    if (!c) throw new Error("t_em_en absent · relancer messaging-fixtures");
    return c.id;
  } finally { await db.$disconnect(); }
}

async function main() {
  const conversationId = await findConversationId();
  console.log(`[test] conv=${conversationId}`);

  const [teacherSess, studentSess, outsiderSess] = await Promise.all([
    signIn(process.env.E2E_TEACHER_EMAIL, process.env.E2E_TEACHER_PASSWORD),
    signIn(process.env.E2E_STUDENT_EMAIL, process.env.E2E_STUDENT_PASSWORD),
    signIn(process.env.E2E_OUTSIDER_EMAIL, process.env.E2E_OUTSIDER_PASSWORD),
  ]);
  console.log("[test] 3 sessions Supabase obtenues");

  const wav = makeWav(8000, 1);
  const form = new FormData();
  form.set("file", new Blob([wav], { type: "audio/wav" }), "test.wav");
  form.set("clientMessageId", `audit-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
  const uploadRes = await apiPost(`/api/messaging/conversations/${conversationId}/audio`, teacherSess, { body: form });
  const uploadBody = await uploadRes.text();
  if (uploadRes.status !== 201) fail(`upload attendu 201 · reçu ${uploadRes.status} · ${uploadBody.slice(0, 200)}`, 1);
  const upload = JSON.parse(uploadBody);
  const assetId = upload.message.audio.assetId;
  console.log(`[test] upload OK · assetId=${assetId.slice(0,6)}*** · duration=${upload.message.audio.durationMs}ms · size=${upload.message.audio.byteSize}B`);

  const teacherPlay = await apiPost(`/api/messaging/audio/${assetId}/playback`, teacherSess, { jsonBody: {} });
  if (teacherPlay.status !== 200) fail(`teacher playback attendu 200 · reçu ${teacherPlay.status}`, 1);
  const teacherPlayBody = await teacherPlay.json();
  if (!teacherPlayBody.url || !teacherPlayBody.expiresAt) fail(`teacher playback missing url/expiresAt`, 1);
  const ttlSec = (new Date(teacherPlayBody.expiresAt).getTime() - Date.now()) / 1000;
  if (ttlSec > 305) fail(`TTL >305s reçu · ${ttlSec}`, 1);
  console.log(`[test] teacher playback OK · TTL=${Math.round(ttlSec)}s`);

  const studentPlay = await apiPost(`/api/messaging/audio/${assetId}/playback`, studentSess, { jsonBody: {} });
  if (studentPlay.status !== 200) fail(`student playback attendu 200 · reçu ${studentPlay.status}`, 1);
  console.log("[test] student playback OK");

  const outsiderPlay = await apiPost(`/api/messaging/audio/${assetId}/playback`, outsiderSess, { jsonBody: {} });
  if (outsiderPlay.status !== 403 && outsiderPlay.status !== 404) {
    fail(`outsider playback attendu 403/404 · reçu ${outsiderPlay.status}`, 1);
  }
  console.log(`[test] outsider playback refusé · status=${outsiderPlay.status}`);

  // Cleanup dry-run · aucune mutation.
  const cleanupDry = spawnSync("node", ["scripts/cleanup-messaging-audio.mjs", "--dry-run"], { stdio: "inherit", env: process.env });
  if (cleanupDry.status !== 0) fail("cleanup dry-run KO", 1);

  // P4.6-C.1.1 · cycle purge complet · storage-first vérifié end-to-end.
  //
  //   1. force expiresAt=past sur NOTRE asset dédié (DB direct)
  //   2. run cleanup --apply --target-asset <id> (isole notre asset)
  //   3. confirme · exit 0 · DB status=DELETED · storage object absent
  //   4. re-run --apply --target-asset · idempotent · scanned=0 ou alreadyDeleted=1
  console.log(`[test] purge cycle · force expiresAt · asset=${assetId.slice(0,6)}***`);
  const dbPurge = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }) });
  const sbPurge = (await import("@supabase/supabase-js")).createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  try {
    // 1. Force expiration.
    await dbPurge.messagingAudioAsset.update({
      where: { id: assetId },
      data: { expiresAt: new Date(Date.now() - 60 * 1000) },
    });

    // 2. Run apply targeted.
    const apply = spawnSync("node", [
      "scripts/cleanup-messaging-audio.mjs",
      "--apply",
      "--target-asset", assetId,
    ], { stdio: "inherit", env: process.env });
    if (apply.status !== 0) fail(`cleanup --apply exit ${apply.status}`, 1);

    // 3. DB status=DELETED · storageKey=null.
    const after = await dbPurge.messagingAudioAsset.findUnique({
      where: { id: assetId },
      select: { status: true, deletedAt: true, storageKey: true },
    });
    if (!after) fail("asset disparu de DB", 1);
    if (after.status !== "DELETED") fail(`DB status attendu DELETED · reçu ${after.status}`, 1);
    if (after.deletedAt === null) fail("deletedAt attendu non-null", 1);
    if (after.storageKey !== null) fail("storageKey attendu null après purge", 1);
    console.log("[test] purge · DB status=DELETED · deletedAt posé · storageKey null");

    // Storage object absent (double-check via list).
    const listAfter = await sbPurge.storage.from("yema-messaging-audio-private").list(`v1/${conversationId}`);
    const stillThere = (listAfter.data ?? []).some((o) => o.name?.startsWith(assetId));
    if (stillThere) fail("objet Storage encore présent après purge", 1);
    console.log("[test] purge · Storage object confirmé absent");

    // 4. Re-run idempotent · doit sortir 0 · asset déjà DELETED.
    const applyAgain = spawnSync("node", [
      "scripts/cleanup-messaging-audio.mjs",
      "--apply",
      "--target-asset", assetId,
    ], { stdio: "inherit", env: process.env });
    if (applyAgain.status !== 0) fail(`cleanup --apply retry exit ${applyAgain.status}`, 1);
    console.log("[test] purge · retry idempotent OK");
  } finally {
    await dbPurge.$disconnect();
  }

  console.log("[test:messaging-audio:p1] ALL OK");
}

main().catch((e) => fail(e.message, 1));
