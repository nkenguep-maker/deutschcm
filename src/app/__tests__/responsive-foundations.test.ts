// P0.B · Garde-fous responsive des vues authentifiées.
//
// Vérifie par lecture de source que les pages centre + admin qui avaient
// été flaggées en overflow par la baseline P-1 (docs/YEMA_AUTHENTICATED_BASELINE.md)
// utilisent bien les primitives responsive introduites par ce lot, et n'ont
// PAS réintroduit les patterns fixes qui causaient l'overflow.
//
// L'objectif : prévenir la régression sans se noyer dans le rendu React.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function read(rel: string): string {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

const RESPONSIVE_ROUTES = [
  "src/app/[locale]/center/students/page.tsx",
  "src/app/[locale]/center/teachers/page.tsx",
  "src/app/[locale]/admin/users/page.tsx",
];

describe("Tableaux desktop + mobile · une source, deux rendus", () => {
  for (const rel of RESPONSIVE_ROUTES) {
    it(`${rel} · desktop wrap ET liste mobile`, () => {
      const src = read(rel);
      expect(src, `${rel} doit garder le tableau desktop`).toMatch(
        /className=("|`|')[^"`']*\bdesktop-only\b[^"`']*("|`|')/,
      );
      expect(src, `${rel} doit rendre une liste mobile parallèle`).toMatch(
        /className=("|`|')[^"`']*\bmobile-only\b[^"`']*("|`|')/,
      );
      expect(src, `${rel} doit utiliser la carte de donnée mobile`).toMatch(
        /data-card/,
      );
    });
  }
});

describe("Filtres · plus de largeurs fixes 150/170/200", () => {
  for (const rel of [
    "src/app/[locale]/center/students/page.tsx",
    "src/app/[locale]/center/classes/page.tsx",
    "src/app/[locale]/admin/users/page.tsx",
  ]) {
    it(`${rel} · aucun width:200/150/170 sur select/input`, () => {
      const src = read(rel);
      // Les patterns antérieurs qu'on interdit désormais dans ces fichiers.
      expect(src).not.toMatch(/width:\s*200(?!px)/);
      expect(src).not.toMatch(/width:\s*150(?!px)/);
      expect(src).not.toMatch(/width:\s*170(?!px)/);
      expect(src, `${rel} doit utiliser .filter-row`).toMatch(
        /className=("|`|')[^"`']*\bfilter-row\b[^"`']*("|`|')/,
      );
    });
  }
});

describe("Texte long · anti-overflow explicite", () => {
  it("center/students : email dans .text-wrap-anywhere", () => {
    const src = read("src/app/[locale]/center/students/page.tsx");
    expect(src).toMatch(/text-wrap-anywhere/);
  });
  it("admin/users : email dans .text-wrap-anywhere", () => {
    const src = read("src/app/[locale]/admin/users/page.tsx");
    expect(src).toMatch(/text-wrap-anywhere/);
  });
  it("group : nom + créateur dans overflowWrap anywhere", () => {
    const src = read("src/app/[locale]/group/page.tsx");
    expect(src).toMatch(/overflowWrap:\s*["']anywhere["']/);
  });
});

describe("Admin dashboard · grilles fluides", () => {
  const src = read("src/app/[locale]/admin/page.tsx");
  it("KPIs ne sont plus figés en 5 colonnes", () => {
    expect(src).not.toMatch(/gridTemplateColumns:\s*["']repeat\(5,1fr\)["']/);
  });
  it("KPIs utilisent auto-fit minmax", () => {
    expect(src).toMatch(/repeat\(auto-fit,\s*minmax\(140px/);
  });
  it("Charts ne sont plus figés en 2fr 1fr", () => {
    expect(src).not.toMatch(/gridTemplateColumns:\s*["']2fr 1fr["']/);
  });
});

describe("Safe-area et viewport", () => {
  const rootLayout = read("src/app/layout.tsx");
  it("root layout exporte viewport-fit=cover", () => {
    expect(rootLayout).toMatch(/viewportFit:\s*["']cover["']/);
  });
  it("root layout typé Viewport", () => {
    expect(rootLayout).toMatch(/import type \{[^}]*Viewport[^}]*\} from ["']next["']/);
  });

  const css = read("src/app/globals.css");
  it(".app-sidebar honore safe-area", () => {
    expect(css).toMatch(/\.app-sidebar[\s\S]*?env\(safe-area-inset-top\)/);
  });
  it(".app-header honore safe-area", () => {
    expect(css).toMatch(/\.app-header[\s\S]*?env\(safe-area-inset-top\)/);
  });
  it("utilitaires safe-area exposés", () => {
    expect(css).toMatch(/\.safe-area-top\s*\{[^}]*env\(safe-area-inset-top\)/);
    expect(css).toMatch(/\.safe-area-bottom\s*\{[^}]*env\(safe-area-inset-bottom\)/);
  });
});

describe("StateBlock · variantes offline et locked", () => {
  const src = read("src/components/StateBlock.tsx");
  it("type Kind inclut offline et locked", () => {
    expect(src).toMatch(/"offline"/);
    expect(src).toMatch(/"locked"/);
  });
  it("offline propage role=status et aria-live=polite", () => {
    expect(src).toMatch(/kind === "offline" \? "status"/);
  });

  const css = read("src/app/globals.css");
  it("classes state-offline et state-locked existent", () => {
    expect(css).toMatch(/\.state-offline\s*\{/);
    expect(css).toMatch(/\.state-locked\s*\{/);
  });

  it("/notifications rend l'état offline sur échec réseau", () => {
    const notifs = read("src/app/[locale]/notifications/page.tsx");
    expect(notifs).toMatch(/kind="offline"/);
  });
});
