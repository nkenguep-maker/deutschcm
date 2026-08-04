import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { interpretStorageRemove, runCleanup } from "@/lib/messaging/audio/cleanupCore.mjs";

// P4.6-C.1.1 · algorithme cleanup storage-first + fail-closed.
// Ces tests utilisent des deps mockées · zéro accès Supabase réel.

const NOW = new Date("2026-08-01T10:00:00Z");
const READY_EXPIRED = () => makeAsset({
  id: "a1", status: "READY", storageKey: "v1/conv1/a1.wav",
  createdAt: new Date("2026-01-01T10:00:00Z"),
  expiresAt: new Date("2026-07-01T10:00:00Z"),
});

interface AssetRow {
  id: string;
  status: "PENDING" | "READY" | "FAILED" | "EXPIRED" | "DELETED";
  storageKey: string | null;
  createdAt: Date;
  expiresAt: Date | null;
  deletedAt: Date | null;
}

function makeAsset(overrides: Partial<AssetRow>): AssetRow {
  return {
    id: "aX",
    status: "READY",
    storageKey: "v1/conv1/aX.wav",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    expiresAt: new Date("2026-07-01T00:00:00Z"),
    deletedAt: null,
    ...overrides,
  } as AssetRow;
}

interface Recording {
  storageRemoveCalls: string[];
  markDeletedCalls: Array<{ id: string; at: Date }>;
  auditCalls: Array<{ action: string; targetId: string; metadata: Record<string, unknown> }>;
}

function makeDeps(cfg: {
  eligible: AssetRow[];
  reverify?: (id: string) => AssetRow | null;
  storageRemoveResults: Record<string, ReturnType<typeof interpretStorageRemove> | Promise<ReturnType<typeof interpretStorageRemove>>>;
  orphans?: string[];
}) {
  const rec: Recording = { storageRemoveCalls: [], markDeletedCalls: [], auditCalls: [] };
  const reverifyMap = new Map(cfg.eligible.map((a) => [a.id, a]));
  const deps = {
    now: () => NOW,
    findEligible: vi.fn(async () => cfg.eligible),
    reverifyEligibility: vi.fn(async (id: string) => {
      if (cfg.reverify) return cfg.reverify(id);
      return reverifyMap.get(id) ?? null;
    }),
    storageRemove: vi.fn(async (key: string) => {
      rec.storageRemoveCalls.push(key);
      const r = cfg.storageRemoveResults[key];
      if (!r) throw new Error(`no mock for ${key}`);
      return r;
    }),
    markDeleted: vi.fn(async (id: string, at: Date) => {
      rec.markDeletedCalls.push({ id, at });
    }),
    writeAudit: vi.fn(async (evt: { action: string; targetId: string; metadata: Record<string, unknown> }) => {
      rec.auditCalls.push(evt);
    }),
    listOrphans: cfg.orphans ? vi.fn(async () => cfg.orphans!) : undefined,
  };
  return { deps, rec };
}

describe("cleanupCore · dry-run · aucune mutation Storage/DB", () => {
  it("dry-run · n'appelle jamais storageRemove ni markDeleted", async () => {
    const { deps, rec } = makeDeps({
      eligible: [READY_EXPIRED()],
      storageRemoveResults: {},
    });
    const { counters, hasFailures } = await runCleanup(deps, { dryRun: true });
    expect(counters.scanned).toBe(1);
    expect(counters.purged).toBe(0);
    expect(hasFailures).toBe(false);
    expect(rec.storageRemoveCalls).toEqual([]);
    expect(rec.markDeletedCalls).toEqual([]);
    expect(deps.reverifyEligibility).not.toHaveBeenCalled();
  });
});

describe("cleanupCore · storage-first · ordre strict", () => {
  it("Storage remove appelé AVANT markDeleted + audit", async () => {
    const key = "v1/conv1/a1.wav";
    const { deps, rec } = makeDeps({
      eligible: [READY_EXPIRED()],
      storageRemoveResults: { [key]: { ok: true, alreadyAbsent: false } },
    });
    const { counters, hasFailures } = await runCleanup(deps, { dryRun: false });
    expect(counters.purged).toBe(1);
    expect(counters.failed).toBe(0);
    expect(hasFailures).toBe(false);
    expect(rec.storageRemoveCalls).toEqual([key]);
    expect(rec.markDeletedCalls).toEqual([{ id: "a1", at: NOW }]);
    // Audit MESSAGE_AUDIO_PURGED APRÈS Storage confirmé
    expect(rec.auditCalls).toHaveLength(1);
    expect(rec.auditCalls[0].action).toBe("MESSAGE_AUDIO_PURGED");
    expect(rec.auditCalls[0].targetId).toBe("a1");
  });
});

