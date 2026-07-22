// P0.A · Aucune donnée fictive dans les vues authentifiées.
//
// Doctrine §31 (protection enfants) et §B (messagerie honnête) : tant qu'une
// fonctionnalité n'est pas branchée en runtime, on ne peuple pas l'écran avec
// des faux noms, faux messages, faux cours. Ces gardes lisent les fichiers
// sources concernés pour bloquer toute résurgence.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function read(rel: string): string {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

describe("ClassroomChat · pas d'activité fictive tant que la messagerie n'est pas branchée", () => {
  const src = read("src/components/ClassroomChat.tsx");

  it("ne référence plus les noms de démo pré-existants", () => {
    expect(src).not.toMatch(/Sophie Tanda/);
    expect(src).not.toMatch(/Marie N\./);
  });

  it("n'initialise plus de messages hard-codés", () => {
    // On tolère la déclaration d'un type / d'un state, mais aucun tableau
    // pré-rempli de messages ne doit apparaître.
    expect(src).not.toMatch(/INITIAL_MESSAGES\s*[:=]/);
  });

  it("affiche un StateBlock empty tant que la messagerie n'est pas active", () => {
    expect(src).toMatch(/StateBlock/);
    expect(src).toMatch(/kind=["']empty["']/);
  });
});

describe("Admin generate · aucun cours fictif au démarrage", () => {
  const src = read("src/app/[locale]/admin/courses/generate/page.tsx");

  it("SAVED_COURSES démarre vide", () => {
    expect(src).toMatch(/SAVED_COURSES:\s*SavedCourse\[\]\s*=\s*\[\]/);
  });

  it("ne mentionne plus les brouillons factices Netzwerk L1/L2 dans SAVED_COURSES", () => {
    const savedBlock = src.match(/SAVED_COURSES[\s\S]*?;/);
    expect(savedBlock).not.toBeNull();
    expect(savedBlock![0]).not.toMatch(/Guten Tag!/);
    expect(savedBlock![0]).not.toMatch(/Meine Familie/);
  });
});

describe("VoiceRecorder · honnêteté sur l'analyse IA", () => {
  const src = read("src/components/VoiceRecorder.tsx");

  it("annonce l'analyse vocale comme bientôt disponible", () => {
    expect(src).toMatch(/bientôt disponible/i);
  });

  it("ne branche ni MediaRecorder ni API de correction IA", () => {
    // Le composant ne doit pas ouvrir le micro ni pousser vers un service.
    expect(src).not.toMatch(/new MediaRecorder/);
    expect(src).not.toMatch(/navigator\.mediaDevices/);
    expect(src).not.toMatch(/getUserMedia/);
    // Aucun POST vers un endpoint /transcribe ou /score.
    expect(src).not.toMatch(/fetch\(\s*["']\/api\/(voice|speech|transcribe|score)/);
  });
});
