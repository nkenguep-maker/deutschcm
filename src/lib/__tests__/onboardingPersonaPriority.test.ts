import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

describe("onboarding persona priority", () => {
  it("resolves non-student personas before the learner funnel", () => {
    const source = read("src/app/[locale]/onboarding/page.tsx");
    const runtimeIndex = source.indexOf("const runtime = await resolvePersonaRuntime");
    const pathIndex = source.indexOf("const path = await prisma.learningPath.findFirst");
    const guardIndex = source.indexOf('runtime.persona !== "student_monde"');

    expect(runtimeIndex).toBeGreaterThan(-1);
    expect(guardIndex).toBeGreaterThan(runtimeIndex);
    expect(pathIndex).toBeGreaterThan(guardIndex);
    expect(source).toContain('runtime.persona !== "student_racines"');
  });

  it("uses the selected learner persona when both universes exist", () => {
    const runtime = read("src/lib/personas/runtime.ts");
    const dashboard = read("src/app/[locale]/dashboard/page.tsx");
    const onboarding = read("src/app/[locale]/onboarding/page.tsx");

    const monde = runtime.indexOf('if (requested === "student_monde")');
    const racines = runtime.indexOf('if (requested === "student_racines")');
    const fallback = runtime.indexOf('if (latestUniverse === "RACINES")');

    expect(monde).toBeGreaterThan(-1);
    expect(racines).toBeGreaterThan(monde);
    expect(fallback).toBeGreaterThan(racines);
    expect(runtime).toContain('activeUniverses.has("MONDE")');
    expect(runtime).toContain('activeUniverses.has("RACINES")');
    expect(dashboard).toContain("const requestedUniverse = internalRequestedUniverse ?? runtimeUniverse");
    expect(dashboard).toContain("path.universe === requestedUniverse");
    expect(onboarding).toContain("...(selectedUniverse ? { universe: selectedUniverse } : {})");
  });
});
