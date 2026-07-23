// P3 · Garde-fous des pages/composants Racines · rendu honnête, ownership,
// aucune CECRL sur l'univers Racines.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function read(rel: string) {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

describe("DashboardRacines · état honnête", () => {
  const src = read("src/components/racines/DashboardRacines.tsx");

  it("consomme /api/me/racines-dashboard uniquement", () => {
    expect(src).toMatch(/\/api\/me\/racines-dashboard/);
  });
  it("aucune référence CECRL sur l'univers Racines (§8)", () => {
    // On tolère les tokens dans les emails ou identifiants techniques,
    // mais aucune chaîne visible A1..C1 ne doit apparaître.
    expect(src).not.toMatch(/["' >]A1[ <"']|A1["' <>]/);
    expect(src).not.toMatch(/["' >]A2[ <"']|A2["' <>]/);
    expect(src).not.toMatch(/["' >]B1[ <"']|B1["' <>]/);
    expect(src).not.toMatch(/["' >]C1[ <"']|C1["' <>]/);
  });
  it("annonce Solo OU Family (mode dérivé de children.length)", () => {
    expect(src).toMatch(/mode === "FAMILY"/);
    expect(src).toMatch(/modeSolo/);
    expect(src).toMatch(/modeFamily/);
  });
  it("expose 3 états StateBlock (loading, error, empty pour contenu absent)", () => {
    expect(src).toMatch(/kind="loading"/);
    expect(src).toMatch(/kind="error"/);
    expect(src).toMatch(/kind="empty"/);
  });
  it("aucun faux coach ni fausse messagerie · état honnête « bientôt »", () => {
    expect(src).not.toMatch(/Sophie Tanda|Prof\. Sophie|Marie N\./);
    expect(src).not.toMatch(/coach ia|ai coach|assistant ia/i);
    expect(src).toMatch(/coachSoon/);
    expect(src).toMatch(/circleSoon/);
  });
});

describe("API /api/me/racines-dashboard", () => {
  const src = read("src/app/api/me/racines-dashboard/route.ts");
  it("refuse anonyme (401)", () => {
    expect(src).toMatch(/UNAUTHORIZED/);
  });
  it("refuse non-STUDENT (403)", () => {
    expect(src).toMatch(/FORBIDDEN_NOT_STUDENT/);
  });
  it("ChildProfile filtré via parentUserId server-resolved", () => {
    expect(src).toMatch(/parentUserId:\s*dbUser\.id/);
  });
  it("filtre LearningPath sur universe=RACINES", () => {
    expect(src).toMatch(/universe:\s*"RACINES"/);
  });
  it("expose racinesStep + steps + langStatus + anyLanguageReady", () => {
    expect(src).toMatch(/racinesStep/);
    expect(src).toMatch(/RACINES_STEP_DEFINITIONS/);
    expect(src).toMatch(/langStatus/);
    expect(src).toMatch(/anyLanguageReady/);
  });
});

describe("Ownership et cross-household · /api/family/children (existant P1)", () => {
  const src = read("src/app/api/family/children/route.ts");
  it("parentUserId toujours résolu côté serveur, jamais depuis un ID client", () => {
    expect(src).toMatch(/parentUserId/);
    // Sanity check · le fichier ne prend pas parentUserId depuis le body
    // (le parent est retrouvé via getParent() qui lit la session Supabase).
    expect(src).toMatch(/getParent\(\)/);
  });
});

describe("Régression · P0.A/P1/P2 cleanups toujours honorés côté Racines", () => {
  const dash = read("src/components/racines/DashboardRacines.tsx");
  const api = read("src/app/api/me/racines-dashboard/route.ts");
  for (const [name, src] of [["DashboardRacines", dash], ["API", api]]) {
    it(`${name} · aucun coach IA / faux prof / faux paiement`, () => {
      expect(src).not.toMatch(/coach ia|ai coach|assistant ia/i);
      expect(src).not.toMatch(/Prof\. Sophie|Sophie Tanda|Marie N\./);
      expect(src).not.toMatch(/cinetpay|stripe|paypal/i);
      expect(src).not.toMatch(/AccessGrant\.create|prisma\.order\.create/);
    });
  }
});
