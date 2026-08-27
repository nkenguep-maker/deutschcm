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
    expect(store).toContain("emailHash");
  });

  it("supersedes pending tokens and in-flight unfinalized claims", () => {
    const issuance = store.slice(
      store.indexOf("export async function storeBetaInvitation"),
      store.indexOf("export async function claimBetaInvitation"),
    );

    expect(issuance).toContain('{ status: "PENDING" }');
    expect(issuance).toContain('{ status: "ACCEPTED", acceptedByUserId: null }');
    expect(issuance).toContain('status: "REVOKED"');
    expect(issuance).toContain("revokedAt: now");
  });

  it("never resurrects a superseded claim during release or stale recovery", () => {
    const release = store.slice(
      store.indexOf("export async function releaseBetaInvitationClaim"),
      store.indexOf("export async function revokeBetaInvitation"),
    );
    const claim = store.slice(
      store.indexOf("export async function claimBetaInvitation"),
      store.indexOf("export async function finalizeBetaInvitation"),
    );

    expect(release).toContain("revokedAt: null");
    expect(claim).toContain("revokedAt: null");
  });
});
