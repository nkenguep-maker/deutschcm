import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

describe("P0.13 · course access boundary", () => {
  it("never enables technical beta course access on Vercel Production", () => {
    const source = read("src/lib/release/technicalBeta.ts");
    const prodGuard = source.indexOf('if (env.VERCEL_ENV === "production") return false');
    const explicitTrue = source.indexOf('YEMA_TECHNICAL_BETA_COURSE_ACCESS === "true"');

    expect(prodGuard).toBeGreaterThan(-1);
    expect(explicitTrue).toBeGreaterThan(prodGuard);
    expect(source).toContain('env.VERCEL_ENV === "preview" || env.NODE_ENV === "development"');
  });

  it("scopes all Monde course grant reads to active PASSAGE variants", () => {
    for (const path of [
      "src/lib/course-content/server.ts",
      "src/app/api/courses/[courseId]/progress/route.ts",
      "src/app/[locale]/courses/page.tsx",
      "src/app/api/me/monde-dashboard/route.ts",
    ]) {
      const source = read(path);
      expect(source).toContain('status: "ACTIVE"');
      expect(source).toContain('product: { code: "PASSAGE" }');
      expect(source).toContain("productVariant: {");
    }
  });

  it("keeps Preview technical-beta read and progress eligibility identical", () => {
    const viewer = read("src/lib/course-content/server.ts");
    const progress = read("src/app/api/courses/[courseId]/progress/route.ts");

    for (const source of [viewer, progress]) {
      expect(source).toContain('courseId === "monde-adulte-de-a1"');
      expect(source).toContain(
        'learningPath.currentLevel === null || learningPath.currentLevel === "A1"',
      );
      expect(source).toContain("isTechnicalBetaCourseAccessEnabled()");
      expect(source).toContain("technicalBetaA1");
    }
  });

  it("protects the legacy DB course-detail API from anonymous and draft disclosure", () => {
    const route = read("src/app/api/courses/[courseId]/route.ts");

    expect(route).toContain("const actor = await getActor()");
    expect(route).toContain('status: 401');
    expect(route).toContain('roles.has("ADMIN") || roles.has("TEACHER")');
    expect(route).toContain("if (!course.isPublished)");
    expect(route).toContain('status: 404');
    expect(route).toContain('where: privileged ? undefined : { isPublished: true }');
  });

  it("requires a live level-matching Passage grant for learner course content", () => {
    const route = read("src/app/api/courses/[courseId]/route.ts");

    expect(route).toContain('startsAt: { lte: now }');
    expect(route).toContain('{ OR: [{ endsAt: null }, { endsAt: { gt: now } }] }');
    expect(route).toContain('product: { code: "PASSAGE" }');
    expect(route).toContain("level: course.level");
    expect(route).toContain('return NextResponse.json({ error: "Course access required" }, { status: 403 })');
  });
});
