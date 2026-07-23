// P4.2 hardening · verrous transactionnels.

import { describe, it, expect, vi } from "vitest";
import { acquireCircleLock } from "../db/locks";

describe("acquireCircleLock · P4.2 hardening", () => {
  it("appelle pg_advisory_xact_lock avec un bigint dérivé du circleId", async () => {
    const spy = vi.fn().mockResolvedValue(undefined);
    const tx = { $executeRaw: spy } as never;
    await acquireCircleLock(tx, "cmrxabcd0000abcd1234efgh");
    expect(spy).toHaveBeenCalledOnce();
    const args = spy.mock.calls[0];
    // Le tag template Prisma reçoit le raw + les valeurs · on vérifie qu'un
    // bigint est passé en 2ᵉ argument (values[0]).
    expect(typeof args[1]).toBe("bigint");
  });
  it("produit le même bigint pour le même circleId (déterministe)", async () => {
    const seen: bigint[] = [];
    const tx = {
      $executeRaw: vi.fn((_strings, value) => { seen.push(value); return Promise.resolve(); }),
    } as never;
    await acquireCircleLock(tx, "circleA");
    await acquireCircleLock(tx, "circleA");
    expect(seen[0]).toBe(seen[1]);
  });
  it("produit un bigint différent pour deux circleId distincts", async () => {
    const seen: bigint[] = [];
    const tx = {
      $executeRaw: vi.fn((_strings, value) => { seen.push(value); return Promise.resolve(); }),
    } as never;
    await acquireCircleLock(tx, "circleA");
    await acquireCircleLock(tx, "circleB");
    expect(seen[0]).not.toBe(seen[1]);
  });
});
