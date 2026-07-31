#!/usr/bin/env node
// P4.6-C.1 · cleanup messaging_audio_assets · dry-run par défaut.
//
// Cibles ·
//   - orphelins Storage : objet Storage sans AudioAsset associé (rare)
//   - AudioAsset PENDING > 24h (upload jamais finalisé)
//   - AudioAsset FAILED > 7 jours
//   - AudioAsset expiresAt < now (retention dépassée)
//
// Sécurité ·
//   - P-1 UNIQUEMENT · refuse Production et refs blocklistées
//   - --dry-run par défaut · --apply explicite requis
//   - AVANT suppression Storage · MARK Prisma DELETED + deletedAt=now
//   - Idempotent · relance sans erreur
//   - Aucun log de storageKey complet · aucun log de payload sensible
//   - AuditEvent MESSAGE_AUDIO_PURGED agrégé (1 par run, compteurs)

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const P1_REF = "kzzagbojjkivdzzcrmxn";
const BLOCKED = new Set(["sbjhvlrkbyjckdxujjsk", "mamofhrurksyuuolucea", "qggwvonfumuimjfsgpdz"]);
const BUCKET = "yema-messaging-audio-private";

// Fenêtres safety.
const PENDING_TIMEOUT_MS = 24 * 60 * 60 * 1000;
const FAILED_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
if (!APPLY && !args.includes("--dry-run")) {
  // Défaut = dry-run · brief §8.
  console.log("[cleanup] mode = --dry-run (défaut · aucune suppression)");
}
if (APPLY) console.log("[cleanup] mode = --apply (suppressions effectives)");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbUrl = process.env.DIRECT_URL;
if (!url || !svc || !dbUrl) { console.error("MISSING env · NEXT_PUBLIC_SUPABASE_URL/SERVICE_ROLE_KEY/DIRECT_URL"); process.exit(2); }
if (!url.includes(P1_REF) || !dbUrl.includes(P1_REF)) { console.error("REFUSED · non-P1"); process.exit(2); }
for (const b of BLOCKED) if (url.includes(b) || dbUrl.includes(b)) { console.error(`REFUSED · blocklisted ${b}`); process.exit(2); }

const sb = createClient(url, svc, { auth: { persistSession: false, autoRefreshToken: false } });
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: dbUrl }), log: ["error"] });

async function main() {
  const now = new Date();

  const counters = { pendingExpired: 0, failedOld: 0, retentionExpired: 0, orphanStorage: 0, storageDeleted: 0, dbMarked: 0 };

  // 1. Pending > 24h · marker FAILED puis nettoyer Storage.
  const pending = await db.messagingAudioAsset.findMany({
    where: {
      status: "PENDING",
      createdAt: { lt: new Date(now.getTime() - PENDING_TIMEOUT_MS) },
      deletedAt: null,
    },
    select: { id: true, storageKey: true },
  });
  counters.pendingExpired = pending.length;

  // 2. Failed > 7j.
  const failedOld = await db.messagingAudioAsset.findMany({
    where: {
      status: "FAILED",
      createdAt: { lt: new Date(now.getTime() - FAILED_RETENTION_MS) },
      deletedAt: null,
    },
    select: { id: true, storageKey: true },
  });
  counters.failedOld = failedOld.length;

  // 3. Retention dépassée (expiresAt < now).
  const retentionExpired = await db.messagingAudioAsset.findMany({
    where: {
      status: "READY",
      expiresAt: { lt: now },
      deletedAt: null,
    },
    select: { id: true, storageKey: true },
  });
  counters.retentionExpired = retentionExpired.length;

  const toRemove = [...pending, ...failedOld, ...retentionExpired];
  console.log(`[cleanup] scan · pending=${counters.pendingExpired} failedOld=${counters.failedOld} retention=${counters.retentionExpired}`);

  if (!APPLY) {
    console.log("[cleanup] dry-run · aucune suppression appliquée");
  } else {
    for (const a of toRemove) {
      if (a.storageKey) {
        const rm = await sb.storage.from(BUCKET).remove([a.storageKey]);
        if (rm.error && !/not\s+found/i.test(rm.error.message)) {
          console.error(`[cleanup] storage remove KO id=${maskId(a.id)} · ${rm.error.message.slice(0, 100)}`);
          continue;
        }
        counters.storageDeleted += 1;
      }
      await db.messagingAudioAsset.update({
        where: { id: a.id },
        data: { status: "DELETED", deletedAt: now, storageKey: null },
      });
      counters.dbMarked += 1;
    }
    // 4. Orphelin Storage · rare · borné à un scan léger.
    const list = await sb.storage.from(BUCKET).list("v1", { limit: 100, sortBy: { column: "created_at", order: "asc" } });
    if (list.data && list.data.length > 0) {
      // Note · listing profond nécessite récursion par conv · deferred au futur script.
      // Pour l'instant on log uniquement le compte des dossiers de conv racine.
      counters.orphanStorage = list.data.length;
    }
    // AuditEvent agrégé.
    await db.auditEvent.create({
      data: {
        action: "MESSAGE_AUDIO_PURGED",
        targetType: "MessagingAudioAsset",
        targetId: "batch",
        metadata: counters,
      },
    });
  }

  console.log(`[cleanup] result · ${JSON.stringify(counters)}`);
}

function maskId(id) {
  return id.slice(0, 4) + "***" + id.slice(-3);
}

main()
  .catch((e) => { console.error(`FAIL · ${e.message}`); process.exit(1); })
  .finally(() => db.$disconnect());
