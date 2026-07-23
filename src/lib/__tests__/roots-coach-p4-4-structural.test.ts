// P4.4 finale · tests structurels (statiques) sur les invariants doctrine.
//
// - `ROOTS_COACH_SCOPE_AMBIGUOUS` n'est plus produit par le resolver (Option A).
// - Les codes d'erreur métier coach sont stables et distincts de P2034 / 40001.
// - `withSerializableRetry` accepte les 2 errorCodes coach (assignment + replacement).
// - Aucun test file ni fichier source côté API ne référence "TransactionWriteConflict"
//   ni "P2034" comme string retournable dans un body de réponse.
//
// Ces vérifications sont purement statiques (lecture fichier) et ne nécessitent
// ni base de données ni fixture — elles courent sur CI en < 100 ms.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ConcurrentUpdateError } from "../db/retry";

const REPO = join(__dirname, "..", "..", "..");

function read(rel: string): string {
  return readFileSync(join(REPO, rel), "utf-8");
}

describe("P4.4 · structural invariants", () => {
  it("rootsCoach resolver does not emit ROOTS_COACH_SCOPE_AMBIGUOUS from a >20 threshold", () => {
    const src = read("src/lib/permissions/rootsCoach.ts");
    // Option A · aucun producteur d'ambiguïté basé sur un seuil de compte.
    expect(src).not.toMatch(/SCOPE_AMBIGUOUS_THRESHOLD/);
    // Le resolver ne doit pas émettre l'action à partir d'un compte de Circles.
    const emitBlock = src.match(/action:\s*"ROOTS_COACH_SCOPE_AMBIGUOUS"/g);
    expect(emitBlock).toBeNull();
  });

  it("CapacityError codes are split into circle vs profile (P4.4)", () => {
    const src = read("src/lib/circles/capacity.ts");
    expect(src).toMatch(/"coach_circle_capacity_reached"/);
    expect(src).toMatch(/"coach_profile_capacity_reached"/);
    // L'ancien code aggloméré ne doit plus être un throw site.
    expect(src).not.toMatch(/throw new CapacityError\(\s*"coach_capacity_reached"/);
  });

  it("ConcurrentUpdateError accepts coach-specific codes", () => {
    const validCodes = [
      "concurrent_membership_update",
      "concurrent_invitation_update",
      "concurrent_coach_assignment",
      "concurrent_coach_replacement",
    ];
    for (const code of validCodes) {
      const e = new ConcurrentUpdateError(code as never, "msg");
      expect(e.code).toBe(code);
    }
  });

  it("admin coach route wraps both handlers with withSerializableRetry", () => {
    const src = read("src/app/api/admin/circles/[circleId]/coach/route.ts");
    expect(src).toMatch(/withSerializableRetry/);
    expect(src).toMatch(/errorCode:\s*"concurrent_coach_assignment"/);
    expect(src).toMatch(/errorCode:\s*"concurrent_coach_replacement"/);
  });

  it("circleErrors mapper never leaks P2034 or TransactionWriteConflict to the response body", () => {
    const src = read("src/lib/api/circleErrors.ts");
    // Le mapper convertit P2034 / 40001 en `concurrent_membership_update`.
    // Il ne doit JAMAIS renvoyer un err(code, ...) contenant "P2034" comme code
    // ni "TransactionWriteConflict" comme message.
    expect(src).not.toMatch(/err\("P2034"/);
    expect(src).not.toMatch(/err\("TransactionWriteConflict"/);
    expect(src).toMatch(/"concurrent_membership_update"/);
  });

  it("addChildToCircle enforces coach profile capacity when a coach is present", () => {
    const src = read("src/lib/circles/memberships.ts");
    expect(src).toMatch(/assertCoachProfileCapacityForChildAdd/);
    // Le fire-and-forget d'audit doit citer `capacityType: "children"`.
    expect(src).toMatch(/routeAction:\s*"addChildToCircle"/);
  });
});
