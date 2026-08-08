import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const store = readFileSync(resolve(REPO, "src/lib/beta/invitationStore.ts"), "utf8");

describe("closed beta invitation concurrency", () => {
  it("serializes issuance by opaque email hash before revoking and creating", () => {
    const transaction = store.indexOf("prisma.$transaction");
    const lock = store.indexOf("pg_advisory_xact_lock(hashtextextended(${emailHash}, 0))");
    const revoke = store.indexOf("tx.betaInvitation.updateMany");
    const create = store.indexOf("tx.betaInvitation.create");

    expect(transaction).toBeGreaterThan(-1);
    expect(lock).toBeGreaterThan(transaction);
    expect(revoke).toBeGreaterThan(lock);
    expect(create).toBeGreaterThan(revoke);
    expect(store).toContain('status: "PENDING"');
    expect(store).toContain('status: "REVOKED"');
    expect(store).toContain("emailHash");
  });
});
