#!/usr/bin/env node
// P4.6-C.1 / P4.6-C.1.1 · cleanup messaging_audio_assets · storage-first,
// dry-run par défaut.
//
// Ordre STRICT (brief P4.6-C.1.1) ·
//   1. scan candidats
//   2. per-asset · re-verify · Storage.remove · vérifier réponse ·
//      seulement après succès confirmé · marker DELETED + audit
//   3. exit code non nul si au moins un asset --apply a échoué
//
// Sécurité · P-1 UNIQUEMENT · aucun log de storageKey complet · aucun
// log de secret.

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { interpretStorageRemove, runCleanup } from "../src/lib/messaging/audio/cleanupCore.mjs";

const P1_REF = "kzzagbojjkivdzzcrmxn";
const BLOCKED = new Set(["sbjhvlrkbyjckdxujjsk", "mamofhrurksyuuolucea", "qggwvonfumuimjfsgpdz"]);
const BUCKET = "yema-messaging-audio-private";

// Fenêtres safety.
const PENDING_TIMEOUT_MS = 24 * 60 * 60 * 1000;
const FAILED_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const targetIdIdx = args.indexOf("--target-asset");
const targetAssetId = targetIdIdx >= 0 ? args[targetIdIdx + 1] : undefined;
if (!APPLY && !args.includes("--dry-run")) {
  console.log("[cleanup] mode = --dry-run (défaut · aucune suppression)");
}
if (APPLY) console.log(`[cleanup] mode = --apply${targetAssetId ? ` --target-asset=${maskId(targetAssetId)}` : ""}`);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbUrl = process.env.DIRECT_URL;
if (!url || !svc || !dbUrl) { console.error("MISSING env"); process.exit(2); }
if (!url.includes(P1_REF) || !dbUrl.includes(P1_REF)) { console.error("REFUSED · non-P1"); process.exit(2); }
for (const b of BLOCKED) if (url.includes(b) || dbUrl.includes(b)) { console.error(`REFUSED · blocklisted ${b}`); process.exit(2); }

const sb = createClient(url, svc, { auth: { persistSession: false, autoRefreshToken: false } });
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: dbUrl }), log: ["error"] });

async function main() {
  const now = new Date();

  /** @type {import("../src/lib/messaging/audio/cleanupCore.mjs").CleanupDeps} */
  const deps = {
    now: () => now,
    findEligible: async () => {
      // 3 catégories combinées · retention expirée, pending>24h, failed>7j.
      const [pending, failedOld, retentionExpired] = await Promise.all([
        db.messagingAudioAsset.findMany({
          where: {
            status: "PENDING",
            createdAt: { lt: new Date(now.getTime() - PENDING_TIMEOUT_MS) },
            deletedAt: null,
          },
          select: { id: true, status: true, storageKey: true, createdAt: true, expiresAt: true, deletedAt: true },
        }),
        db.messagingAudioAsset.findMany({
          where: {
            status: "FAILED",
            createdAt: { lt: new Date(now.getTime() - FAILED_RETENTION_MS) },
            deletedAt: null,
          },
          select: { id: true, status: true, storageKey: true, createdAt: true, expiresAt: true, deletedAt: true },
        }),
        db.messagingAudioAsset.findMany({
          where: {
            status: "READY",
            expiresAt: { lt: now },
            deletedAt: null,
          },
          select: { id: true, status: true, storageKey: true, createdAt: true, expiresAt: true, deletedAt: true },
        }),
      ]);
      // Dédup par id (au cas où · overlap théoriquement impossible ici).
      const map = new Map();
      for (const a of [...pending, ...failedOld, ...retentionExpired]) map.set(a.id, a);
      return Array.from(map.values());
    },
    reverifyEligibility: async (id) => {
      // Fetch frais · re-verify que l'asset n'a pas changé pendant le scan.
      const a = await db.messagingAudioAsset.findUnique({
        where: { id },
        select: { id: true, status: true, storageKey: true, createdAt: true, expiresAt: true, deletedAt: true },
      });
      if (!a) return null;
      // Ne pas re-supprimer un asset qui a été "revived" (ex: transition
      // PENDING → READY après le scan initial).
      if (a.status === "READY" && (!a.expiresAt || a.expiresAt >= now)) return null;
      return a;
    },
    storageRemove: async (storageKey) => {
      // Aucune transaction Prisma ouverte pendant cet appel réseau.
      const raw = await sb.storage.from(BUCKET).remove([storageKey]);
      return interpretStorageRemove(raw, storageKey);
    },
    markDeleted: async (id, at) => {
      await db.messagingAudioAsset.update({
        where: { id },
        data: { status: "DELETED", deletedAt: at, storageKey: null },
      });
    },
    writeAudit: async (evt) => {
      await db.auditEvent.create({
        data: {
          action: evt.action,
          targetType: "MessagingAudioAsset",
          targetId: evt.targetId,
          metadata: evt.metadata,
        },
      });
    },
    // Orphelins Storage · scan léger v1/* (borné, seulement quand pas --target).
    listOrphans: targetAssetId ? undefined : async () => {
      const rootList = await sb.storage.from(BUCKET).list("v1", { limit: 100 });
      if (!rootList.data || rootList.data.length === 0) return [];
      const orphans = [];
      for (const dir of rootList.data.slice(0, 20)) {
        const conv = dir.name;
        if (!conv) continue;
        const objs = await sb.storage.from(BUCKET).list(`v1/${conv}`, { limit: 100 });
        if (!objs.data) continue;
        for (const o of objs.data) {
          const assetIdCandidate = (o.name || "").replace(/\.[a-z0-9]+$/i, "");
          if (!assetIdCandidate) continue;
          const exists = await db.messagingAudioAsset.findUnique({
            where: { id: assetIdCandidate },
            select: { id: true },
          });
          if (!exists) orphans.push(`v1/${conv}/${o.name}`);
        }
      }
      return orphans;
    },
  };

  const { counters, hasFailures } = await runCleanup(deps, { dryRun: !APPLY, targetAssetId });
  console.log(`[cleanup] result · ${JSON.stringify(counters)}`);
  if (hasFailures && APPLY) {
    console.error("[cleanup] EXIT 1 · au moins une suppression a échoué");
    process.exit(1);
  }
}

function maskId(id) {
  if (typeof id !== "string" || id.length < 6) return "***";
  return id.slice(0, 4) + "***" + id.slice(-3);
}

main()
  .catch((e) => { console.error(`FAIL · ${e.message}`); process.exit(1); })
  .finally(() => db.$disconnect());
