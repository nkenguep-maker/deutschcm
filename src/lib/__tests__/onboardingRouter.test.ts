import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { nextFunnelHref, type FunnelInput } from "@/lib/funnel-state";

const routerSource = readFileSync(
  resolve(__dirname, "../../app/[locale]/onboarding/page.tsx"),
  "utf-8",
);

function input(universe: "MONDE" | "RACINES"): FunnelInput {
  return {
    hasSupabaseUser: true,
    hasActiveAccessGrant: false,
    learningPath: {
      universe,
      language: universe === "MONDE" ? "DEUTSCH" : "WOLOF",
      currentLevel: null,
      onboardingAnswers: null,
    },
  } as FunnelInput;
}

describe("onboarding router · LANGUAGE_SELECTED", () => {
  it("envoie Monde vers l'auto-évaluation CECR au lieu de reboucler sur le formulaire", () => {
    expect(nextFunnelHref("LANGUAGE_SELECTED", input("MONDE"))).toBe(
      "/onboarding/monde/niveau",
    );
  });

  it("envoie Racines vers l'auto-évaluation E1–E5", () => {
    expect(nextFunnelHref("LANGUAGE_SELECTED", input("RACINES"))).toBe(
      "/onboarding/racines/niveau",
    );
  });

  it("le routeur ne classe plus LANGUAGE_SELECTED parmi les étapes du formulaire d'univers", () => {
    expect(routerSource).toMatch(
      /step === "ACCOUNT_READY" \|\| step === "UNIVERSE_SELECTED"/,
    );
    expect(routerSource).not.toMatch(
      /step === "UNIVERSE_SELECTED" \|\| step === "LANGUAGE_SELECTED"/,
    );
    expect(routerSource).toMatch(/href:\s*nextFunnelHref\(step,/);
  });
});
