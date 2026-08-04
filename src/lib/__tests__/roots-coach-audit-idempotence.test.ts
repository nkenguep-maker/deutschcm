// P4.4 closure · idempotence transactionnelle des audits coach.
//
// Verrouille les invariants clés · l'audit ROOTS_COACH_ASSIGNMENT_REVOKED est
// écrit DANS la même tx que le changement de statut · un retry SSI ou un
// rollback rejette l'audit avec la mutation. L'audit ROOTS_COACH_CAPACITY_REACHED
// n'est plus émis fire-and-forget depuis les helpers memberships · seule la
// route caller peut l'émettre, une fois, après échec définitif.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { removeCoach } from "../circles/memberships";
import { CapacityError } from "../circles/capacity";

const writeAuditSpy = vi.fn().mockResolvedValue(undefined);
vi.mock("../audit/events", () => ({
  writeAuditEvent: (rec: unknown, tx?: unknown) => writeAuditSpy(rec, tx),
}));

import { emitCoachCapacityAudit } from "../audit/rootsCoachCapacity";

const REPO = join(__dirname, "..", "..", "..");
function read(rel: string): string {
  return readFileSync(join(REPO, rel), "utf-8");
}

describe("P4.4 closure · audit idempotence (structural)", () => {
  it("memberships.assignCoach does NOT fire-and-forget any audit", () => {
    const src = read("src/lib/circles/memberships.ts");
    // Zéro `void writeAuditEvent` dans le fichier · toutes les émissions
    // doivent être `await writeAuditEvent(..., tx)`.
    expect(src).not.toMatch(/void\s+writeAuditEvent/);
  });
  it("memberships.removeCoach writes ASSIGNMENT_REVOKED in-tx", () => {
    const src = read("src/lib/circles/memberships.ts");
    // Le pattern attendu · `await writeAuditEvent({...}, tx)` dans removeCoach.
    // Vérification structurelle · une seule occurrence in-tx est acceptable.
    const match = src.match(/action:\s*"ROOTS_COACH_ASSIGNMENT_REVOKED"/g);
    expect(match?.length).toBe(1);
    // Doit être précédé de `await writeAuditEvent(` et suivi de `, tx)` dans
    // les 20 lignes suivantes.
    const idx = src.indexOf('action: "ROOTS_COACH_ASSIGNMENT_REVOKED"');
    const window = src.slice(idx - 200, idx + 400);
    expect(window).toMatch(/await writeAuditEvent/);
    expect(window).toMatch(/tx,?\s*\)/);
  });
  it("memberships.assignCoach does NOT contain any ROOTS_COACH_CAPACITY_REACHED write", () => {
    const src = read("src/lib/circles/memberships.ts");
    // Toutes les émissions CAPACITY_REACHED sont désormais route-scoped.
    expect(src).not.toMatch(/action:\s*"ROOTS_COACH_CAPACITY_REACHED"/);
  });
});

describe("removeCoach · audit is in-tx", () => {
  beforeEach(() => writeAuditSpy.mockClear());

  it("writes exactly one ASSIGNMENT_REVOKED via the tx client (never via global prisma)", async () => {
    const tx = {
      circleMembership: {
        findFirst: vi.fn().mockResolvedValue({ id: "m1", userId: "coachA" }),
        update: vi.fn().mockResolvedValue({}),
      },
    } as never;
    const res = await removeCoach(tx, { circleId: "c1", adminUserId: "admin1" });
    expect(res).toEqual({ removedMembershipId: "m1", previousCoachUserId: "coachA" });
    expect(writeAuditSpy).toHaveBeenCalledTimes(1);
    const [rec, providedTx] = writeAuditSpy.mock.calls[0]!;
    expect(rec.action).toBe("ROOTS_COACH_ASSIGNMENT_REVOKED");
    expect(rec.metadata).toMatchObject({
      previousCoachUserId: "coachA",
      reasonCode: "removed",
      routeAction: "removeCoach",
    });
    // Invariant clé · l'audit est passé AVEC le tx (in-tx).
    expect(providedTx).toBe(tx);
  });

  it("noop when no ACTIVE coach · does NOT emit any audit", async () => {
    const tx = {
      circleMembership: {
        findFirst: vi.fn().mockResolvedValue(null),
        update: vi.fn(),
      },
    } as never;
    const res = await removeCoach(tx, { circleId: "c1", adminUserId: "admin1" });
    expect(res).toEqual({ removedMembershipId: null, previousCoachUserId: null });
    expect(writeAuditSpy).not.toHaveBeenCalled();
  });
});

describe("emitCoachCapacityAudit · single-emission post-failure", () => {
  beforeEach(() => writeAuditSpy.mockClear());

  it("noop when error is not CapacityError", async () => {
    await emitCoachCapacityAudit({
      error: new Error("random"),
      actorUserId: "admin",
      actorRole: "YEMA_ADMIN",
      circleId: "c1",
      coachUserId: "coachA",
      routeAction: "assignCoach",
    });
    expect(writeAuditSpy).not.toHaveBeenCalled();
  });

  it("emits attemptedCount metadata (NOT current) for circles dimension", async () => {
    const err = new CapacityError(
      "coach_circle_capacity_reached",
      "circles cap",
      { dimension: "circles", limit: 10, current: 11 },
    );
    await emitCoachCapacityAudit({
      error: err,
      actorUserId: "admin",
      actorRole: "YEMA_ADMIN",
      circleId: "c1",
      coachUserId: "coachA",
      routeAction: "assignCoach",
    });
    expect(writeAuditSpy).toHaveBeenCalledTimes(1);
    const rec = writeAuditSpy.mock.calls[0]![0];
    expect(rec.action).toBe("ROOTS_COACH_CAPACITY_REACHED");
    expect(rec.metadata).toMatchObject({
      capacityType: "circles",
      limit: 10,
      attemptedCount: 11,
      routeAction: "assignCoach",
    });
    expect(rec.metadata).not.toHaveProperty("current");
  });

  it("emits attemptedCount for children dimension", async () => {
    const err = new CapacityError(
      "coach_profile_capacity_reached",
      "profils cap",
      { dimension: "children", limit: 20, current: 21, coachUserId: "coachD" },
    );
    await emitCoachCapacityAudit({
      error: err,
      actorUserId: "parent",
      actorRole: "PARENT",
      circleId: "c1",
      coachUserId: "coachD",
      routeAction: "addChildToCircle",
    });
    expect(writeAuditSpy).toHaveBeenCalledTimes(1);
    const rec = writeAuditSpy.mock.calls[0]![0];
    expect(rec.metadata).toMatchObject({
      capacityType: "children",
      limit: 20,
      attemptedCount: 21,
      routeAction: "addChildToCircle",
    });
  });
});
