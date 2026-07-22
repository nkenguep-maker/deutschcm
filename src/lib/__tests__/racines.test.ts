// P3 · Tests du seam Racines · étapes É1-É5 et statut opérationnel des langues.

import { describe, it, expect } from "vitest";
import {
  RACINES_STEPS,
  RACINES_STEP_DEFINITIONS,
  RACINES_LANG_STATUS,
  canAccessRacinesContent,
  racinesLanguagesWithStatus,
  anyRacinesLanguageReady,
  inferProfileMode,
} from "../racines";

describe("Étapes Racines É1-É5", () => {
  it("expose exactement 5 étapes E1..E5", () => {
    expect(RACINES_STEPS).toEqual(["E1", "E2", "E3", "E4", "E5"]);
    expect(RACINES_STEP_DEFINITIONS).toHaveLength(5);
  });
  it("aucune référence CECRL dans les labels ou définitions", () => {
    for (const s of RACINES_STEP_DEFINITIONS) {
      const blob = `${s.labelFr} ${s.labelEn} ${s.descriptionFr} ${s.descriptionEn}`;
      expect(blob).not.toMatch(/\bA1\b|\bA2\b|\bB1\b|\bB2\b|\bC1\b/);
    }
  });
  it("chaque étape a une définition non vide FR + EN", () => {
    for (const s of RACINES_STEP_DEFINITIONS) {
      expect(s.labelFr.length).toBeGreaterThan(2);
      expect(s.labelEn.length).toBeGreaterThan(2);
      expect(s.descriptionFr.length).toBeGreaterThan(20);
      expect(s.descriptionEn.length).toBeGreaterThan(20);
    }
  });
  it("les 5 étapes couvrent les rôles doctrinaux (Écoute · Voix · Récit · Palabre · Foyer)", () => {
    const labels = RACINES_STEP_DEFINITIONS.map((s) => s.labelFr);
    expect(labels).toContain("Écoute");
    expect(labels).toContain("Voix");
    expect(labels).toContain("Récit");
    expect(labels).toContain("Palabre");
    expect(labels).toContain("Foyer");
  });
});

describe("Statut opérationnel des langues Racines", () => {
  it("toutes les langues Racines sont MISSING (aucun contenu seedé)", () => {
    for (const status of Object.values(RACINES_LANG_STATUS)) {
      expect(status).toBe("MISSING");
    }
  });
  it("anyRacinesLanguageReady = false tant qu'aucune n'est READY", () => {
    expect(anyRacinesLanguageReady()).toBe(false);
  });
  it("canAccessRacinesContent = false pour toutes les langues actuelles", () => {
    for (const langId of Object.keys(RACINES_LANG_STATUS)) {
      expect(canAccessRacinesContent(langId)).toBe(false);
    }
  });
  it("racinesLanguagesWithStatus renvoie toutes les langues Racines de LANGUAGES", () => {
    const list = racinesLanguagesWithStatus();
    expect(list.length).toBeGreaterThanOrEqual(4);
    for (const l of list) {
      expect(["READY", "PARTIAL", "MISSING"]).toContain(l.status);
    }
  });
});

describe("inferProfileMode", () => {
  it("0 enfant → SOLO", () => expect(inferProfileMode(0)).toBe("SOLO"));
  it("1+ enfant → FAMILY", () => {
    expect(inferProfileMode(1)).toBe("FAMILY");
    expect(inferProfileMode(4)).toBe("FAMILY");
  });
});
