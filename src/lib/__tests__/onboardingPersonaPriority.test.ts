import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");

/**
 * Regression guard: professional and Family accounts can retain historical
 * LearningPaths. /onboarding must resolve their trusted persona before reading
 * a learner path, otherwise they can fall back into the Student/Solo funnel.
 */
describe("onboarding persona priority", () => {
  it("resolves non-student personas before the learner funnel", () => {
    const source = readFileSync(
      resolve(REPO, "src/app/[locale]/onboarding/page.tsx"),
      "utf8",
    );

    const runtimeIndex = source.indexOf("const runtime = await resolvePersonaRuntime");
    const pathIndex = source.indexOf("const path = await prisma.learningPath.findFirst");
    const nonStudentGuardIndex = source.indexOf('runtime.persona !== "student_monde"');

    expect(runtimeIndex).toBeGreaterThan(-1);
    expect(nonStudentGuardIndex).toBeGreaterThan(runtimeIndex);
    expect(pathIndex).toBeGreaterThan(nonStudentGuardIndex);
    expect(source).toContain("runtime.persona !== \"student_racines\"");
    expect(source).toContain("runtime.onboarded ? runtime.homeRoute : runtime.onboardingRoute");
  });
});
