// P4.6-C.1.1 · algorithme pur du cleanup audio · storage-first.
//
// Séparé du CLI pour permettre des tests unitaires avec Supabase Storage
// + Prisma mockés. Import compatible depuis JS (script CLI) et TS (tests).
//
// Contrat storage-first (brief §Ordre requis) ·
//   pour chaque asset candidat ·
//     1. re-vérifier éligibilité (état frais)
//     2. Storage.remove(storageKey)
//     3. VÉRIFIER strictement la réponse Storage
//     4. si succès confirmé · marker DB DELETED + deletedAt + audit
//     5. si échec ou ambigu · NE PAS marker DELETED · compter failed
//     6. jamais de transaction Prisma ouverte pendant l'appel Storage
//
// Idempotence · asset déjà DELETED = skip · asset READY/FAILED avec
// objet encore présent = nouvelle tentative.
//
// Concurrence · re-verify avant chaque suppression · évite race avec
// un accès postérieur au scan initial.

/**
 * @typedef {"PENDING"|"READY"|"FAILED"|"EXPIRED"|"DELETED"} AudioStatus
 *
 * @typedef {Object} AssetRow
 * @property {string} id
 * @property {AudioStatus} status
 * @property {string|null} storageKey
 * @property {Date} createdAt
 * @property {Date|null} expiresAt
 * @property {Date|null} deletedAt
 *
 * @typedef {Object} StorageRemoveResult
 * @property {boolean} ok            true si la suppression est CONFIRMÉE
 * @property {boolean} [ambiguous]   true si la réponse ne permet pas de conclure
 * @property {boolean} [alreadyAbsent] true si l'objet était déjà absent
 * @property {string} [error]
 *
 * @typedef {Object} CleanupDeps
 * @property {() => Date} now
 * @property {() => Promise<AssetRow[]>} findEligible
 * @property {(id: string) => Promise<AssetRow|null>} reverifyEligibility
 * @property {(storageKey: string) => Promise<StorageRemoveResult>} storageRemove
 * @property {(id: string, at: Date) => Promise<void>} markDeleted
 * @property {(evt: { action: string; targetId: string; metadata: Record<string, unknown> }) => Promise<void>} writeAudit
 * @property {(() => Promise<string[]>)=} listOrphans
 *
 * @typedef {Object} CleanupCounters
 * @property {number} scanned
 * @property {number} purged
 * @property {number} failed
 * @property {number} skippedIneligible
 * @property {number} alreadyDeleted
 * @property {number} orphanScanned
 * @property {number} orphanDeleted
 * @property {number} orphanFailed
 *
 * @typedef {Object} CleanupOptions
 * @property {boolean} dryRun
 * @property {string=} targetAssetId  optionnel · limite le scan à un seul asset
 */

/**
 * @param {CleanupDeps} deps
 * @param {CleanupOptions} opts
 * @returns {Promise<{ counters: CleanupCounters; hasFailures: boolean }>}
 */
