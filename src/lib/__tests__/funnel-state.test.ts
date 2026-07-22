// P1 · Tests de dérivation du funnel state · pure logic, aucun DB.

import { describe, it, expect } from "vitest";
import {
  deriveFunnelStep,
  nextFunnelHref,
  readAnswers,
  type FunnelInput,
} from "../funnel-state";

type LPShape = FunnelInput["learningPath"];
function makeLP(overrides: {
  universe?: "MONDE" | "RACINES";
  language?: string | null;
  currentLevel?: string | null;
  onboardingAnswers?: unknown;
}): NonNullable<LPShape> {
  return {
    universe: (overrides.universe ?? "MONDE") as NonNullable<LPShape>["universe"],
    language: (overrides.language ?? null) as NonNullable<LPShape>["language"],
    currentLevel: (overrides.currentLevel ?? null) as NonNullable<LPShape>["currentLevel"],
    onboardingAnswers: (overrides.onboardingAnswers ?? {}) as NonNullable<LPShape>["onboardingAnswers"],
  };
}

describe("deriveFunnelStep", () => {
  it("ACCOUNT_READY quand pas d'utilisateur", () => {
    const step = deriveFunnelStep({ hasSupabaseUser: false, learningPath: null, hasActiveAccessGrant: false });
    expect(step).toBe("ACCOUNT_READY");
  });

  it("ACCOUNT_READY quand user auth mais pas de LP", () => {
    const step = deriveFunnelStep({ hasSupabaseUser: true, learningPath: null, hasActiveAccessGrant: false });
    expect(step).toBe("ACCOUNT_READY");
  });

  it("UNIVERSE_SELECTED quand LP existe sans language", () => {
    const step = deriveFunnelStep({
      hasSupabaseUser: true,
      learningPath: makeLP({ universe: "MONDE", language: null }),
      hasActiveAccessGrant: false,
    });
    expect(step).toBe("UNIVERSE_SELECTED");
  });

  it("LANGUAGE_SELECTED quand LP a language mais pas de niveau (Monde)", () => {
    const step = deriveFunnelStep({
      hasSupabaseUser: true,
      learningPath: makeLP({ universe: "MONDE", language: "DEUTSCH" }),
      hasActiveAccessGrant: false,
    });
    expect(step).toBe("LANGUAGE_SELECTED");
  });

  it("SELF_ASSESSED quand Monde a currentLevel", () => {
    const step = deriveFunnelStep({
      hasSupabaseUser: true,
      learningPath: makeLP({ universe: "MONDE", language: "DEUTSCH", currentLevel: "A1" }),
      hasActiveAccessGrant: false,
    });
    expect(step).toBe("SELF_ASSESSED");
  });

  it("SELF_ASSESSED quand Racines a racinesStep dans answers", () => {
    const step = deriveFunnelStep({
      hasSupabaseUser: true,
      learningPath: makeLP({
        universe: "RACINES", language: "WOLOF",
        onboardingAnswers: { racinesStep: "E1" },
      }),
      hasActiveAccessGrant: false,
    });
    expect(step).toBe("SELF_ASSESSED");
  });

  it("DISCOVERY_STARTED quand progression partielle (1 sur 4)", () => {
    const step = deriveFunnelStep({
      hasSupabaseUser: true,
      learningPath: makeLP({
        universe: "MONDE", language: "DEUTSCH", currentLevel: "A1",
        onboardingAnswers: { discoveryProgress: [1] },
      }),
      hasActiveAccessGrant: false,
    });
    expect(step).toBe("DISCOVERY_STARTED");
  });

  it("DISCOVERY_STARTED quand progression 3 sur 4", () => {
    const step = deriveFunnelStep({
      hasSupabaseUser: true,
      learningPath: makeLP({
        universe: "MONDE", language: "DEUTSCH", currentLevel: "A1",
        onboardingAnswers: { discoveryProgress: [1, 2, 3] },
      }),
      hasActiveAccessGrant: false,
    });
    expect(step).toBe("DISCOVERY_STARTED");
  });

  it("DISCOVERY_COMPLETED quand les 4 leçons sont marquées", () => {
    const step = deriveFunnelStep({
      hasSupabaseUser: true,
      learningPath: makeLP({
        universe: "MONDE", language: "DEUTSCH", currentLevel: "A1",
        onboardingAnswers: { discoveryProgress: [1, 2, 3, 4] },
      }),
      hasActiveAccessGrant: false,
    });
    expect(step).toBe("DISCOVERY_COMPLETED");
  });

  it("ACTIVATION_SELECTED quand intention persistée", () => {
    const step = deriveFunnelStep({
      hasSupabaseUser: true,
      learningPath: makeLP({
        universe: "MONDE", language: "DEUTSCH", currentLevel: "A1",
        onboardingAnswers: {
          discoveryProgress: [1, 2, 3, 4],
          activationIntent: { offer: "PASSAGE", cefrLevel: "A1", currency: "EUR", selectedAt: "2026-07-22" },
        },
      }),
      hasActiveAccessGrant: false,
    });
    expect(step).toBe("ACTIVATION_SELECTED");
  });

  it("ACTIVATED quand un AccessGrant actif existe (bypass funnel)", () => {
    const step = deriveFunnelStep({
      hasSupabaseUser: true,
      learningPath: makeLP({ universe: "MONDE", language: "DEUTSCH" }),
      hasActiveAccessGrant: true,
    });
    expect(step).toBe("ACTIVATED");
  });
});

describe("nextFunnelHref", () => {
  const base: FunnelInput = { hasSupabaseUser: true, learningPath: null, hasActiveAccessGrant: false };
  it("SELF_ASSESSED envoie sur /decouverte/1", () => {
    expect(nextFunnelHref("SELF_ASSESSED", base)).toBe("/decouverte/1");
  });
  it("DISCOVERY_STARTED envoie sur la prochaine leçon non-terminée", () => {
    expect(nextFunnelHref("DISCOVERY_STARTED", {
      hasSupabaseUser: true,
      hasActiveAccessGrant: false,
      learningPath: makeLP({
        universe: "MONDE", language: "DEUTSCH", currentLevel: "A1",
        onboardingAnswers: { discoveryProgress: [1, 2] },
      }),
    })).toBe("/decouverte/3");
  });
  it("DISCOVERY_COMPLETED envoie sur /decouverte/bilan", () => {
    expect(nextFunnelHref("DISCOVERY_COMPLETED", base)).toBe("/decouverte/bilan");
  });
  it("ACTIVATED envoie sur /dashboard (skip funnel)", () => {
    expect(nextFunnelHref("ACTIVATED", base)).toBe("/dashboard");
  });
});

describe("readAnswers", () => {
  // Pick minimal typé pour readAnswers · évite un cast any.
  type AnswersHost = Parameters<typeof readAnswers>[0];
  const host = (v: unknown): AnswersHost => ({ onboardingAnswers: v as NonNullable<AnswersHost>["onboardingAnswers"] });
  it("renvoie {} pour LP null", () => {
    expect(readAnswers(null)).toEqual({});
  });
  it("parse un JSON string valide", () => {
    expect(readAnswers(host('{"racinesStep":"E1"}'))).toEqual({ racinesStep: "E1" });
  });
  it("renvoie {} si JSON string invalide", () => {
    expect(readAnswers(host("not json"))).toEqual({});
  });
  it("garde l'objet tel quel", () => {
    expect(readAnswers(host({ racinesStep: "E2" }))).toEqual({ racinesStep: "E2" });
  });
});
