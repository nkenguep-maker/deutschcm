// P4.2 hardening · retry Postgres serialization conflicts.

import { describe, it, expect, vi } from "vitest";
import {
  withSerializableRetry,
  ConcurrentUpdateError,
  MAX_SERIALIZATION_RETRIES,
} from "../db/retry";

describe("withSerializableRetry", () => {
  it("returns fn result on first success", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    await expect(withSerializableRetry(fn)).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on Postgres 40001 (serialization_failure)", async () => {
    const err = Object.assign(new Error("could not serialize access"), { code: "40001" });
    const fn = vi.fn()
      .mockRejectedValueOnce(err)
      .mockRejectedValueOnce(err)
      .mockResolvedValueOnce("ok-after-retry");
    await expect(withSerializableRetry(fn)).resolves.toBe("ok-after-retry");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("retries on Prisma P2034", async () => {
    const err = Object.assign(new Error("transaction conflict"), { code: "P2034" });
    const fn = vi.fn().mockRejectedValueOnce(err).mockResolvedValueOnce("ok");
    await expect(withSerializableRetry(fn)).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("throws ConcurrentUpdateError after MAX retries", async () => {
    const err = Object.assign(new Error("40001"), { code: "40001" });
    const fn = vi.fn().mockRejectedValue(err);
    await expect(withSerializableRetry(fn)).rejects.toBeInstanceOf(ConcurrentUpdateError);
    expect(fn).toHaveBeenCalledTimes(MAX_SERIALIZATION_RETRIES);
  });

  it("uses the supplied errorCode for invitations", async () => {
    const err = Object.assign(new Error("40001"), { code: "40001" });
    const fn = vi.fn().mockRejectedValue(err);
    try {
      await withSerializableRetry(fn, { errorCode: "concurrent_invitation_update" });
    } catch (e) {
      expect((e as ConcurrentUpdateError).code).toBe("concurrent_invitation_update");
    }
  });

  it("uses the supplied errorCode for coach assignment (P4.4)", async () => {
    const err = Object.assign(new Error("40001"), { code: "40001" });
    const fn = vi.fn().mockRejectedValue(err);
    try {
      await withSerializableRetry(fn, { errorCode: "concurrent_coach_assignment" });
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(ConcurrentUpdateError);
      expect((e as ConcurrentUpdateError).code).toBe("concurrent_coach_assignment");
      expect((e as ConcurrentUpdateError).message).not.toContain("P2034");
      expect((e as ConcurrentUpdateError).message).not.toContain("TransactionWriteConflict");
    }
  });

  it("uses the supplied errorCode for coach replacement (P4.4)", async () => {
    const err = Object.assign(new Error("TransactionWriteConflict"), { code: "P2034" });
    const fn = vi.fn().mockRejectedValue(err);
    try {
      await withSerializableRetry(fn, { errorCode: "concurrent_coach_replacement" });
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(ConcurrentUpdateError);
      expect((e as ConcurrentUpdateError).code).toBe("concurrent_coach_replacement");
    }
  });

  it("does NOT retry other errors (permission, capacity)", async () => {
    class OtherError extends Error {}
    const fn = vi.fn().mockRejectedValue(new OtherError("nope"));
    await expect(withSerializableRetry(fn)).rejects.toBeInstanceOf(OtherError);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
