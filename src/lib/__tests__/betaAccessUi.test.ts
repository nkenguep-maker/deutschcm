import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

describe("technical beta access UI", () => {
  it("never sends Racines learners to offers from the dashboard", () => {
    const overview = read("src/features/dashboards/student-racines/sections/OverviewSection.tsx");
    expect(overview).not.toContain("/activation-intent");
    expect(overview).not.toContain("noAccessCta");
    expect(overview).toContain("La bêta technique est ouverte");
  });

  it("does not advertise family offers when child creation is unavailable", () => {
    const family = read("src/features/dashboards/family/sections/FamilyOverviewSection.tsx");
    expect(family).not.toContain("noSeatCta");
    expect(family).toContain("temporairement indisponible pendant la bêta");
  });

  it("shows the technical beta source in the Monde dashboard", () => {
    const types = read("src/features/dashboards/student-monde/types.ts");
    const dashboard = read("src/features/dashboards/student-monde/StudentMondeDashboard.tsx");
    expect(types).toContain('"TECHNICAL_BETA"');
    expect(dashboard).toContain('data.access.source === "TECHNICAL_BETA"');
    expect(dashboard).toContain("Bêta technique · A1");
  });

  it("uses the effective lock state for course labels and tones", () => {
    const courseSection = read("src/features/dashboards/student-monde/sections/CourseSection.tsx");
    expect(courseSection).toContain('const locked = course.status === "LOCKED" || !active');
    expect(courseSection).toContain('const statusLabel = locked');
    expect(courseSection).toContain('const statusTone = locked');
  });

  it("preserves the exact protected course route through login", () => {
    const server = read("src/lib/course-content/server.ts");
    const overview = read("src/app/[locale]/learn/[courseId]/page.tsx");
    const unit = read("src/app/[locale]/learn/[courseId]/[unitId]/page.tsx");
    const lesson = read("src/app/[locale]/learn/[courseId]/[unitId]/[lessonId]/page.tsx");
    expect(server).toContain('login?next=${encodeURIComponent(returnPath)}');
    expect(overview).toContain('`/${locale}/learn/${courseId}`');
    expect(unit).toContain('`/${locale}/learn/${courseId}/${unitId}`');
    expect(lesson).toContain('`/${locale}/learn/${courseId}/${unitId}/${lessonId}`');
    expect(lesson).not.toContain("/offers");
  });

  it("overrides public registration metadata without commercial copy", () => {
    const layout = read("src/app/[locale]/register/layout.tsx");
    expect(layout).not.toContain("credit card");
    expect(layout).not.toContain("carte bancaire");
    expect(layout).toContain("create your YEMA space");
    expect(layout).toContain("créez votre espace YEMA");
  });
});
