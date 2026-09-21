import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

describe("P0.14 · course authoring authorization boundary", () => {
  it("uses ACTIVE user_roles instead of the legacy primary role for course authoring", () => {
    const route = read("src/app/api/courses/route.ts");

    expect(route).toContain('hasActiveRole(userId, role)');
    expect(route).toContain('["ADMIN", "TEACHER", "CENTER"]');
    expect(route).toContain('["ADMIN", "TEACHER"]');
    expect(route).not.toContain("allowed.includes(user.role)");
    expect(route).not.toContain('user.role !== "ADMIN"');
  });

  it("requires same-origin for course POST and PATCH mutations", () => {
    const route = read("src/app/api/courses/route.ts");

    expect(route.match(/isSameOriginRequest\(request\)/g)?.length).toBe(2);
    expect(route).toContain('return NextResponse.json({ error: "Forbidden" }, { status: 403 })');
  });

  it("keeps normal published catalogue reads public but protects unpublished reads", () => {
    const route = read("src/app/api/courses/route.ts");

    expect(route).toContain('const includeUnpublished = searchParams.get("includeUnpublished") === "true"');
    expect(route).toContain('if (!includeUnpublished) where.isPublished = true');
    expect(route).toContain('hasAnyActiveRole(user.id, ["ADMIN", "TEACHER"])');
  });

  it("protects signed course-video upload URLs with origin and ACTIVE-role checks", () => {
    const route = read("src/app/api/upload/video-url/route.ts");

    expect(route).toContain("isSameOriginRequest(request)");
    expect(route).toContain('hasActiveRole(userId, role)');
    expect(route).toContain('["ADMIN", "TEACHER", "CENTER"]');
    expect(route).not.toContain("allowed.includes(dbUser.role)");
  });

  it("bounds and sanitizes video filenames before creating an upload path", () => {
    const route = read("src/app/api/upload/video-url/route.ts");

    expect(route).toContain("filename.length > 180");
    expect(route).toContain("filename.trim().replace(/[^a-zA-Z0-9._-]/g,");
    expect(route).toContain('status: 400');
  });
});
