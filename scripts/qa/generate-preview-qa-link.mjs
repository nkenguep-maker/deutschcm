#!/usr/bin/env node
// QA-b1 Gate · générateur de lien QA signé à usage unique.
//
// Séquence · valider env → générer nonce cryptographiquement sûr →
// hasher (SHA-256) → INSERT dans `qa_bootstrap_nonces` AVANT la signature
// → signer le payload HMAC-SHA256 → imprimer l'URL sur stdout uniquement.
//
// Aucun secret n'est loggué · seul l'URL final (qui contient le token
// signé) est imprimé sur stdout · à copier une fois et à envoyer via un
// canal privé. Ne JAMAIS committer ou partager en public.
//
// Prérequis · lancer via le wrapper P-1 pour avoir les vars adéquates ·
//   node scripts/test-baseline/run-p4-5-b2-p1.mjs --flag on -- \
//     YEMA_QA_ADMIN_EMAIL=... YEMA_QA_LINK_SIGNING_SECRET=... \
//     node scripts/qa/generate-preview-qa-link.mjs --host <preview-host>

import { createHmac, randomBytes, createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const args = process.argv.slice(2);
function argOf(name, dflt) {
  const i = args.findIndex((a) => a === `--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
}

function normalizeHost(input) {
  if (!input) return "";
  let s = String(input).trim().toLowerCase();
  s = s.replace(/^https?:\/\//, "");
  s = s.split("?")[0].split("#")[0];
  s = s.replace(/\/+$/, "");
  s = s.replace(/:(?:80|443)$/, "");
  return s;
}

const hostRaw = argOf("host", process.env.YEMA_QA_PREVIEW_HOST);
if (!hostRaw) {
  console.error("REFUSED · --host <preview-host> requis (ou YEMA_QA_PREVIEW_HOST env var)");
  process.exit(2);
}
const host = normalizeHost(hostRaw);
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

const now = Math.floor(Date.now() / 1000);
const nonce = randomBytes(32).toString("hex");
const nonceHash = createHash("sha256").update(nonce).digest("hex");
const emailHash = createHash("sha256")
  .update(`${adminEmail.trim().toLowerCase()}:${P1_REF}`)
  .digest("hex").slice(0, 32);

const payload = {
  emailHash,
  deploymentHost: host,
  projectRef: P1_REF,
  issuedAt: now,
  expiresAt: now + ttlMinutes * 60,
  nonce,
};

// INSERT dans la DB AVANT signature · la row doit exister avant que le
// token ne puisse être consommé. Le nonce brut ne quitte JAMAIS ce
// process (seul le hash est persisté · l'URL signée contient le nonce
// dans le payload signé HMAC).
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
  log: ["error"],
});
try {
  await db.qaBootstrapNonce.create({
    data: {
      nonceHash,
      qaAdminEmailHash: emailHash,
      deploymentHost: host,
      projectRef: P1_REF,
      issuedAt: new Date(payload.issuedAt * 1000),
      expiresAt: new Date(payload.expiresAt * 1000),
    },
  });
} catch (e) {
  console.error(`REFUSED · nonce INSERT failed: ${e.message}`);
  await db.$disconnect().catch(() => {});
  process.exit(3);
}

function b64url(buf) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
const payloadBytes = Buffer.from(JSON.stringify(payload), "utf8");
const sig = createHmac("sha256", linkSecret).update(payloadBytes).digest();
const token = `${b64url(payloadBytes)}.${b64url(sig)}`;
const url = `https://${host}/api/qa/bootstrap?t=${token}`;

// Stdout · URL uniquement.
process.stdout.write(`${url}\n`);
process.stderr.write(`ttlMinutes=${ttlMinutes} host=${host} projectRef=${P1_REF} · valid for ${ttlMinutes} minutes\n`);

await db.$disconnect();
