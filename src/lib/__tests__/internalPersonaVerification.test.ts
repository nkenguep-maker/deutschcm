import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

const verification = read("src/lib/internalPersonaVerification.ts");
const route = read("src/app/api/internal-test/switch-persona/route.ts");
const consolePage = read("src/app/[locale]/internal-test/page.tsx");

describe("Production persona fixture verification", () => {
  it("runs verification after provisioning and before session switch", () => {
    const provisionAt = route.indexOf("ensureInternalTestWorkspace(dbUser.id)");
    const verifyAt = route.indexOf("verifyInternalPersonaFixture({");
    const metadataAt = route.indexOf("await setEffectivePersonaMetadata({", verifyAt);
    expect(provisionAt).toBeGreaterThan(-1);
    expect(verifyAt).toBeGreaterThan(provisionAt);
    expect(metadataAt).toBeGreaterThan(verifyAt);
  });

  it("checks the exact role and app-role contract", () => {
    expect(verification).toContain("contract.spaceRole");
    expect(verification).toContain("contract.appRole");
    expect(verification).toContain('status: "ACTIVE"');
    expect(verification).toContain("onboarded: true");
  });

  it("checks teacher and center bindings", () => {
    expect(verification).toContain('params.persona === "teacher" || params.persona === "center_admin"');
    expect(verification).toContain("teacher.centerId !== params.fixture.centerId");
    expect(verification).toContain('teacher.languages.includes("DEUTSCH")');
  });

  it("checks Monde and Racines path attributes", () => {
    expect(verification).toContain('path.universe !== "MONDE"');
    expect(verification).toContain('path.language !== "DEUTSCH"');
    expect(verification).toContain('path.currentLevel !== "A1"');
    expect(verification).toContain('path.universe !== "RACINES"');
    expect(verification).toContain('path.language !== "WOLOF"');
    expect(verification).toContain("hasInternalTestMarker(path.onboardingAnswers)");
  });

  it("checks family grants and both child profiles", () => {
    expect(verification).toContain('codes.has("FAMILY_WORLD")');
    expect(verification).toContain('codes.has("ROOTS_FAMILY")');
    expect(verification).toContain('params.persona === "child_monde" || params.persona === "child_racines"');
    expect(verification).toContain('universe: "MONDE"');
    expect(verification).toContain('universe: "RACINES"');
  });

  it("shows each contract and checked attributes in the owner console", () => {
    expect(consolePage).toContain("getInternalPersonaContract(persona.id)");
    expect(consolePage).toContain("contract.requiredAttributes.map");
    expect(consolePage).toContain("Attributs contrôlés");
  });
});