describe("cleanupCore · échec Storage · asset ne passe PAS DELETED", () => {
  it("Storage error · pas de markDeleted · counters.failed=1 · hasFailures=true", async () => {
    const key = "v1/conv1/a1.wav";
    const { deps, rec } = makeDeps({
      eligible: [READY_EXPIRED()],
      storageRemoveResults: { [key]: { ok: false, error: "network_timeout" } },
    });
    const { counters, hasFailures } = await runCleanup(deps, { dryRun: false });
    expect(counters.purged).toBe(0);
    expect(counters.failed).toBe(1);
    expect(hasFailures).toBe(true);
    expect(rec.markDeletedCalls).toEqual([]);
    // Audit d'échec émis (mais PAS PURGED)
    expect(rec.auditCalls).toHaveLength(1);
    expect(rec.auditCalls[0].action).toBe("MESSAGE_AUDIO_UPLOAD_FAILED");
    expect(rec.auditCalls[0].metadata.reasonCode).toBe("network_timeout");
    expect(rec.auditCalls[0].metadata.phase).toBe("cleanup");
  });

  it("Storage exception · idem · pas de markDeleted", async () => {
    const { deps, rec } = makeDeps({
      eligible: [READY_EXPIRED()],
      storageRemoveResults: {},
    });
    // Override pour throw.
    deps.storageRemove = vi.fn(async () => { throw new Error("boom"); });
    const { counters, hasFailures } = await runCleanup(deps, { dryRun: false });
    expect(counters.failed).toBe(1);
    expect(hasFailures).toBe(true);
    expect(rec.markDeletedCalls).toEqual([]);
    expect(rec.auditCalls.length).toBeGreaterThan(0);
    expect(rec.auditCalls[0].metadata.reasonCode).toBe("storage_exception");
  });
});

describe("cleanupCore · réponse Storage ambiguë · fail-closed", () => {
  it("ambiguous:true · fail-closed · pas de markDeleted", async () => {
    const key = "v1/conv1/a1.wav";
    const { deps, rec } = makeDeps({
      eligible: [READY_EXPIRED()],
      storageRemoveResults: { [key]: { ok: false, ambiguous: true } },
    });
    const { counters, hasFailures } = await runCleanup(deps, { dryRun: false });
    expect(counters.failed).toBe(1);
    expect(hasFailures).toBe(true);
    expect(rec.markDeletedCalls).toEqual([]);
    expect(rec.auditCalls[0].metadata.reasonCode).toBe("storage_ambiguous");
  });
});

describe("cleanupCore · retry après échec · deuxième tentative possible", () => {
  it("run 1 · échec → asset reste éligible · run 2 · succès → DELETED", async () => {
    const asset = READY_EXPIRED();
    const key = asset.storageKey!;
    // Run 1 · échec.
    const d1 = makeDeps({
      eligible: [asset],
      storageRemoveResults: { [key]: { ok: false, error: "timeout" } },
    });
    const r1 = await runCleanup(d1.deps, { dryRun: false });
    expect(r1.counters.failed).toBe(1);
    expect(d1.rec.markDeletedCalls).toEqual([]);
    // Run 2 · même asset (encore éligible car pas DELETED), Storage OK.
    const d2 = makeDeps({
      eligible: [asset],
      storageRemoveResults: { [key]: { ok: true, alreadyAbsent: false } },
    });
    const r2 = await runCleanup(d2.deps, { dryRun: false });
    expect(r2.counters.purged).toBe(1);
    expect(d2.rec.markDeletedCalls).toEqual([{ id: "a1", at: NOW }]);
  });
});

