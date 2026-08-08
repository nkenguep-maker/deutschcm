import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

describe("P4.7 · classroom join approval hardening", () => {
  it("does not grant an active enrollment before teacher approval", () => {
    const join = read("src/app/api/classroom/join/route.ts");

    expect(join).toContain("prisma.classJoinRequest.create");
    expect(join).not.toContain("prisma.classroomEnrollment.upsert");
    expect(join).not.toContain("prisma.user.update");
    expect(join).toContain("pending: true");
  });

  it("keeps duplicate pending requests idempotent and rate limited", () => {
    const join = read("src/app/api/classroom/join/route.ts");

    expect(join).toContain('status: "pending"');
    expect(join).toContain("hasReachedJoinRequestQuota(dbUser.id)");
    expect(join).toContain('code: "class_join_rate_limited"');
    expect(join).toContain("status: 429");
  });

  it("requires exact same-origin on the classroom join mutation", () => {
    const join = read("src/app/api/classroom/join/route.ts");

    expect(join).toContain("isSameOriginRequest(request)");
    expect(join).toContain('status: 403');
  });

  it("requires authentication before resolving classroom code previews", () => {
    const preview = read("src/app/api/classroom/check-code/[code]/route.ts");

    expect(preview).toContain("if (!await isAuthenticated())");
    expect(preview).toContain('status: 401');
    expect(preview).toContain("code.length < 4 || code.length > 64");
  });

  it("materializes enrollment only in the authorized teacher response path", () => {
    const social = read("src/app/api/social/route.ts");

    expect(social).toContain("if (input.accept && req.toClassroomId)");
    expect(social).toContain("prisma.classroomEnrollment.upsert");
    expect(social).toContain("teacherId: teacher.id");
  });
});
