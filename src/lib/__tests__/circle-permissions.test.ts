// P4.1 · Permission resolver · tests structurels (regex sur le source).
//
// Les fonctions résolvent une session Supabase et interrogent Prisma · elles
// sont couvertes par les smoke tests d'intégration `p4-1-rls-smoke.mjs`.
// Ici on garantit les invariants qui protègent la surface d'attaque :
// jamais de trust dans le body client, code d'erreur stable, filtres serveur.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PermissionError, circleRoleAllows } from "../permissions/circle";

const src = readFileSync(join(process.cwd(), "src/lib/permissions/circle.ts"), "utf8");

describe("Permission resolver · P4.1 · invariants source", () => {
  it("resolveCircleActor uses supabase session, never trusts client-provided userId", () => {
    expect(src).toMatch(/supabase\.auth\.getUser\(\)/);
    // Aucun accès à `body.userId` ou `params.userId` dans le resolver.
    expect(src).not.toMatch(/body\.\s*userId/);
    expect(src).not.toMatch(/params\.\s*userId/);
  });
  it("assertCircleMembership filters by status = ACTIVE", () => {
    expect(src).toMatch(/status:\s*"ACTIVE"/);
  });
  it("assertCircleCoach requires role = COACH AND status = ACTIVE", () => {
    // Un coach dormant (REVOKED) ne peut jamais passer.
    expect(src).toMatch(/role:\s*"COACH"[\s\S]*?status:\s*"ACTIVE"/);
  });
  it("assertCircleOwner requires role OWNER (not just membership)", () => {
    expect(src).toMatch(/m\.role !== "OWNER"/);
  });
  it("assertCircleChildAccess never trusts childProfileId without ownership check", () => {
    // La fonction commence par un findUnique pour lire parentUserId, puis
    // vérifie le lien via cercle partagé.
    expect(src).toMatch(/prisma\.childProfile\.findUnique/);
    expect(src).toMatch(/circle:\s*\{\s*memberships:\s*\{\s*some:\s*\{\s*userId:\s*actor\.userId/);
  });
  it("assertHouseholdOwnership rejects invited adults · owner strict", () => {
    expect(src).toMatch(/ownerUserId !== actor\.userId/);
  });
  it("all throws use PermissionError with stable code (401 UNAUTHORIZED · 403 FORBIDDEN · 404 NOT_FOUND)", () => {
    for (const code of ["UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND"]) {
      expect(src).toMatch(new RegExp(`"${code}"`));
    }
  });
});

describe("circleRoleAllows", () => {
  it("returns false for null role", () => {
    expect(circleRoleAllows(null, ["OWNER"])).toBe(false);
  });
  it("checks membership in allowed list", () => {
    expect(circleRoleAllows("OWNER", ["OWNER", "ADULT"])).toBe(true);
    expect(circleRoleAllows("COACH", ["OWNER", "ADULT"])).toBe(false);
    expect(circleRoleAllows("CHILD", ["CHILD"])).toBe(true);
  });
});

describe("PermissionError constructor", () => {
  it("carries code and name", () => {
    const e = new PermissionError("FORBIDDEN", "no");
    expect(e.name).toBe("PermissionError");
    expect(e.code).toBe("FORBIDDEN");
  });
});
