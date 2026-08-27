import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const migration = readFileSync(
  resolve(REPO, "prisma/migrations/20260808105029_social_pending_uniqueness/migration.sql"),
  "utf8",
);

describe("P4.7 · social pending uniqueness", () => {
  it("allows only one pending class request per student and classroom", () => {
    expect(migration).toContain("class_join_requests_pending_class_unique");
    expect(migration).toContain('(\"fromUserId\", \"toClassroomId\")');
    expect(migration).toContain("status = 'pending' AND \"toClassroomId\" IS NOT NULL");
  });

  it("allows only one pending group request per student and group", () => {
    expect(migration).toContain("class_join_requests_pending_group_unique");
    expect(migration).toContain('(\"fromUserId\", \"toGroupId\")');
    expect(migration).toContain("status = 'pending' AND \"toGroupId\" IS NOT NULL");
  });

  it("allows only one pending invitation per sender recipient and group", () => {
    expect(migration).toContain("study_group_invites_pending_unique");
    expect(migration).toContain('(\"fromUserId\", \"toUserId\", \"groupId\")');
    expect(migration).toContain("status = 'pending' AND \"groupId\" IS NOT NULL");
  });

  it("keeps historical non-pending rows outside the uniqueness constraint", () => {
    expect(migration.match(/WHERE status = 'pending'/g)?.length).toBe(3);
    expect(migration).not.toContain("UNIQUE (\"fromUserId\"");
  });
});