describe("cleanupCore · idempotence · asset déjà DELETED", () => {
  it("asset DELETED · counted alreadyDeleted · aucune action", async () => {
    const asset = makeAsset({ id: "a2", status: "DELETED", deletedAt: NOW, storageKey: null });
    const { deps, rec } = makeDeps({
      eligible: [asset],
      storageRemoveResults: {},
    });
    const { counters, hasFailures } = await runCleanup(deps, { dryRun: false });
    expect(counters.alreadyDeleted).toBe(1);
    expect(counters.purged).toBe(0);
    expect(hasFailures).toBe(false);
    expect(rec.storageRemoveCalls).toEqual([]);
    expect(rec.markDeletedCalls).toEqual([]);
  });
});

describe("cleanupCore · concurrence · re-verify avant delete", () => {
  it("asset revenu READY non-expiré entre scan et delete · skippé", async () => {
    // Contrat · reverifyEligibility retourne null quand l'asset n'est
    // plus éligible (READY + not expired, ou revived).
    const asset = READY_EXPIRED();
    const { deps, rec } = makeDeps({
      eligible: [asset],
      reverify: () => null, // simule "n'est plus éligible"
      storageRemoveResults: {},
    });
    const { counters } = await runCleanup(deps, { dryRun: false });
    expect(counters.skippedIneligible).toBe(1);
    expect(counters.purged).toBe(0);
    expect(rec.storageRemoveCalls).toEqual([]);
    expect(rec.markDeletedCalls).toEqual([]);
  });

  it("asset disparu (reverify=null) · skippé", async () => {
    const asset = READY_EXPIRED();
    const { deps, rec } = makeDeps({
      eligible: [asset],
      reverify: () => null,
      storageRemoveResults: {},
    });
    const { counters } = await runCleanup(deps, { dryRun: false });
    expect(counters.skippedIneligible).toBe(1);
    expect(rec.storageRemoveCalls).toEqual([]);
  });
});

describe("cleanupCore · plusieurs assets · échec partiel", () => {
  it("3 assets · 1 échoue · 2 réussissent · hasFailures=true · counters corrects", async () => {
    const a1 = makeAsset({ id: "a1", storageKey: "k1" });
    const a2 = makeAsset({ id: "a2", storageKey: "k2" });
    const a3 = makeAsset({ id: "a3", storageKey: "k3" });
    const { deps, rec } = makeDeps({
      eligible: [a1, a2, a3],
      storageRemoveResults: {
        k1: { ok: true },
        k2: { ok: false, error: "quota" },
        k3: { ok: true, alreadyAbsent: true },
      },
    });
    const { counters, hasFailures } = await runCleanup(deps, { dryRun: false });
    expect(counters.scanned).toBe(3);
    expect(counters.purged).toBe(2);
    expect(counters.failed).toBe(1);
    expect(hasFailures).toBe(true);
    // a1 et a3 sont dans les markDeletedCalls, a2 non
    expect(rec.markDeletedCalls.map((c) => c.id).sort()).toEqual(["a1", "a3"]);
    // Audits · 2 PURGED + 1 UPLOAD_FAILED
    const purged = rec.auditCalls.filter((a) => a.action === "MESSAGE_AUDIO_PURGED");
    const failed = rec.auditCalls.filter((a) => a.action === "MESSAGE_AUDIO_UPLOAD_FAILED");
    expect(purged).toHaveLength(2);
    expect(failed).toHaveLength(1);
    expect(failed[0].targetId).toBe("a2");
  });
});

describe("cleanupCore · orphelins Storage", () => {
  it("2 orphelins · 1 remove OK · 1 échoue · counters orphanDeleted=1 orphanFailed=1", async () => {
    const { deps } = makeDeps({
      eligible: [],
      storageRemoveResults: {
        "v1/x/o1.wav": { ok: true, alreadyAbsent: false },
        "v1/x/o2.wav": { ok: false, error: "denied" },
      },
      orphans: ["v1/x/o1.wav", "v1/x/o2.wav"],
    });
    const { counters, hasFailures } = await runCleanup(deps, { dryRun: false });
    expect(counters.orphanScanned).toBe(2);
    expect(counters.orphanDeleted).toBe(1);
    expect(counters.orphanFailed).toBe(1);
    expect(hasFailures).toBe(true);
  });

  it("--target-asset · orphelins ignorés", async () => {
    const asset = makeAsset({ id: "a1", storageKey: "k1" });
    const { deps } = makeDeps({
      eligible: [asset],
      storageRemoveResults: { k1: { ok: true } },
      orphans: ["v1/x/o1.wav"],
    });
    const { counters } = await runCleanup(deps, { dryRun: false, targetAssetId: "a1" });
    expect(counters.orphanScanned).toBe(0);
    expect(counters.orphanDeleted).toBe(0);
  });
});

