import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

describe("P4.7 · social notifications authorization", () => {
  it("keeps notification creation inside authorized domain actions", () => {
    const notificationsRoute = read("src/app/api/notifications/route.ts");

    expect(notificationsRoute).not.toContain("prisma.notification.create");
    expect(notificationsRoute).toContain("Notifications are emitted by authorized domain actions");
    expect(notificationsRoute).toContain("status: 405");
    expect(notificationsRoute).toContain('Allow: "GET"');
  });

  it("scopes class and group request responses to their owning actor", () => {
    const socialRoute = read("src/app/api/social/route.ts");

    expect(socialRoute).toContain('req.status !== "pending"');
    expect(socialRoute).toContain("teacherId: teacher.id");
    expect(socialRoute).toContain("creatorId: user.id");
    expect(socialRoute).toContain("if (!classroom) return forbidden()");
    expect(socialRoute).toContain("if (!group) return forbidden()");
  });

  it("only lets the intended recipient answer an invitation", () => {
    const socialRoute = read("src/app/api/social/route.ts");

    expect(socialRoute).toContain("invite.toUserId !== user.id");
    expect(socialRoute).toContain('invite.status !== "pending"');
    expect(socialRoute).toContain("userId: user.id");
  });

  it("materializes accepted group join requests as memberships", () => {
    const socialRoute = read("src/app/api/social/route.ts");

    expect(socialRoute).toContain("if (accept && req.toGroupId)");
    expect(socialRoute).toContain("prisma.studentGroupMember.upsert");
    expect(socialRoute).toContain("groupId: req.toGroupId, userId: req.fromUserId");
  });
});
