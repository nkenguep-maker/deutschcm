// P1 hardening · Tests de l'auto-évaluation 5 options Monde + Racines.

import { describe, it, expect } from "vitest";
import {
  MONDE_OPTIONS,
  RACINES_OPTIONS,
  recommendMondeLevel,
  recommendRacinesStep,
} from "../self-assessment";

describe("Auto-évaluation Monde · 5 options CECR", () => {
  it("expose exactement 5 options numérotées 1..5", () => {
    expect(MONDE_OPTIONS).toHaveLength(5);
    expect(MONDE_OPTIONS.map((o) => o.id).sort()).toEqual([1, 2, 3, 4, 5]);
  });
  it("chaque option a un label FR et EN non vides", () => {
    for (const o of MONDE_OPTIONS) {
      expect(o.labelFr.length).toBeGreaterThan(10);
      expect(o.labelEn.length).toBeGreaterThan(10);
    }
  });
  it("chaque option pointe vers un niveau CECR A1..C1", () => {
    const cefr = ["A1", "A2", "B1", "B2", "C1"];
    for (const o of MONDE_OPTIONS) {
      expect(cefr).toContain(o.level);
    }
  });
  it("aucune option Monde ne renvoie É1-É5", () => {
    for (const o of MONDE_OPTIONS) {
      expect(o.level).not.toMatch(/^E[1-5]$/);
    }
  });
});

describe("Auto-évaluation Racines · 5 options É1-É5", () => {
  it("expose exactement 5 options numérotées 1..5", () => {
    expect(RACINES_OPTIONS).toHaveLength(5);
    expect(RACINES_OPTIONS.map((o) => o.id).sort()).toEqual([1, 2, 3, 4, 5]);
  });
  it("chaque option pointe vers une étape É1..É5", () => {
    const steps = ["E1", "E2", "E3", "E4", "E5"];
    for (const o of RACINES_OPTIONS) {
      expect(steps).toContain(o.level);
    }
  });
  it("aucune option Racines n'affiche A1..C1", () => {
    for (const o of RACINES_OPTIONS) {
      expect(o.labelFr).not.toMatch(/\bA1\b|\bA2\b|\bB1\b|\bB2\b|\bC1\b/);
      expect(o.labelEn).not.toMatch(/\bA1\b|\bA2\b|\bB1\b|\bB2\b|\bC1\b/);
    }
  });
  it("chaque option a un label FR et EN non vides", () => {
    for (const o of RACINES_OPTIONS) {
      expect(o.labelFr.length).toBeGreaterThan(10);
      expect(o.labelEn.length).toBeGreaterThan(10);
    }
  });
});

describe("Recommandation · declared = recommended (P1 initial)", () => {
  it("recommendMondeLevel retourne le niveau déclaré", () => {
    expect(recommendMondeLevel("A1")).toBe("A1");
    expect(recommendMondeLevel("B2")).toBe("B2");
  });
  it("recommendRacinesStep retourne l'étape déclarée", () => {
    expect(recommendRacinesStep("E1")).toBe("E1");
    expect(recommendRacinesStep("E4")).toBe("E4");
  });
});
