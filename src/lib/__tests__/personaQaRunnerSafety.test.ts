import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const entry = readFileSync(resolve(REPO, "scripts/test-personas-p1.mjs"), "utf8");
const safeRunner = readFileSync(resolve(REPO, "scripts/orchestrate-personas-safe-p1.mjs"), "utf8");
const personaRunner = readFileSync(resolve(REPO, "scripts/orchestrate-personas-p1.mjs"), "utf8");

describe("P-1 persona QA runner safety", () => {
  it("routes the authenticated gate through the fail-closed fixture wrapper", () => {
    expect(entry).toContain('"node", "scripts/orchestrate-personas-safe-p1.mjs"');
    expect(entry).toContain('P1_REF = "kzzagbojjkivdzzcrmxn"');
    expect(entry).toContain("MISSING P1_TEST_PASSWORD");
  });

  it("fails before persona execution when fixture provisioning fails", () => {
    expect(safeRunner).toContain("fixture provisioning failed");
    expect(safeRunner).toMatch(/if \(prep\.status !== 0\)/);
    expect(safeRunner.indexOf("fixture provisioning failed")).toBeLessThan(
      safeRunner.indexOf("authenticated 9-persona QA"),
    );
  });

  it("fails closed if the inner persona runner fixture provisioning fails", () => {
    expect(personaRunner).toContain("const fixturePrep = spawnSync");
    expect(personaRunner).toMatch(/fixturePrep\.error \|\| fixturePrep\.signal \|\| fixturePrep\.status !== 0/);
    expect(personaRunner).toContain("fixture provisioning failed");
    expect(personaRunner.indexOf("fixture provisioning failed")).toBeLessThan(
      personaRunner.indexOf("next start port"),
    );
  });

  it("attempts idempotent fixture recovery after provisioning failure", () => {
    expect(safeRunner).toContain("attemptFixtureRecovery");
    expect(safeRunner).toContain('attemptFixtureRecovery("provisioning failure")');
    expect(safeRunner).toContain("fixture recovery failed");
    expect(safeRunner).toMatch(/recovery\.status !== 0/);
  });

  it("always restores idempotent P-1 fixtures after the persona process", () => {
    expect(safeRunner).toContain("finally {");
    expect(safeRunner).toContain("CLEANUP · restore idempotent P-1 fixtures");
    expect(safeRunner).toContain("fixture restoration failed");
    expect(safeRunner).toMatch(/cleanupResult = runNode\(FIXTURE_SCRIPT\)/);
  });

  it("propagates provisioning, persona, cleanup and recovery failures instead of reporting a false green", () => {
    expect(safeRunner).toMatch(/if \(cleanupResult\.status !== 0\)/);
    expect(safeRunner).toMatch(/if \(personaResult\.status !== 0\)/);
    expect(safeRunner).toMatch(/recovery\.status !== 0/);
    expect(safeRunner).toContain("persona QA passed and fixtures restored");
  });
});
