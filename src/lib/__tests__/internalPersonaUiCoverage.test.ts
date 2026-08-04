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

const LIVE_DASHBOARDS = [
  "src/features/dashboards/student-monde/StudentMondeDashboard.tsx",
  "src/features/dashboards/student-racines/StudentRacinesDashboard.tsx",
  "src/features/dashboards/teacher/TeacherDashboard.tsx",
  "src/features/dashboards/coach-racines/CoachRacinesDashboard.tsx",
  "src/features/dashboards/center/CenterDashboard.tsx",
  "src/features/dashboards/family/FamilyDashboard.tsx",
  "src/features/dashboards/admin/AdminDashboard.tsx",
  "src/features/dashboards/child-monde/ChildMondeDashboard.tsx",
  "src/features/dashboards/child-racines/ChildRacinesDashboard.tsx",
];

describe("Persona dashboards · dedicated pages", () => {
  it("covers all nine internal personas and keeps each tab routable", () => {
    expect(Object.keys(INTERNAL_PERSONA_UI_CONTRACTS)).toHaveLength(INTERNAL_PERSONA_IDS.length);
    for (const persona of INTERNAL_PERSONA_IDS) {
      const contract = INTERNAL_PERSONA_UI_CONTRACTS[persona];
      const ids = contract.sections.map((section) => section.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const tab of contract.tabs) expect(ids).toContain(tab.id);
    }
  });

  it("serves both internal fixtures and authenticated live dashboards", () => {
    for (const route of ROUTES) {
      const source = read(route);
      expect(source).toContain("activeSectionId={section}");
      expect(source).toContain("InternalPersonaDashboard");
    }
    expect(read(ROUTES[0])).toContain("LiveStudentSectionRoute");
  });

  it("renders one live section at a time for every dashboard", () => {
    for (const dashboard of LIVE_DASHBOARDS) {
      const source = read(dashboard);
      expect(source).toContain("activeSectionId");
      expect(source).toContain("data-live-persona-section");
      expect(source).toContain("sectionPageHref");
    }
  });

  it("keeps QA previews disabled in production and audits every fixture page", () => {
    const preview = read("src/app/[locale]/qa/persona-preview/[persona]/page.tsx");
    const sectionPreview = read("src/app/[locale]/qa/persona-preview/[persona]/view/[section]/page.tsx");
    const audit = read("src/app/api/internal-test/persona-render-audit/route.ts");
    expect(preview).toContain("baseHrefOverride");
    expect(sectionPreview).toContain('process.env.VERCEL_ENV === "production"');
    expect(audit).toContain("data-persona-active-section");
    expect(audit).toContain("unexpectedSections");
  });
});
