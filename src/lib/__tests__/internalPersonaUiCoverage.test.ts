import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { INTERNAL_PERSONA_IDS } from "@/lib/internalPersona";
import { INTERNAL_PERSONA_UI_CONTRACTS } from "@/features/dashboards/internal-test/contracts";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

const ROUTES = [
  "src/app/[locale]/dashboard/view/[section]/page.tsx",
  "src/app/[locale]/teacher/view/[section]/page.tsx",
  "src/app/[locale]/coach/racines/view/[section]/page.tsx",
  "src/app/[locale]/center/view/[section]/page.tsx",
  "src/app/[locale]/admin/view/[section]/page.tsx",
  "src/app/[locale]/family/view/[section]/page.tsx",
];

describe("Internal persona dashboards · dedicated pages", () => {
  it("covers all nine personas and keeps each tab routable", () => {
    expect(Object.keys(INTERNAL_PERSONA_UI_CONTRACTS)).toHaveLength(INTERNAL_PERSONA_IDS.length);

    for (const persona of INTERNAL_PERSONA_IDS) {
      const contract = INTERNAL_PERSONA_UI_CONTRACTS[persona];
      const ids = contract.sections.map((section) => section.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(contract.tabs.length).toBeGreaterThanOrEqual(4);
      expect(contract.sections.length).toBeGreaterThanOrEqual(4);
      for (const tab of contract.tabs) expect(ids).toContain(tab.id);
      for (const section of contract.sections) {
        expect(section.title.fr.length).toBeGreaterThan(0);
        expect(section.title.en.length).toBeGreaterThan(0);
        if (["list", "timeline", "chat", "status"].includes(section.kind)) {
          expect(section.rows?.length).toBeGreaterThan(0);
        }
        if (section.kind === "metrics") expect(section.metrics?.length).toBeGreaterThan(0);
      }
    }
  });

  it("adds one section route to every persona space", () => {
    for (const route of ROUTES) {
      const source = read(route);
      expect(source).toContain("InternalPersonaSectionRoute");
      expect(source).toContain("sectionId={section}");
    }

    const renderer = read("src/features/dashboards/internal-test/InternalPersonaDashboard.tsx");
    expect(renderer).toContain("/view/${sectionId}");
    expect(renderer).toContain("data-persona-active-section");
    expect(renderer).toContain("<PersonaSection section={activeSection}");
  });

  it("audits every preview page and keeps it disabled in production", () => {
    const preview = read("src/app/[locale]/qa/persona-preview/[persona]/page.tsx");
    const sectionPreview = read("src/app/[locale]/qa/persona-preview/[persona]/view/[section]/page.tsx");
    const audit = read("src/app/api/internal-test/persona-render-audit/route.ts");

    expect(preview).toContain("baseHrefOverride");
    expect(sectionPreview).toContain('process.env.VERCEL_ENV === "production"');
    expect(sectionPreview).toContain("activeSectionId={section}");
    expect(audit).toContain("data-persona-active-section");
    expect(audit).toContain("unexpectedSections");
    expect(audit).toContain("redirectedToLogin");
  });
});
