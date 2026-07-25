#!/usr/bin/env node
// P4.5-QA · générateur de lien QA signé à usage unique.
//
// Usage · pour une Preview donnée, produire un URL de bootstrap
//   https://<preview-host>/api/qa/bootstrap?t=<signed-token>
// valable 10 minutes maximum, à envoyer via un canal privé au propriétaire
// QA.
//
// Le token contient · email hash + host + expiration + nonce + projectRef.
// Il est signé HMAC-SHA256 avec `YEMA_QA_LINK_SIGNING_SECRET` (server-only,
// jamais NEXT_PUBLIC_*).
//
// Prérequis · lancer via le wrapper P-1 pour avoir les vars adéquates ·
//   node scripts/test-baseline/run-p4-5-b2-p1.mjs --flag on -- \
//     node scripts/qa/generate-preview-qa-link.mjs --host <preview-host>
//
// Aucun secret n'est loggué · seul l'URL final (qui contient le token) est
// imprimé sur stdout. Ne JAMAIS le committer ou le partager en public.

import { createHmac, randomBytes, createHash } from "node:crypto";

const args = process.argv.slice(2);
function argOf(name, dflt) {
  const i = args.findIndex((a) => a === `--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
}

const host = argOf("host", process.env.YEMA_QA_PREVIEW_HOST);
if (!host) {
  console.error("REFUSED · --host <preview-host> requis (ou YEMA_QA_PREVIEW_HOST env var)");
  process.exit(2);
}
const ttlMinutes = Math.min(10, Number.parseInt(argOf("ttl", "10"), 10) || 10);

const P1_REF = "kzzagbojjkivdzzcrmxn";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const refMatch = supabaseUrl.match(/https:\/\/([a-z0-9]{20})\.supabase\.co/i);
const currentRef = refMatch ? refMatch[1].toLowerCase() : null;
if (currentRef !== P1_REF) {
  console.error(`REFUSED · project ref ${currentRef || "unknown"} != P-1 (${P1_REF})`);
  process.exit(2);
}

const adminEmail = process.env.YEMA_QA_ADMIN_EMAIL || "";
if (!adminEmail || !adminEmail.includes("@")) {
  console.error("REFUSED · YEMA_QA_ADMIN_EMAIL missing or invalid");
  process.exit(2);
}

const linkSecret = process.env.YEMA_QA_LINK_SIGNING_SECRET || "";
if (linkSecret.length < 32) {
  console.error("REFUSED · YEMA_QA_LINK_SIGNING_SECRET missing or too short (< 32)");
  process.exit(2);
}

// Payload
const now = Math.floor(Date.now() / 1000);
const emailHash = createHash("sha256")
  .update(`${adminEmail.trim().toLowerCase()}:${P1_REF}`)
  .digest("hex").slice(0, 32);
const payload = {
  emailHash,
  deploymentHost: host,
  projectRef: P1_REF,
  issuedAt: now,
  expiresAt: now + ttlMinutes * 60,
  nonce: randomBytes(16).toString("hex"),
};

function b64url(buf) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
const payloadBytes = Buffer.from(JSON.stringify(payload), "utf8");
const sig = createHmac("sha256", linkSecret).update(payloadBytes).digest();
const token = `${b64url(payloadBytes)}.${b64url(sig)}`;
const url = `https://${host}/api/qa/bootstrap?t=${token}`;

// Stdout · URL uniquement (à copier une fois, jamais logger ni committer).
process.stdout.write(`${url}\n`);
process.stderr.write(`ttlMinutes=${ttlMinutes} host=${host} projectRef=${P1_REF} · valid for ${ttlMinutes} minutes\n`);
