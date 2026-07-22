// P1 hardening · gardes de code sur les nouveaux écrans et l'API funnel.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function read(rel: string) {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

describe("Écrans /onboarding/[universe]/niveau", () => {
  const monde = read("src/app/[locale]/onboarding/monde/niveau/page.tsx");
  const racines = read("src/app/[locale]/onboarding/racines/niveau/page.tsx");
  const form = read("src/app/[locale]/onboarding/monde/niveau/NiveauForm.tsx");
  it("chaque page filtre LP par son univers", () => {
    expect(monde).toMatch(/universe:\s*["']MONDE["']/);
    expect(racines).toMatch(/universe:\s*["']RACINES["']/);
  });
  it("form rend un radiogroup accessible avec les 5 options", () => {
    expect(form).toMatch(/role="radiogroup"/);
    expect(form).toMatch(/aria-checked=\{picked\}/);
    expect(form).toMatch(/options\.map/);
  });
  it("form annonce que la recommandation est indicative (non certifiante)", () => {
    expect(form).toMatch(/recommandation est indicative|recommendation is indicative/);
  });
  it("form persiste les 3 champs via PATCH /api/funnel", () => {
    expect(form).toMatch(/selfAssessmentAnswer/);
    expect(form).toMatch(/declaredLevel/);
    expect(form).toMatch(/recommendedLevel/);
    expect(form).toMatch(/\/api\/funnel/);
  });
});

describe("Activation-intent · verrous availability + Racines", () => {
  const client = read("src/app/[locale]/activation-intent/ActivationIntentClient.tsx");
  it("verrouille les niveaux non-discoveryReady", () => {
    expect(client).toMatch(/MONDE_LEVEL_AVAILABILITY/);
    expect(client).toMatch(/disabled=\{locked\}/);
    expect(client).toMatch(/aria-disabled=\{locked\}/);
  });
  it("bloque le save si niveau non-discoveryReady (ceinture)", () => {
    expect(client).toMatch(/discoveryReady/);
  });
  it("Racines · early return si RACINES_OFFERS_AVAILABLE=false", () => {
    expect(client).toMatch(/RACINES_OFFERS_AVAILABLE/);
    expect(client).toMatch(/kind="empty"/);
  });
  it("aucune commande payée / entitlement / paiement provider", () => {
    expect(client).not.toMatch(/\/api\/orders\b/);
    expect(client).not.toMatch(/AccessGrant/);
    expect(client).not.toMatch(/cinetpay|stripe/i);
    expect(client).not.toMatch(/Paiement réussi|Payment succeeded|Compte activé/i);
  });
});

describe("API /api/funnel · hardening (nouvelles clés + role check)", () => {
  const route = read("src/app/api/funnel/route.ts");
  it("accepte selfAssessmentAnswer, declaredLevel, recommendedLevel", () => {
    expect(route).toMatch(/"selfAssessmentAnswer"/);
    expect(route).toMatch(/"declaredLevel"/);
    expect(route).toMatch(/"recommendedLevel"/);
  });
  it("valide selfAssessmentAnswer sur 1..5", () => {
    expect(route).toMatch(/n < 1 \|\| n > 5/);
  });
  it("valide declaredLevel cohérent avec l'univers", () => {
    expect(route).toMatch(/Monde: declaredLevel must be CEFR/);
    expect(route).toMatch(/Racines: declaredLevel must be E1..E5/);
  });
  it("refuse un non-STUDENT (FORBIDDEN_NOT_STUDENT)", () => {
    expect(route).toMatch(/FORBIDDEN_NOT_STUDENT/);
    expect(route).toMatch(/role:\s*["']STUDENT["']/);
  });
  it("mirror currentLevel pour Monde à partir de declaredLevel", () => {
    expect(route).toMatch(/patch\.declaredLevel \?\? patch\.cefrSelfAssessed/);
  });
});

describe("Onboarding forms · ne dérivent plus de niveau du startPoint", () => {
  const monde = read("src/app/[locale]/onboarding/monde/OnboardingMondeForm.tsx");
  const racines = read("src/app/[locale]/onboarding/racines/OnboardingRacinesForm.tsx");
  it("Monde form ne PATCH plus cefrSelfAssessed depuis le startPoint", () => {
    expect(monde).not.toMatch(/patch:\s*\{\s*cefrSelfAssessed/);
  });
  it("Racines form ne PATCH plus racinesStep depuis le startPoint", () => {
    expect(racines).not.toMatch(/patch:\s*\{\s*racinesStep/);
  });
});
