import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { INTERNAL_PERSONA_IDS } from "@/lib/internalPersona";
import { INTERNAL_PERSONA_UI_CONTRACTS } from "@/features/dashboards/internal-test/contracts";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

const REQUIRED: Record<(typeof INTERNAL_PERSONA_IDS)[number], string[]> = {
  student_monde: ["accueil", "objectif", "progression", "mes-devoirs", "mon-cours", "mon-parcours", "ma-classe", "messages"],
  student_racines: ["accueil", "mot-du-jour", "mes-etapes", "ecoutes", "mon-coach", "cercle", "messages"],
  teacher: ["accueil", "corrections", "classes", "devoirs", "ressources", "messages"],
  coach: ["accueil", "seances-du-jour", "apprenants", "seances", "messages", "notes"],
  center_admin: ["centre", "a-traiter", "eleves", "enseignants", "classes", "facturation", "factures", "messages", "parametres"],
  super_admin: ["console", "comptes", "audit", "environnement"],
  family: ["accueil", "enfants", "progression", "activite-prioritaire", "histoires-jeux", "seances", "paiements", "messages", "parametres"],
  child_monde: ["maison", "quete", "chemin", "missions", "recompense", "jeux", "histoires", "badges", "avec-adulte"],
  child_racines: ["case", "quete", "chemin", "missions", "contes", "chansons", "badges", "famille"],
};

describe("Internal persona dashboards · complete UI contract", () => {
  it("covers exactly the nine product personas", () => {
    expect(Object.keys(INTERNAL_PERSONA_UI_CONTRACTS)).toEqual(expect.arrayContaining([...INTERNAL_PERSONA_IDS]));
    expect(Object.keys(INTERNAL_PERSONA_UI_CONTRACTS)).toHaveLength(INTERNAL_PERSONA_IDS.length);
  });

  for (const persona of INTERNAL_PERSONA_IDS) {
    it(`${persona} exposes every mandatory section with real demo rows`, () => {
      const contract = INTERNAL_PERSONA_UI_CONTRACTS[persona];
      const ids = contract.sections.map((section) => section.id);
      expect(ids).toEqual(expect.arrayContaining(REQUIRED[persona]));
      expect(new Set(ids).size).toBe(ids.length);
      expect(contract.tabs.length).toBeGreaterThanOrEqual(4);
      expect(contract.sections.length).toBeGreaterThanOrEqual(4);

      for (const section of contract.sections) {
        expect(section.title.fr.length).toBeGreaterThan(0);
        expect(section.title.en.length).toBeGreaterThan(0);
        if (section.kind === "hero") {
          expect(section.cta?.fr.length).toBeGreaterThan(0);
          expect(section.progress).toBeGreaterThanOrEqual(0);
        }
        if (["list", "timeline", "chat", "status"].includes(section.kind)) {
          expect(section.rows?.length).toBeGreaterThan(0);
        }
        if (section.kind === "metrics") {
          expect(section.metrics?.length).toBeGreaterThan(0);
        }
      }
    });
  }

  it("wires every production persona route to the isolated complete renderer", () => {
    const routes = [
      "src/app/[locale]/dashboard/page.tsx",
      "src/app/[locale]/teacher/page.tsx",
      "src/app/[locale]/coach/racines/page.tsx",
      "src/app/[locale]/center/page.tsx",
      "src/app/[locale]/admin/page.tsx",
      "src/app/[locale]/family/page.tsx",
    ];
    for (const route of routes) {
      const source = read(route);
      expect(source).toContain("resolveActiveInternalPersona");
      expect(source).toContain("InternalPersonaDashboard");
    }
  });

  it("keeps the unauthenticated visual audit preview-only", () => {
    const preview = read("src/app/[locale]/_internal-persona-preview/[persona]/page.tsx");
    const api = read("src/app/api/internal-test/persona-ui-contracts/route.ts");
    expect(preview).toContain('process.env.VERCEL_ENV === "production"');
    expect(preview).toContain("notFound()");
    expect(api).toContain('process.env.VERCEL_ENV === "production"');
    expect(api).toContain("status: 404");
  });
});
