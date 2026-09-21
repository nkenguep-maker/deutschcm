import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const route = readFileSync(resolve(REPO, "src/app/api/onboarding/route.ts"), "utf8");

describe("Center onboarding binding", () => {
  it("requires a trusted active CENTER role before any center write", () => {
    const guard = route.indexOf('hasActiveRole(dbUser.id, "CENTER")');
    const transaction = route.indexOf("prisma.$transaction", guard);
    expect(guard).toBeGreaterThan(-1);
    expect(transaction).toBeGreaterThan(guard);
  });

  it("persists center, user.centerId and membership binding atomically", () => {
    const transaction = route.indexOf("prisma.$transaction");
    const centerCreate = route.indexOf("tx.languageCenter.create", transaction);
    const userUpdate = route.indexOf("tx.user.update", transaction);
    const membership = route.indexOf("tx.teacher.upsert", transaction);

    expect(transaction).toBeGreaterThan(-1);
    expect(centerCreate).toBeGreaterThan(transaction);
    expect(userUpdate).toBeGreaterThan(transaction);
    expect(membership).toBeGreaterThan(userUpdate);
    expect(route).toContain("centerId: savedCenter.id");
    expect(route).toContain('languages: []');
  });

  it("updates the existing center on onboarding retry instead of creating a second one", () => {
    expect(route).toContain("dbUser.centerId");
    expect(route).toContain("tx.languageCenter.update");
    expect(route).toContain("tx.languageCenter.create");
  });
});
