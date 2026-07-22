// P0.A · Règles d'accès proxy — garde-fous doctrine.
//
// Le proxy Next 16 (src/proxy.ts) ne réexporte pas ses listes PUBLIC_ROUTES /
// PROTECTED_ROUTES (au design) ; on lit la source directement pour vérifier que
// les décisions produit clés restent visibles dans le code : /enseignants public
// et /famille restreint aux rôles STUDENT + ADMIN (pas TEACHER, pas CENTER).

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const PROXY_SRC = readFileSync(
  join(process.cwd(), "src/proxy.ts"),
  "utf8",
);

describe("proxy · route /enseignants", () => {
  it("est déclarée publique", () => {
    const publicBlockMatch = PROXY_SRC.match(
      /const PUBLIC_ROUTES = \[[\s\S]*?\]/,
    );
    expect(publicBlockMatch, "PUBLIC_ROUTES bloc introuvable").not.toBeNull();
    expect(publicBlockMatch![0]).toMatch(/["']\/enseignants["']/);
  });

  it("n'est PAS dans PROTECTED_ROUTES", () => {
    const protectedBlockMatch = PROXY_SRC.match(
      /const PROTECTED_ROUTES:[\s\S]*?\}\n/,
    );
    expect(protectedBlockMatch, "PROTECTED_ROUTES bloc introuvable").not.toBeNull();
    expect(protectedBlockMatch![0]).not.toMatch(/["']\/enseignants["']/);
  });
});

describe("proxy · route /famille (espace foyer parent)", () => {
  it("est déclarée protégée avec STUDENT + ADMIN uniquement", () => {
    const line = PROXY_SRC.match(
      /["']\/famille["']\s*:\s*\[[^\]]*\]/,
    );
    expect(line, "/famille n'est pas déclarée dans PROTECTED_ROUTES").not.toBeNull();
    const roles = line![0];
    expect(roles).toMatch(/["']STUDENT["']/);
    expect(roles).toMatch(/["']ADMIN["']/);
    expect(roles).not.toMatch(/["']TEACHER["']/);
    expect(roles).not.toMatch(/["']CENTER["']/);
  });

  it("appartient à l'espace STUDENT côté spaceForPath()", () => {
    expect(PROXY_SRC).toMatch(
      /pathname\.startsWith\(["']\/famille["']\)/,
    );
  });
});
