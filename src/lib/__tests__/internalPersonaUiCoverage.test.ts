import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { INTERNAL_PERSONA_IDS } from "@/lib/internalPersona";
import { INTERNAL_PERSONA_UI_CONTRACTS } from "@/features/dashboards/internal-test/contracts";
import { PUBLIC_SURFACE } from "@/lib/release/publicSurface";
import { sanitizeInternalNext } from "@/lib/authRedirect";
import { computeMondeAccess } from "@/lib/monde";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

const DIRECT_ROUTES = [
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
    for (const route of DIRECT_ROUTES) {
      const source = read(route);
      expect(source).toContain("activeSectionId={section}");
      expect(source).toContain("InternalPersonaDashboard");
    }
    const learnerRoute = read("src/app/[locale]/dashboard/view/[section]/page.tsx");
    const learnerResolver = read("src/features/dashboards/live/LiveStudentSectionRoute.tsx");
    expect(learnerRoute).toContain("LiveStudentSectionRoute");
    expect(learnerRoute).toContain("sectionId={section}");
    expect(learnerResolver).toContain("InternalPersonaDashboard");
    expect(learnerResolver).toContain("activeSectionId={sectionId}");
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

  it("keeps commercial surfaces out of the technical beta navigation", () => {
    expect(PUBLIC_SURFACE.pricing.status).toBe("HIDDEN");
    expect(PUBLIC_SURFACE.centers.status).toBe("PRIVATE");

    const familyNav = read("src/features/dashboards/family/nav.ts");
    const familyDashboard = read("src/features/dashboards/family/FamilyDashboard.tsx");
    const familyOverview = read("src/features/dashboards/family/sections/FamilyOverviewSection.tsx");
    expect(familyNav).not.toContain('key: "payments"');
    expect(familyNav).not.toContain("#paiements");
    expect(familyDashboard).not.toContain("FamilyPaymentsSection");
    expect(familyDashboard).not.toContain('"paiements"');
    expect(familyOverview).not.toContain("noSeatCta");

    const centerNav = read("src/features/dashboards/center/nav.ts");
    const centerDashboard = read("src/features/dashboards/center/CenterDashboard.tsx");
    expect(centerNav).not.toContain('key: "billing"');
    expect(centerNav).not.toContain("#facturation");
    expect(centerDashboard).not.toContain('"facturation"');
    expect(centerDashboard).not.toContain('"factures"');

    const register = read("src/app/[locale]/register/page.tsx");
    const registerLayout = read("src/app/[locale]/register/layout.tsx");
    expect(register).not.toContain('searchParams.get("plan")');
    expect(register).not.toContain('searchParams.get("prof")');
    expect(register).not.toContain("PLAN_LABEL_");
    expect(registerLayout).not.toContain("credit card");
    expect(registerLayout).not.toContain("carte bancaire");

    const racinesOverview = read("src/features/dashboards/student-racines/sections/OverviewSection.tsx");
    expect(racinesOverview).not.toContain("/activation-intent");
    expect(racinesOverview).not.toContain("noAccessCta");

    const lessonPage = read("src/app/[locale]/learn/[courseId]/[unitId]/[lessonId]/page.tsx");
    expect(lessonPage).not.toContain("/offers");
  });

  it("keeps auth returns internal and A1 beta access non-persistent", () => {
    expect(sanitizeInternalNext("/fr/dashboard", "/fallback")).toBe("/fr/dashboard");
    expect(sanitizeInternalNext("https://example.com", "/fallback")).toBe("/fallback");
    expect(sanitizeInternalNext("//example.com", "/fallback")).toBe("/fallback");

    const betaAccess = computeMondeAccess([], { technicalBetaA1: true });
    expect(betaAccess.status).toBe("ACTIVE");
    expect(betaAccess.level).toBe("A1");
    expect(betaAccess.source).toBe("TECHNICAL_BETA");

    const mondeTypes = read("src/features/dashboards/student-monde/types.ts");
    const mondeDashboard = read("src/features/dashboards/student-monde/StudentMondeDashboard.tsx");
    expect(mondeTypes).toContain('"TECHNICAL_BETA"');
    expect(mondeDashboard).toContain('data.access.source === "TECHNICAL_BETA"');
  });

  it("preserves exact protected course routes through login", () => {
    const server = read("src/lib/course-content/server.ts");
    const overview = read("src/app/[locale]/learn/[courseId]/page.tsx");
    const unit = read("src/app/[locale]/learn/[courseId]/[unitId]/page.tsx");
    const lesson = read("src/app/[locale]/learn/[courseId]/[unitId]/[lessonId]/page.tsx");
    const courseSection = read("src/features/dashboards/student-monde/sections/CourseSection.tsx");

    expect(server).toContain('login?next=${encodeURIComponent(returnPath)}');
    expect(overview).toContain('`/${locale}/learn/${courseId}`');
    expect(unit).toContain('`/${locale}/learn/${courseId}/${unitId}`');
    expect(lesson).toContain('`/${locale}/learn/${courseId}/${unitId}/${lessonId}`');
    expect(courseSection).toContain('const statusLabel = locked');
    expect(courseSection).toContain('const statusTone = locked');
  });

  it("keeps public metadata truthful and locale system states available", () => {
    const layout = read("src/app/[locale]/layout.tsx");
    const errorState = read("src/app/[locale]/error.tsx");
    const loadingState = read("src/app/[locale]/loading.tsx");
    const notFoundState = read("src/app/[locale]/not-found.tsx");

    expect(layout).not.toContain("correction en direct");
    expect(layout).not.toContain("live correction");
    expect(layout).not.toContain("simulations réalistes");
    expect(layout).not.toContain("realistic simulations");
    expect(layout).toContain("premier parcours complet disponible est l'allemand A1");
    expect(layout).toContain("first complete course currently available is German A1");

    expect(errorState).toContain('onClick={reset}');
    expect(errorState).toContain("useLocale");
    expect(loadingState).toContain('aria-busy="true"');
    expect(notFoundState).toContain("getLocale");
    expect(notFoundState).toContain('href={`/${isEn ? "en" : "fr"}`}');
  });
});
