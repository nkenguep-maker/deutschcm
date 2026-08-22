import { describe, expect, it } from "vitest";
import {
  mondeCourseHref,
  mondeLessonHref,
} from "@/features/dashboards/student-monde/courseRoutes";

describe("Monde dashboard course routes", () => {
  it("opens the official A1 course when no next lesson is available", () => {
    expect(mondeCourseHref("fr")).toBe("/fr/learn/monde-adulte-de-a1");
  });

  it("opens the exact next lesson exposed by the dashboard API", () => {
    expect(mondeLessonHref("en", {
      courseId: "de-a1-u1",
      moduleId: "de-a1-u1-l1",
    })).toBe("/en/learn/monde-adulte-de-a1/de-a1-u1/de-a1-u1-l1");
  });

  it("encodes unexpected path separators instead of creating a new route segment", () => {
    expect(mondeLessonHref("fr", {
      courseId: "unit/one",
      moduleId: "lesson/one",
    })).toBe("/fr/learn/monde-adulte-de-a1/unit%2Fone/lesson%2Fone");
  });
});
