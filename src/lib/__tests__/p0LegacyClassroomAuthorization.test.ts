import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

describe("P0.15 · legacy classroom authorization closure", () => {
  it("requires active learner enrollment before leaderboard or assignment reads", () => {
    const route = read("src/app/api/classroom/route.ts");

    expect(route).toContain("hasActiveClassroomEnrollment(dbUser.id, classroomId)");
    expect(route).toContain("classroomId_userId");
    expect(route).toContain("enrollment?.isActive === true");
    expect(route).toContain('return NextResponse.json({ error: "Classroom not found" }, { status: 404 })');
  });

  it("removes the direct-enrollment join bypass from the legacy endpoint", () => {
    const route = read("src/app/api/classroom/route.ts");

    expect(route).toContain('"CLASSROOM_JOIN_APPROVAL_REQUIRED"');
    expect(route).toContain('endpoint: "/api/classroom/join"');
    expect(route).not.toContain("prisma.classroomEnrollment.upsert");
  });

  it("removes client-written score/feedback submissions from the legacy endpoint", () => {
    const route = read("src/app/api/classroom/route.ts");

    expect(route).toContain('"CLASSROOM_SUBMISSION_WORKFLOW_REQUIRED"');
    expect(route).not.toContain("prisma.assignmentSubmission.upsert");
    expect(route).not.toContain("const { assignmentId, score, feedback }");
  });

  it("requires exact same-origin for every remaining legacy mutation request", () => {
    const route = read("src/app/api/classroom/route.ts");

    expect(route).toContain("isSameOriginRequest(request)");
    expect(route).toContain('status: 403');
  });

  it("routes the learner UI through the teacher-approval join endpoint", () => {
    const page = read("src/app/[locale]/classroom/page.tsx");

    expect(page).toContain('fetch("/api/classroom/join"');
    expect(page).toContain('JSON.stringify({ code: code.trim().toUpperCase() })');
    expect(page).not.toContain('fetch("/api/classroom",');
    expect(page).toContain('modalSuccessTitle: "Demande envoyée !"');
    expect(page).toContain('modalSuccessTitle: "Request sent!"');
  });
});