export async function runCleanup(deps, opts) {
  /** @type {CleanupCounters} */
  const counters = {
    scanned: 0, purged: 0, failed: 0,
    skippedIneligible: 0, alreadyDeleted: 0,
    orphanScanned: 0, orphanDeleted: 0, orphanFailed: 0,
  };

  const all = await deps.findEligible();
  const candidates = opts.targetAssetId
    ? all.filter((a) => a.id === opts.targetAssetId)
    : all;
  counters.scanned = candidates.length;

  if (opts.dryRun) {
    // Aucun side-effect · on compte uniquement les déjà DELETED pour info.
    for (const a of candidates) if (a.status === "DELETED") counters.alreadyDeleted += 1;
    return { counters, hasFailures: false };
  }

  for (const c of candidates) {
    // 1. Re-verify (état frais après scan) · évite race concurrente.
    const fresh = await deps.reverifyEligibility(c.id);
    if (!fresh) { counters.skippedIneligible += 1; continue; }
    if (fresh.status === "DELETED") { counters.alreadyDeleted += 1; continue; }

    // 2. Si pas de storageKey (état incohérent) · rien à supprimer côté
    // Storage · on marque DELETED directement pour clore le cycle.
    if (!fresh.storageKey) {
      await deps.markDeleted(fresh.id, deps.now());
      await deps.writeAudit({
        action: "MESSAGE_AUDIO_PURGED",
        targetId: fresh.id,
        metadata: { reasonCode: "no_storage_key" },
      });
      counters.purged += 1;
      continue;
    }

    // 3. Storage remove · vérification stricte du résultat.
    let rm;
    try {
      rm = await deps.storageRemove(fresh.storageKey);
    } catch (e) {
      counters.failed += 1;
      await deps.writeAudit({
        action: "MESSAGE_AUDIO_UPLOAD_FAILED",
        targetId: fresh.id,
        metadata: { reasonCode: "storage_exception", phase: "cleanup", err: shortErr(e) },
      });
      continue;
    }

    // 4. Fail-closed sur ambiguïté · réponse Storage non-concluante = échec.
    if (!rm || !rm.ok || rm.ambiguous) {
      counters.failed += 1;
      await deps.writeAudit({
        action: "MESSAGE_AUDIO_UPLOAD_FAILED",
        targetId: fresh.id,
        metadata: {
          reasonCode: rm?.ambiguous ? "storage_ambiguous" : (rm?.error ?? "storage_failed"),
          phase: "cleanup",
        },
      });
      continue;
    }

    // 5. Storage confirmé absent · maintenant seulement, marker DB.
    await deps.markDeleted(fresh.id, deps.now());
    await deps.writeAudit({
      action: "MESSAGE_AUDIO_PURGED",
      targetId: fresh.id,
      metadata: {
        reasonCode: fresh.expiresAt && fresh.expiresAt < deps.now() ? "retention_expired" : "housekeeping",
        alreadyAbsent: rm.alreadyAbsent === true,
      },
    });
    counters.purged += 1;
  }

  // Orphelins Storage (objets sans AudioAsset). Optionnel · seulement si
  // deps.listOrphans est fourni ET pas de --target-asset.
  if (deps.listOrphans && !opts.targetAssetId) {
    const orphans = await deps.listOrphans();
    counters.orphanScanned = orphans.length;
    for (const key of orphans) {
      let rm;
      try { rm = await deps.storageRemove(key); }
      catch { rm = { ok: false, error: "exception" }; }
      if (rm && rm.ok && !rm.ambiguous) counters.orphanDeleted += 1;
      else counters.orphanFailed += 1;
    }
  }

  return {
    counters,
    hasFailures: counters.failed > 0 || counters.orphanFailed > 0,
  };
}

function shortErr(e) {
  const s = e instanceof Error ? e.message : String(e);
  return s.slice(0, 120);
}

/**
 * Interprète une réponse Supabase Storage.remove() en StorageRemoveResult.
 * Fail-closed sur ambiguïté (data=null ET error=null).
 * @param {{data: unknown; error: unknown} | null | undefined} raw
 * @param {string} storageKey
 * @returns {StorageRemoveResult}
 */
export function interpretStorageRemove(raw, storageKey) {
  if (!raw) return { ok: false, ambiguous: true, error: "no_response" };
  const err = /** @type {any} */(raw).error;
  const data = /** @type {any} */(raw).data;
  if (err) {
    const msg = String(err.message ?? err);
    // Idempotence · "not found" = déjà absent, considéré succès idempotent.
    if (/not\s+found/i.test(msg)) {
      return { ok: true, alreadyAbsent: true };
    }
    return { ok: false, error: msg.slice(0, 200) };
  }
  // data doit être un tableau (v2 Supabase) · null/undefined = ambigu.
  if (!Array.isArray(data)) return { ok: false, ambiguous: true, error: "non_array_data" };
  // Data vide + pas d'erreur = objet déjà absent (idempotent).
  if (data.length === 0) return { ok: true, alreadyAbsent: true };
  // Vérifie que la clé demandée est bien dans la liste renvoyée.
  const returned = data.map((d) => (typeof d?.name === "string" ? d.name : null));
  const match = returned.some((n) => n === storageKey || (n && storageKey.endsWith(n)));
  if (!match) return { ok: false, ambiguous: true, error: "key_mismatch" };
  return { ok: true, alreadyAbsent: false };
}
