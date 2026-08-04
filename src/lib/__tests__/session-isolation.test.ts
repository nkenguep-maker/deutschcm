import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// P4.6 Lot 6 · invariants sécurité de session cross-persona (brief §3).
// « aucun cookie enfant ne survit au passage vers un adulte »
// « aucun compte adulte ne conserve le contexte d'un autre utilisateur »

const ROOT = resolve(__dirname, "../..");
function read(rel: string): string {
  return readFileSync(resolve(ROOT, rel), "utf-8");
}

describe("Session isolation cross-persona (Lot 6)", () => {
  it("QA impersonate efface le cookie enfant à chaque changement de persona", () => {
    const src = read("app/api/qa/impersonate/route.ts");
    // Le cookie enfant doit être explicitement set à "" avec maxAge 0
    // avant de retourner la 303 vers la destination.
    expect(src).toMatch(/response\.cookies\.set\(\s*["']yema_child_session["'],\s*["']["']/);
    expect(src).toMatch(/yema_child_session[\s\S]*maxAge:\s*0/);
    // Toujours httpOnly (même pour l'expirer)
    expect(src).toMatch(/yema_child_session[\s\S]*httpOnly:\s*true/);
  });

  it("QA logout efface le cookie enfant en même temps que le persona label", () => {
    const src = read("app/api/qa/logout/route.ts");
    expect(src).toMatch(/response\.cookies\.set\(\s*["']yema_child_session["'],\s*["']["']/);
    expect(src).toMatch(/yema_child_session[\s\S]*maxAge:\s*0/);
    expect(src).toMatch(/yema_child_session[\s\S]*httpOnly:\s*true/);
  });

  it("DELETE /api/child-session efface le cookie côté user final (mode enfant terminé)", () => {
    const src = read("app/api/child-session/route.ts");
    // Le handler DELETE doit exister
    expect(src).toMatch(/export async function DELETE/);
    // Doit set le cookie à "" avec maxAge 0
    expect(src).toMatch(/CHILD_SESSION_COOKIE_NAME[\s\S]*maxAge:\s*0/);
  });

  it("POST /api/child-session refuse un body sans PIN (MISSING_FIELDS 400)", () => {
    const src = read("app/api/child-session/route.ts");
    expect(src).toMatch(/if\s*\(\s*!childProfileId\s*\|\|\s*!pin\s*\)\s*return\s+err\("MISSING_FIELDS",\s*400\)/);
  });

  it("POST /api/child-session vérifie ownership parent AVANT le PIN (défense en profondeur)", () => {
    const src = read("app/api/child-session/route.ts");
    // On cherche les APPELS (pas les imports). L'appel à
    // resolveFamilyGuardianActorOrNull() vient en premier, ownership
    // vérifié par la query Prisma (parentUserId: actor.userId), puis
    // verifyChildPin(pin, child.pinHash).
    const idxParent = src.indexOf("resolveFamilyGuardianActorOrNull()");
    const idxOwnership = src.indexOf("parentUserId: actor.userId");
    const idxPin = src.indexOf("verifyChildPin(pin");
    expect(idxParent).toBeGreaterThan(0);
    expect(idxOwnership).toBeGreaterThan(idxParent);
    expect(idxPin).toBeGreaterThan(idxOwnership);
  });

  it("QA /api/qa/child-session est 404 en Production (gate resolveQaConfig AVANT toute logique)", () => {
    const src = read("app/api/qa/child-session/route.ts");
    const idxGate = src.indexOf("resolveQaConfig()");
    const idxUse = src.indexOf("supabase.auth.getUser");
    expect(idxGate).toBeGreaterThan(0);
    expect(idxUse).toBeGreaterThan(idxGate);
    // notFound helper stable
    expect(src).toMatch(/error:\s*"Not found"/);
  });

  it("resolveActiveChildSession fail-closed sur univers non défini", () => {
    const src = read("lib/family/childResolvers.ts");
    // Un enfant sans universe explicite retourne null → aucun dashboard
    // (adulte ou enfant) accessible.
    expect(src).toMatch(/child\.universe\s*!==\s*"MONDE"\s*&&\s*child\.universe\s*!==\s*"RACINES"/);
    expect(src).toMatch(/return\s+null/);
  });

  it("resolveActiveChildSession compare pinVersionMatches (Lot 5.1 invalidation PIN)", () => {
    const src = read("lib/family/childResolvers.ts");
    expect(src).toMatch(/pinVersionMatches\(check\.payload\.pv,\s*child\.pinUpdatedAt\)/);
    expect(src).toMatch(/if\s*\(!pinVersionMatches[\s\S]*return\s+null/);
  });

  it("dispatch /[locale]/dashboard résout la session enfant AVANT la session Supabase adulte", () => {
    const src = read("app/[locale]/dashboard/page.tsx");
    const idxChild = src.indexOf("resolveActiveChildSession");
    const idxParent = src.indexOf("supabase.auth.getUser");
    expect(idxChild).toBeGreaterThan(0);
    expect(idxParent).toBeGreaterThan(0);
    expect(idxChild).toBeLessThan(idxParent);
  });
});
