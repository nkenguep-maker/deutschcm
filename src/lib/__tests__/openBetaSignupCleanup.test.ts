import { describe, expect, it, vi } from "vitest";

import { findAuthUserId } from "../../../scripts/lib/find-auth-user-id.mjs";

describe("open beta signup cleanup", () => {
  it("finds a temporary user beyond the first Supabase Auth page", async () => {
    const firstPage = Array.from({ length: 1_000 }, (_, index) => ({
      id: `existing-${index}`,
      email: `existing-${index}@example.invalid`,
    }));
    const listUsers = vi
      .fn()
      .mockResolvedValueOnce({ data: { users: firstPage }, error: null })
      .mockResolvedValueOnce({
        data: { users: [{ id: "temporary-user", email: "Beta+Run@example.invalid" }] },
        error: null,
      });
    const admin = { auth: { admin: { listUsers } } };

    await expect(findAuthUserId(admin, "beta+run@example.invalid")).resolves.toBe(
      "temporary-user",
    );
    expect(listUsers).toHaveBeenNthCalledWith(1, { page: 1, perPage: 1_000 });
    expect(listUsers).toHaveBeenNthCalledWith(2, { page: 2, perPage: 1_000 });
  });

  it("stops after the final partial page when no user matches", async () => {
    const listUsers = vi.fn().mockResolvedValue({
      data: { users: [{ id: "other", email: "other@example.invalid" }] },
      error: null,
    });
    const admin = { auth: { admin: { listUsers } } };

    await expect(findAuthUserId(admin, "missing@example.invalid")).resolves.toBeNull();
    expect(listUsers).toHaveBeenCalledTimes(1);
  });
});
