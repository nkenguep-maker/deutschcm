// Garde-fou · aucun `router.push(\`/${locale}/…\`)` sur un router importé
// depuis `@/navigation` (déjà locale-aware). Voir AUDIT.md §10 · ROUT-002.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const FILES = [
  "src/app/[locale]/login/page.tsx",
  "src/components/Layout.tsx",
  "src/components/TeacherLayout.tsx",
  "src/components/CenterLayout.tsx",
];

describe("navigation double-locale absent des chemins @/navigation", () => {
  for (const rel of FILES) {
    it(rel, () => {
      const abs = join(process.cwd(), rel);
      const source = readFileSync(abs, "utf8");
      const usesNavigationRouter =
        /from ["']@\/navigation["']/.test(source) && /useRouter/.test(source);
      if (!usesNavigationRouter) return;
      // Aucun router.push/replace ne doit interpoler la locale sur un router @/navigation.
      const bad = source.match(/router\.(push|replace)\(\s*`\/\$\{locale\}/g);
      expect(bad, `${rel} pousse une locale explicite sur un router @/navigation`).toBeNull();
    });
  }
});
