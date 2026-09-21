import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

describe("Center connected representative identity", () => {
  it("resolves the dashboard scope server-side without accepting a client center identity", () => {
    const route = read("src/app/api/center/dashboard/route.ts");
    expect(route).toContain("resolveCenterActor()");
    expect(route).toContain("getCenterDashboard(actor.centerId)");
    expect(route).toContain("{ center: actor.center, stats }");
    expect(route).not.toContain("searchParams");
    expect(route).not.toContain("req.json");
  });

  it("shows the connected representative across the Center workspace", () => {
    const badge = read("src/features/dashboards/center/CenterRepresentativeBadge.tsx");
    const layout = read("src/app/[locale]/center/layout.tsx");

    expect(badge).toContain("data-center-representative");
    expect(badge).toContain("where: { supabaseId: user.id }");
    expect(badge).toContain("select: { fullName: true, city: true }");
    expect(badge).toContain("profile.fullName");
    expect(badge).toContain("profile.city");
    expect(badge).not.toContain("email: true");
    expect(badge).toContain("INTERNAL_TEST_COOKIE_NAME");
    expect(layout).toContain("CenterRepresentativeBadge");
  });
});