describe("cleanupCore · asset sans storageKey · état incohérent · marker DELETED direct", () => {
  it("storageKey=null status=READY expiré · pas d'appel Storage · markDeleted appelé", async () => {
    const asset = makeAsset({ id: "a1", storageKey: null, status: "READY", expiresAt: new Date("2020-01-01T00:00:00Z") });
    const { deps, rec } = makeDeps({
      eligible: [asset],
      storageRemoveResults: {},
    });
    const { counters } = await runCleanup(deps, { dryRun: false });
    expect(counters.purged).toBe(1);
    expect(rec.storageRemoveCalls).toEqual([]);
    expect(rec.markDeletedCalls).toEqual([{ id: "a1", at: NOW }]);
    expect(rec.auditCalls[0].metadata.reasonCode).toBe("no_storage_key");
  });
});

describe("interpretStorageRemove · classification stricte", () => {
  it("null response · ambiguous", () => {
    const r = interpretStorageRemove(null, "k");
    expect(r.ok).toBe(false);
    expect(r.ambiguous).toBe(true);
  });
  it("error 'not found' · idempotent success", () => {
    const r = interpretStorageRemove({ data: null, error: { message: "Object not found" } }, "k");
    expect(r.ok).toBe(true);
    expect(r.alreadyAbsent).toBe(true);
  });
  it("error autre · fail non-ambigu", () => {
    const r = interpretStorageRemove({ data: null, error: { message: "quota exceeded" } }, "k");
    expect(r.ok).toBe(false);
    expect(r.ambiguous).toBeUndefined();
  });
  it("data null + error null · ambiguous fail-closed", () => {
    const r = interpretStorageRemove({ data: null, error: null }, "k");
    expect(r.ok).toBe(false);
    expect(r.ambiguous).toBe(true);
  });
  it("data=[] + error null · idempotent success", () => {
    const r = interpretStorageRemove({ data: [], error: null }, "k");
    expect(r.ok).toBe(true);
    expect(r.alreadyAbsent).toBe(true);
  });
  it("data=[{name:k}] · succès confirmé", () => {
    const r = interpretStorageRemove({ data: [{ name: "k" }], error: null }, "k");
    expect(r.ok).toBe(true);
    expect(r.alreadyAbsent).toBe(false);
  });
  it("data=[{name:'autre'}] · ambigu key_mismatch", () => {
    const r = interpretStorageRemove({ data: [{ name: "other" }], error: null }, "k");
    expect(r.ok).toBe(false);
    expect(r.ambiguous).toBe(true);
    expect(r.error).toBe("key_mismatch");
  });
  it("data non-array · ambigu", () => {
    const r = interpretStorageRemove({ data: {}, error: null }, "k");
    expect(r.ok).toBe(false);
    expect(r.ambiguous).toBe(true);
  });
});

describe("Script CLI · exit code non-zéro si --apply avec échec", () => {
  const src = readFileSync(resolve(__dirname, "../../..", "scripts/cleanup-messaging-audio.mjs"), "utf-8");

  it("propage hasFailures via process.exit(1) uniquement en mode APPLY", () => {
    expect(src).toMatch(/if \(hasFailures && APPLY\)[\s\S]*?process\.exit\(1\)/);
  });

  it("import du core partagé (cleanupCore.mjs)", () => {
    expect(src).toMatch(/from\s+["'][^"']*cleanupCore\.mjs["']/);
  });

  it("dry-run par défaut · --apply requis explicitement", () => {
    expect(src).toMatch(/const APPLY = args\.includes\("--apply"\)/);
  });

  it("--target-asset supporté pour scoping", () => {
    expect(src).toMatch(/const targetIdIdx = args\.indexOf\("--target-asset"\)/);
  });
});
