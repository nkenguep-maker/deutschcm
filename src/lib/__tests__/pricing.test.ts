// P0.A · Tarifs YEMA alignés doctrine §17 · doctrine « Suivi humain Racines ».
//
// Ces tests garantissent qu'aucun refactor ne peut dériver silencieusement de
// la grille officielle : Monde A1-C1 (XAF/EUR), Racines Solo/Famille, add-on
// coach de langue Racines. Ils vivent en test unitaire car la source de vérité
// des prix est src/lib/pricing.ts, importée par toutes les pages tarifaires.

import { describe, it, expect } from "vitest";
import {
  WORLD_PASSAGE_PRICES,
  WORLD_TEACHER_ADD,
  AFRICAN_SOLO,
  AFRICAN_FAMILY,
  RACINES_COACH_ADDON,
  RACINES_COACH_OPERATIONAL,
  LEVELS,
} from "../pricing";

describe("Monde · Le Passage · grille doctrine §17", () => {
  it("A1 → 49 000 FCFA / 75 €", () => {
    expect(WORLD_PASSAGE_PRICES.A1).toEqual({ fcfa: 49000, eur: 75 });
  });
  it("A2 → 55 000 FCFA / 79 €", () => {
    expect(WORLD_PASSAGE_PRICES.A2).toEqual({ fcfa: 55000, eur: 79 });
  });
  it("B1 → 59 000 FCFA / 89 €", () => {
    expect(WORLD_PASSAGE_PRICES.B1).toEqual({ fcfa: 59000, eur: 89 });
  });
  it("B2 → 69 000 FCFA / 109 €", () => {
    expect(WORLD_PASSAGE_PRICES.B2).toEqual({ fcfa: 69000, eur: 109 });
  });
  it("C1 → 79 000 FCFA / 129 €", () => {
    expect(WORLD_PASSAGE_PRICES.C1).toEqual({ fcfa: 79000, eur: 129 });
  });

  it("couvre tous les niveaux LEVELS", () => {
    for (const lvl of LEVELS) {
      expect(WORLD_PASSAGE_PRICES[lvl]).toBeDefined();
      expect(WORLD_PASSAGE_PRICES[lvl].fcfa).toBeGreaterThan(0);
      expect(WORLD_PASSAGE_PRICES[lvl].eur).toBeGreaterThan(0);
    }
  });

  it("progression monotone A1 → C1 (XAF)", () => {
    let previous = 0;
    for (const lvl of LEVELS) {
      expect(WORLD_PASSAGE_PRICES[lvl].fcfa).toBeGreaterThan(previous);
      previous = WORLD_PASSAGE_PRICES[lvl].fcfa;
    }
  });

  it("progression monotone A1 → C1 (EUR)", () => {
    let previous = 0;
    for (const lvl of LEVELS) {
      expect(WORLD_PASSAGE_PRICES[lvl].eur).toBeGreaterThan(previous);
      previous = WORLD_PASSAGE_PRICES[lvl].eur;
    }
  });
});

describe("Monde · supplément professeur", () => {
  it("expose un supplément pour chaque niveau", () => {
    for (const lvl of LEVELS) {
      expect(WORLD_TEACHER_ADD[lvl]).toBeDefined();
      expect(WORLD_TEACHER_ADD[lvl].fcfa).toBeGreaterThan(0);
    }
  });
});

describe("Racines · Solo · Famille", () => {
  it("Solo · 3 500 FCFA / mois · 35 000 FCFA / an", () => {
    expect(AFRICAN_SOLO.fcfa).toEqual({ month: 3500, year: 35000 });
  });
  it("Solo · 9,90 € / mois · 99 € / an", () => {
    expect(AFRICAN_SOLO.eur).toEqual({ month: 9.9, year: 99 });
  });
  it("Famille · 9 900 FCFA / mois · 99 000 FCFA / an", () => {
    expect(AFRICAN_FAMILY.fcfa).toEqual({ month: 9900, year: 99000 });
  });
  it("Famille · 19,90 € / mois · 149 € / an", () => {
    expect(AFRICAN_FAMILY.eur).toEqual({ month: 19.9, year: 149 });
  });
});

describe("Racines · coach de langue · add-on", () => {
  it("prix unique 30 000 FCFA / 45 € par mois, par personne accompagnée", () => {
    expect(RACINES_COACH_ADDON).toEqual({ fcfa: 30000, eur: 45 });
  });
  it("n'est pas encore opérationnel — pas de paiement autorisé", () => {
    expect(RACINES_COACH_OPERATIONAL).toBe(false);
  });
});
