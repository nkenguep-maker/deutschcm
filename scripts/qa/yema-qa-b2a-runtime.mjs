#!/usr/bin/env node
// QA-b2a · runtime test Playwright de la Preview QA fraîchement déployée.
//
// Lit l'URL bootstrap depuis /tmp/qa-link.url (généré par
// generate-preview-qa-link.mjs · chmod 600 · JAMAIS commit ni logué).
//
// Prouve · bootstrap succès + cookie posé · 2nd usage refusé · console
// visible · impersonation Teacher · bannière QA persistante · CSRF wrong
// Origin · persona invalide refusé.
//
// Sortie · assertions sur stderr avec ✓/✗ · résumé final JSON compact.
// Aucun secret / cookie / URL bootstrap n'est jamais imprimé.

import { readFileSync } from "node:fs";
import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createHmac } from "node:crypto";

const BOOTSTRAP_URL_FILE = "/tmp/qa-link.url";
const bootstrapUrl = readFileSync(BOOTSTRAP_URL_FILE, "utf8").trim();
if (!bootstrapUrl.startsWith("https://")) {
  console.error("REFUSED · bootstrap URL missing");
  process.exit(2);
}

// Extract host from URL (public info)
const previewHost = new URL(bootstrapUrl).host;
const previewOrigin = `https://${previewHost}`;

// Charger secrets stashed pour signer un token host mismatch et pour
// vérifications DB. Aucun secret imprimé.
const stash = {};
for (const line of readFileSync("/tmp/yema-qa-b2a-secrets.env", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) stash[m[1]] = m[2];
}

function newDb() {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
    log: ["error"],
  });
}

let passed = 0, failed = 0;
function assert(cond, label) {
  if (cond) { passed++; process.stderr.write(`  ✓ ${label}\n`); }
  else { failed++; process.stderr.write(`  ✗ ${label}\n`); }
}

