import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

describe("Center connected representative identity", () => {
  it("projects only the current Center user's name and city from the dashboard API", () => {
    const route = read("src/app/api/center/dashboard/route.ts");
    expect(route).toContain("resolveCenterActor()");
    expect(route).toContain("where: { id: actor.userId }");
    expect(route).toContain("fullName: true");
    expect(route).toContain("city: true");
    expect(route).toContain("profile:");
  });

  it("shows the connected representative across the Center workspace", () => {
    const badge = read("src/features/dashboards/center/CenterRepresentativeBadge.tsx");
    const layout = read("src/app/[locale]/center/layout.tsx");

    expect(badge).toContain("data-center-representative");
    expect(badge).toContain("profile.fullName");
    expect(badge).toContain("profile.city");
    expect(badge).toContain("INTERNAL_TEST_COOKIE_NAME");
    expect(layout).toContain("CenterRepresentativeBadge");
  });
});
