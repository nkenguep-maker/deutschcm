// P1 hardening · Tests dédiés au comportement post-refactor.

import { describe, it, expect } from "vitest";
import { deriveFunnelStep, nextFunnelHref, type FunnelInput } from "../funnel-state";

type LP = NonNullable<FunnelInput["learningPath"]>;
function makeLP(overrides: {
  universe?: "MONDE" | "RACINES";
  language?: string | null;
  currentLevel?: string | null;
  onboardingAnswers?: unknown;
}): LP {
  return {
    universe: (overrides.universe ?? "MONDE") as LP["universe"],
    language: (overrides.language ?? null) as LP["language"],
    currentLevel: (overrides.currentLevel ?? null) as LP["currentLevel"],
    onboardingAnswers: (overrides.onboardingAnswers ?? {}) as LP["onboardingAnswers"],
  };
}

describe("deriveFunnelStep · hardening (selfAssessmentAnswer requis)", () => {
  it("Monde avec langue mais sans selfAssessmentAnswer → LANGUAGE_SELECTED", () => {
    const step = deriveFunnelStep({
      hasSupabaseUser: true, hasActiveAccessGrant: false,
      learningPath: makeLP({ universe: "MONDE", language: "DEUTSCH" }),
    });
    expect(step).toBe("LANGUAGE_SELECTED");
  });

  it("Monde avec selfAssessmentAnswer + declaredLevel → SELF_ASSESSED", () => {
    const step = deriveFunnelStep({
      hasSupabaseUser: true, hasActiveAccessGrant: false,
      learningPath: makeLP({
        universe: "MONDE", language: "DEUTSCH",
        onboardingAnswers: { selfAssessmentAnswer: 1, declaredLevel: "A1", recommendedLevel: "A1" },
      }),
    });
    expect(step).toBe("SELF_ASSESSED");
  });

  it("Racines avec selfAssessmentAnswer + declaredLevel É1 → SELF_ASSESSED", () => {
    const step = deriveFunnelStep({
      hasSupabaseUser: true, hasActiveAccessGrant: false,
      learningPath: makeLP({
        universe: "RACINES", language: "WOLOF",
        onboardingAnswers: { selfAssessmentAnswer: 1, declaredLevel: "E1", recommendedLevel: "E1" },
      }),
    });
    expect(step).toBe("SELF_ASSESSED");
  });

  it("legacy cefrSelfAssessed continue de compter (rétro-compat)", () => {
    const step = deriveFunnelStep({
      hasSupabaseUser: true, hasActiveAccessGrant: false,
      learningPath: makeLP({
        universe: "MONDE", language: "DEUTSCH", currentLevel: "A1",
      }),
    });
    expect(step).toBe("SELF_ASSESSED");
  });

  it("legacy racinesStep continue de compter (rétro-compat)", () => {
    const step = deriveFunnelStep({
      hasSupabaseUser: true, hasActiveAccessGrant: false,
      learningPath: makeLP({
        universe: "RACINES", language: "WOLOF",
        onboardingAnswers: { racinesStep: "E1" },
      }),
    });
    expect(step).toBe("SELF_ASSESSED");
  });
});

describe("nextFunnelHref · hardening (LANGUAGE_SELECTED → niveau screen)", () => {
  it("Monde LANGUAGE_SELECTED → /onboarding/monde/niveau", () => {
    const dest = nextFunnelHref("LANGUAGE_SELECTED", {
      hasSupabaseUser: true, hasActiveAccessGrant: false,
      learningPath: makeLP({ universe: "MONDE", language: "DEUTSCH" }),
    });
    expect(dest).toBe("/onboarding/monde/niveau");
  });
  it("Racines LANGUAGE_SELECTED → /onboarding/racines/niveau", () => {
    const dest = nextFunnelHref("LANGUAGE_SELECTED", {
      hasSupabaseUser: true, hasActiveAccessGrant: false,
      learningPath: makeLP({ universe: "RACINES", language: "WOLOF" }),
    });
    expect(dest).toBe("/onboarding/racines/niveau");
  });
});
