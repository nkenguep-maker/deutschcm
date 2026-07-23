// P3 · Tests du seam Racines · étapes É1-É5 et statut opérationnel des langues.

import { describe, it, expect } from "vitest";
import {
  RACINES_STEPS,
  RACINES_STEP_DEFINITIONS,
  RACINES_LANG_STATUS,
  canAccessRacinesContent,
  racinesLanguagesWithStatus,
  anyRacinesLanguageReady,
  resolveRacinesAccessMode,
  summarizeRacinesHousehold,
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

describe("resolveRacinesAccessMode · source de vérité produit (P3 hardening §2)", () => {
  it("grant ROOTS_FAMILY actif → FAMILY (peu importe le nombre d'enfants)", () => {
    expect(resolveRacinesAccessMode({
      hasActiveGrant: true, grantProductCode: "ROOTS_FAMILY",
      hasLearningPath: true,
    })).toBe("FAMILY");
  });
  it("grant ROOTS_SOLO actif → SOLO même avec 4 enfants", () => {
    expect(resolveRacinesAccessMode({
      hasActiveGrant: true, grantProductCode: "ROOTS_SOLO",
      hasLearningPath: true,
    })).toBe("SOLO");
  });
  it("grant actif mais code inconnu → UNKNOWN (jamais devine)", () => {
    expect(resolveRacinesAccessMode({
      hasActiveGrant: true, grantProductCode: "PASSAGE",
      hasLearningPath: true,
    })).toBe("UNKNOWN");
  });
  it("activationIntent FAMILLE (P1) sans grant → FAMILY", () => {
    expect(resolveRacinesAccessMode({
      hasActiveGrant: false, activationIntentOffer: "FAMILLE",
      hasLearningPath: true,
    })).toBe("FAMILY");
  });
  it("activationIntent SOLO (P1) sans grant → SOLO", () => {
    expect(resolveRacinesAccessMode({
      hasActiveGrant: false, activationIntentOffer: "SOLO",
      hasLearningPath: true,
    })).toBe("SOLO");
  });
  it("aucun signal → NO_ACCESS (jamais SOLO par défaut)", () => {
    expect(resolveRacinesAccessMode({
      hasActiveGrant: false, hasLearningPath: true,
    })).toBe("NO_ACCESS");
  });
  it("le nombre d'enfants n'entre PAS dans la décision de mode", () => {
    // Aucun paramètre childrenCount dans resolveRacinesAccessMode.
    // Test structural · signature confirme l'invariant.
    const sig = resolveRacinesAccessMode.toString();
    expect(sig).not.toMatch(/childrenCount|children\.count/);
  });
});

describe("summarizeRacinesHousehold · détection d'incohérence", () => {
  it("SOLO + 0 enfants · pas d'incohérence", () => {
    expect(summarizeRacinesHousehold("SOLO", 0, false)).toEqual({
      childrenCount: 0, householdConfigured: false, incoherent: false,
    });
  });
  it("SOLO + 1 enfant · incohérence (à signaler, jamais convertir en FAMILY)", () => {
    const s = summarizeRacinesHousehold("SOLO", 1, false);
    expect(s.incoherent).toBe(true);
  });
  it("FAMILY + 0 enfants · pas d'incohérence (Famille vide autorisée)", () => {
    expect(summarizeRacinesHousehold("FAMILY", 0, true).incoherent).toBe(false);
  });
  it("FAMILY + 2 enfants · cohérent", () => {
    expect(summarizeRacinesHousehold("FAMILY", 2, true).incoherent).toBe(false);
  });
  it("NO_ACCESS + enfants · pas d'incohérence (le mode n'est pas SOLO)", () => {
    expect(summarizeRacinesHousehold("NO_ACCESS", 3, true).incoherent).toBe(false);
  });
});
