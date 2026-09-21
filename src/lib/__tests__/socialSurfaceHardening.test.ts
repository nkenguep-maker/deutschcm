import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const route = readFileSync(resolve(REPO, "src/app/api/social/route.ts"), "utf8");

describe("P4.7 · reduced social API surface", () => {
  it("keeps GET to notifications and teacher-owned pending requests only", () => {
    expect(route).toContain('action === "notifications"');
    expect(route).toContain('action === "pending-requests"');
    expect(route).not.toContain('action === "classroom-detail"');
    expect(route).not.toContain('action === "group-detail"');
    expect(route).not.toContain('action === "lookup-code"');
    expect(route).toContain("return notFound()");
  });

  it("requires a real owned group for invitations", () => {
    expect(route).toContain('error: "groupId requis"');
    expect(route).toContain("creatorId: user.id");
    expect(route).toContain("groupName: authorizedGroup.name");
    expect(route).not.toContain("groupName ??");
  });

  it("bounds optional social messages", () => {
    expect(route).toContain("const MAX_SOCIAL_MESSAGE_CHARS = 500");
    expect(route).toContain("clean.length > MAX_SOCIAL_MESSAGE_CHARS");
    expect(route).toContain('error: "message invalide ou trop long"');
  });

  it("requires respond.accept to be a boolean and exactly one target id", () => {
    expect(route).toContain('typeof input.accept !== "boolean"');
    expect(route).toContain('(requestId ? 1 : 0) + (inviteId ? 1 : 0) !== 1');
  });

  it("bounds notification mark-read batches and scopes them to the user", () => {
    expect(route).toContain("const MAX_NOTIFICATION_READ_IDS = 100");
    expect(route).toContain("rawIds.length > MAX_NOTIFICATION_READ_IDS");
    expect(route).toContain("userId: user.id, id: { in: ids }");
  });
});
