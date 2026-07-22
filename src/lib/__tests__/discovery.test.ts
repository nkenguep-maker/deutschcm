// P1 · Contenu de découverte · doctrine §14-15.

import { describe, it, expect } from "vitest";
import {
  LANGUAGES,
  DISCOVERY_LESSONS,
  DISCOVERY_TOTAL,
  getDiscoveryLessons,
  getDiscoveryLesson,
  isLanguageActive,
  languagesForUniverse,
  prismaLangToId,
} from "../discovery";

describe("Statut des langues · Monde vs Racines", () => {
  it("deutsch est la seule langue active pour l'instant", () => {
    const actives = LANGUAGES.filter((l) => l.status === "active");
    expect(actives).toHaveLength(1);
    expect(actives[0].id).toBe("deutsch");
    expect(actives[0].universe).toBe("MONDE");
  });

  it("Aucune langue Racines n'est active tant que le contenu manque", () => {
    const activeRacines = LANGUAGES.filter((l) => l.status === "active" && l.universe === "RACINES");
    expect(activeRacines).toHaveLength(0);
  });

  it("languagesForUniverse liste Monde et Racines séparément", () => {
    const monde = languagesForUniverse("MONDE");
    const racines = languagesForUniverse("RACINES");
    expect(monde.every((l) => l.universe === "MONDE")).toBe(true);
    expect(racines.every((l) => l.universe === "RACINES")).toBe(true);
    expect(monde.length + racines.length).toBe(LANGUAGES.length);
  });
});

describe("isLanguageActive", () => {
  it("true pour deutsch", () => expect(isLanguageActive("deutsch")).toBe(true));
  it("false pour wolof", () => expect(isLanguageActive("wolof")).toBe(false));
  it("false pour une langue inconnue", () => expect(isLanguageActive("klingon")).toBe(false));
});

describe("Contenu de découverte · exactement 4 leçons pour chaque langue active", () => {
  for (const lang of LANGUAGES.filter((l) => l.status === "active")) {
    it(`${lang.id} a exactement 4 leçons complètes`, () => {
      const lessons = getDiscoveryLessons(lang.id);
      expect(lessons).not.toBeNull();
      expect(lessons).toHaveLength(DISCOVERY_TOTAL);
      // Numérotation 1..4 exhaustive
      expect(lessons!.map((l) => l.n).sort()).toEqual([1, 2, 3, 4]);
    });

    it(`${lang.id} chaque leçon a titre, objectif, vocab et au moins 1 exercice`, () => {
      const lessons = getDiscoveryLessons(lang.id)!;
      for (const l of lessons) {
        expect(l.title.length).toBeGreaterThan(0);
        expect(l.titleEn.length).toBeGreaterThan(0);
        expect(l.objective.length).toBeGreaterThan(0);
        expect(l.vocab.length).toBeGreaterThanOrEqual(3);
        expect(l.exercises.length).toBeGreaterThanOrEqual(1);
        for (const ex of l.exercises) {
          expect(ex.correctIndex).toBeGreaterThanOrEqual(0);
          expect(ex.correctIndex).toBeLessThan(ex.options.length);
          expect(ex.explanation.length).toBeGreaterThan(0);
        }
      }
    });
  }

  it("DISCOVERY_TOTAL vaut 4 (doctrine §14)", () => {
    expect(DISCOVERY_TOTAL).toBe(4);
  });

  it("getDiscoveryLesson renvoie null pour une langue inactive", () => {
    expect(getDiscoveryLesson("wolof", 1)).toBeNull();
  });

  it("getDiscoveryLesson renvoie null pour un numéro hors 1..4", () => {
    expect(getDiscoveryLesson("deutsch", 5)).toBeNull();
    expect(getDiscoveryLesson("deutsch", 0)).toBeNull();
  });

  it("DISCOVERY_LESSONS ne référence que deutsch", () => {
    const keys = Object.keys(DISCOVERY_LESSONS);
    expect(keys).toEqual(["deutsch"]);
  });
});

describe("prismaLangToId · conversion enum → id", () => {
  it("DEUTSCH → deutsch", () => expect(prismaLangToId("DEUTSCH")).toBe("deutsch"));
  it("WOLOF → wolof", () => expect(prismaLangToId("WOLOF")).toBe("wolof"));
  it("null → null", () => expect(prismaLangToId(null)).toBe(null));
});

describe("Contenu · honnêteté pédagogique", () => {
  const deutsch = getDiscoveryLessons("deutsch")!;
  it("aucun texte lorem ipsum, faux prof ou coach IA", () => {
    const all = JSON.stringify(deutsch);
    expect(all).not.toMatch(/lorem ipsum/i);
    expect(all).not.toMatch(/Sophie Tanda|Prof\. Sophie|Herr Kwessi/);
    expect(all).not.toMatch(/coach ia|ai coach|assistant ia/i);
  });
  it("aucun audio inventé sans src", () => {
    for (const l of deutsch) {
      if (l.audio) {
        expect(l.audio.src.length).toBeGreaterThan(0);
        expect(l.audio.durationSec).toBeGreaterThan(0);
      }
    }
  });
});