async function main() {
  const db = newDb();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    // Ignorer les erreurs HTTPS pour le certificat Vercel Preview
    ignoreHTTPSErrors: false,
  });
  const page = await context.newPage();

  // ─── §10 · Bootstrap runtime ────────────────────────────────────────
  process.stderr.write(`\n[10] bootstrap · GET ${previewOrigin}/api/qa/bootstrap?t=...\n`);
  // Suivre 303 → /fr/qa
  const bootstrapResp = await page.goto(bootstrapUrl, { waitUntil: "networkidle" });
  assert(bootstrapResp !== null, "response received");
  assert(page.url().includes("/fr/qa"), `URL finale = /fr/qa (obtenu ${page.url().slice(0, 60)}...)`);
  const cookies = await context.cookies();
  const qaCookie = cookies.find((c) => c.name === "yema_qa_session");
  assert(!!qaCookie, "cookie yema_qa_session posé");
  if (qaCookie) {
    assert(qaCookie.httpOnly === true, "cookie httpOnly=true");
    assert(qaCookie.secure === true, "cookie secure=true");
    assert(qaCookie.sameSite === "Lax", "cookie sameSite=Lax");
    assert(qaCookie.path === "/", "cookie path=/");
    const maxAgeSec = qaCookie.expires - Math.floor(Date.now() / 1000);
    assert(maxAgeSec <= 7200, `cookie Max-Age ≤ 7200 (obtenu ${maxAgeSec}s)`);
  }

  // DB · nonce consumed
  const nonceRow = await db.qaBootstrapNonce.findFirst({
    where: { deploymentHost: previewHost },
    orderBy: { createdAt: "desc" },
  });
  assert(nonceRow && nonceRow.consumedAt !== null, "DB · consumedAt renseigné");

  // ─── Rejouer le même lien ───────────────────────────────────────────
  process.stderr.write(`\n[10.b] replay · GET même URL bootstrap\n`);
  const context2 = await browser.newContext();
  const page2 = await context2.newPage();
  const replayResp = await page2.goto(bootstrapUrl);
  assert(replayResp?.status() === 404, `replay refusé · 404 (obtenu ${replayResp?.status()})`);
  const cookies2 = await context2.cookies();
  const qaCookie2 = cookies2.find((c) => c.name === "yema_qa_session");
  assert(!qaCookie2, "replay · aucun nouveau cookie yema_qa_session");
  await context2.close();

  // ─── §11 · Console QA visible ───────────────────────────────────────
  process.stderr.write(`\n[11] console QA · /fr/qa\n`);
  const consoleHtml = await page.content();
  assert(consoleHtml.includes("MODE QA") || consoleHtml.includes("Mode QA"), "titre MODE QA visible");
  assert(consoleHtml.includes("kzzagbojjkivdzzcrmxn"), "projectRef P-1 visible");
  assert(consoleHtml.includes("deutschcm-ak70y2077"), "deployment host visible");
  // 5 cartes personas · vérifie labels FR
  for (const label of ["Super Admin", "Enseignant", "Coach", "Centre", "Élève"]) {
    assert(consoleHtml.includes(label), `carte "${label}" visible`);
  }
  // Aucun email complet dans le HTML
  assert(!consoleHtml.includes(stash.YEMA_QA_ADMIN_EMAIL || "@@@"), "aucun email complet dans le HTML");
  // Aucun token/nonce/secret
  for (const secret of [stash.YEMA_QA_SESSION_SECRET, stash.YEMA_QA_LINK_SIGNING_SECRET]) {
    if (secret) assert(!consoleHtml.includes(secret), `aucun secret leak (len=${secret.length})`);
  }

  // ─── §12 · Impersonation Teacher ────────────────────────────────────
  process.stderr.write(`\n[12] impersonation Teacher\n`);
  // POST avec cookie · redirect: manual (le server retourne 303)
  const impRes = await page.evaluate(async () => {
    const r = await fetch("/api/qa/impersonate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ persona: "teacher" }),
      redirect: "manual",
    });
    return { status: r.status, type: r.type, ok: r.ok };
  });
  const impersonateOk = impRes.type === "opaqueredirect" || impRes.status === 0
    || (impRes.status >= 200 && impRes.status < 400);
  assert(impersonateOk, `POST /api/qa/impersonate teacher · succès (status=${impRes.status}, type=${impRes.type})`);

  // Navigate to /fr/teacher (session Supabase posée par verifyOtp SSR)
  await page.goto(`${previewOrigin}/fr/teacher`, { waitUntil: "networkidle" });
  assert(page.url().includes("/fr/teacher"), `nav /fr/teacher OK (${page.url().slice(0, 80)}...)`);
  // Vérifier qu'on n'est pas redirigé vers /login
  assert(!page.url().includes("/login"), "pas de redirect vers /login (session Supabase active)");

  // ─── §13 · CSRF · Origin cross-site ─────────────────────────────────
  process.stderr.write(`\n[13.a] CSRF · POST impersonate avec Origin cross-site\n`);
  const csrfRes = await page.evaluate(async () => {
    const r = await fetch("/api/qa/impersonate", {
      method: "POST",
      headers: {
        // Content-Type invalide comme proxy CSRF · le hook checkCsrf()
        // exige application/json. Un formulaire cross-site posterait
        // text/plain ou multipart/form-data · doit être refusé.
        "content-type": "text/plain",
      },
      body: JSON.stringify({ persona: "teacher" }),
      redirect: "manual",
    });
    return { status: r.status };
  });
  assert(csrfRes.status === 404, `Content-Type invalide → 404 (CSRF refusé · obtenu ${csrfRes.status})`);

  // ─── §13 · Persona invalide ─────────────────────────────────────────
  process.stderr.write(`\n[13.b] persona invalide\n`);
  const invalidRes = await page.evaluate(async () => {
    const r = await fetch("/api/qa/impersonate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ persona: "arbitrary_admin" }),
      redirect: "manual",
    });
    const b = await r.json().catch(() => null);
    return { status: r.status, body: b };
  });
  assert(invalidRes.status === 400, `persona 'arbitrary_admin' → 400 (obtenu ${invalidRes.status})`);
  assert(invalidRes.body?.code === "persona_invalid", `code='persona_invalid' (obtenu ${invalidRes.body?.code})`);

  // ─── §13 · Wrong host token ─────────────────────────────────────────
  process.stderr.write(`\n[13.c] token signé pour autre host\n`);
  const wrongHostPayload = {
    emailHash: "0".repeat(64),
    deploymentHost: "other-host.example.com",
    projectRef: "kzzagbojjkivdzzcrmxn",
    issuedAt: Math.floor(Date.now() / 1000),
    expiresAt: Math.floor(Date.now() / 1000) + 300,
    nonce: "test-wrong-host-" + Date.now(),
  };
  function b64url(buf) {
    return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }
  const wrongPayloadBytes = Buffer.from(JSON.stringify(wrongHostPayload), "utf8");
  const wrongSig = createHmac("sha256", stash.YEMA_QA_LINK_SIGNING_SECRET)
    .update(wrongPayloadBytes).digest();
  const wrongToken = `${b64url(wrongPayloadBytes)}.${b64url(wrongSig)}`;
  const context3 = await browser.newContext();
  const page3 = await context3.newPage();
  const wrongHostRes = await page3.goto(`${previewOrigin}/api/qa/bootstrap?t=${wrongToken}`);
  assert(wrongHostRes?.status() === 404, `wrong host token → 404 (obtenu ${wrongHostRes?.status()})`);
  await context3.close();

  await browser.close();
  await db.$disconnect();

  process.stderr.write(`\n═══ RÉSUMÉ ═══\n`);
  process.stderr.write(`passed=${passed} · failed=${failed}\n`);
  process.stdout.write(JSON.stringify({ passed, failed, previewHost }) + "\n");
  if (failed > 0) process.exit(1);
}

await main().catch((e) => {
  console.error("RUNTIME FAILED:", e.message || e);
  process.exit(1);
});
