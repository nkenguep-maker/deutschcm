import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { DE_A1_COURSE, getCourseLessonIds } from "@/data/courses/registry";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

describe("German A1 adult runtime provisioning", () => {
  it("ships an idempotent P-1 provisioning script for the 60-module v2 platform shape", () => {
    const legacyMigration = read("prisma/migrations/20260920000024_a1_adult_runtime_provision/migration.sql");
    const v2Provisioning = read("scripts/sql/a1-v2-platform-provision-p1.sql");
    expect(getCourseLessonIds(DE_A1_COURSE.course.id)).toHaveLength(60);
    expect(legacyMigration).toContain("de-a1-u6-l6");
    expect(legacyMigration).not.toContain("de-a1-u7-l1");
    expect(v2Provisioning).toContain("12 units × 5 lessons = 60 active platform modules");
    expect(v2Provisioning).toContain("de-a1-u7-l1");
    expect(v2Provisioning).toContain("de-a1-u12-l5");
    expect(v2Provisioning).toContain('"activeInPlatform":false');
    expect(v2Provisioning).toContain('"isPublished" = false');
  });

  it("keeps the final A1 review behind full completion", () => {
    const page = read("src/app/[locale]/learn/[courseId]/complete/page.tsx");
    const component = read("src/features/course-experience/CourseCompletion.tsx");
    const qaPage = read("src/app/[locale]/qa/course-preview/de-a1/complete/page.tsx");
    expect(page).toContain('item.status === "COMPLETED"');
    expect(page).toContain("every((id) => completed.has(id))");
    expect(component).toContain("Tes acquis A1");
    expect(component).toContain("course.levelReview.finalChecklist");
    expect(qaPage).toContain("getCourseLessonIds");
    expect(qaPage).toContain('status: "COMPLETED" as const');
  });

  it("keeps the generic lesson renderer available for non-v2 content", () => {
    const lessonUi = read("src/features/course-experience/LessonExperience.tsx");
    for (const type of ["roleplay", "rubric", "visualFormula", "contrast", "sequenceBuilder"]) {
      expect(lessonUi).toContain(`block.type === "${type}"`);
    }
    expect(lessonUi).toContain("followUpsDe");
    expect(lessonUi).toContain("passScore");
    expect(lessonUi).toContain("block.pairs");
    expect(lessonUi).toContain("block.connectors");
  });

  it("exposes the new platform shape while public release gates remain independent", () => {
    expect(DE_A1_COURSE.units).toHaveLength(12);
    expect(getCourseLessonIds(DE_A1_COURSE.course.id)).toHaveLength(60);
    expect(DE_A1_COURSE.units.flatMap((unit) => unit.lessons.flatMap((lesson) => lesson.exercises))).toHaveLength(300);
  });
  it("routes the official A1 lesson page through the v2 platform experience", () => {
    const page = read("src/app/[locale]/learn/[courseId]/[unitId]/[lessonId]/page.tsx");
    const live = read("src/features/course-experience/a1-v2/A1V2PlatformLesson.tsx");
    expect(page).toContain("A1V2PlatformLesson");
    expect(page).toContain('courseId === "monde-adulte-de-a1"');
    expect(live).toContain("/api/courses/monde-a1-v2/reveil");
    expect(live).toContain("/api/courses/monde-a1-v2/attempt");
    expect(live).toContain("/progress");
    expect(live).toContain("RÉVEIL");
    expect(live).toContain("Remédiation après 2 erreurs");
  });

});
