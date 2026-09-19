import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { DE_A1_COURSE, getCourseLessonIds } from "@/data/courses/registry";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

describe("German A1 adult runtime provisioning", () => {
  it("provisions the canonical course and every stable lesson id", () => {
    const migration = read(
      "prisma/migrations/20260920000024_a1_adult_runtime_provision/migration.sql",
    );
    expect(migration).toContain("monde-adulte-de-a1");
    expect(migration).toContain("2026.08.04");
    for (const lessonId of getCourseLessonIds(DE_A1_COURSE.course.id)) {
      expect(migration, lessonId).toContain(lessonId);
    }
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

  it("keeps the supplied A1 shape exact", () => {
    expect(DE_A1_COURSE.units).toHaveLength(6);
    expect(getCourseLessonIds(DE_A1_COURSE.course.id)).toHaveLength(36);
    expect(
      DE_A1_COURSE.units.flatMap((unit) =>
        unit.lessons.flatMap((lesson) => lesson.exercises),
      ),
    ).toHaveLength(102);
  });
});
