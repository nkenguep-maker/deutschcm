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

    expect(socialRoute).toContain("if (input.accept && req.toGroupId)");
    expect(socialRoute).toContain("prisma.studentGroupMember.upsert");
    expect(socialRoute).toMatch(/groupId_userId:\s*\{\s*groupId:\s*req\.toGroupId,\s*userId:\s*req\.fromUserId\s*\}/);
  });

  it("rate limits social writes from database history without a new counter store", () => {
    const rateLimit = read("src/lib/social/rateLimit.ts");
    const socialRoute = read("src/app/api/social/route.ts");

    expect(rateLimit).toContain("prisma.classJoinRequest.count");
    expect(rateLimit).toContain("prisma.studyGroupInvite.count");
    expect(rateLimit).toContain("createdAt: { gte: since }");
    expect(rateLimit).toContain("YEMA_SOCIAL_JOIN_REQUESTS_PER_HOUR");
    expect(rateLimit).toContain("YEMA_SOCIAL_GROUP_INVITES_PER_HOUR");
    expect(socialRoute).toContain("hasReachedJoinRequestQuota(user.id)");
    expect(socialRoute).toContain("hasReachedGroupInviteQuota(user.id)");
    expect(socialRoute).toContain('code: "social_rate_limited"');
    expect(socialRoute).toContain("status: 429");
    expect(socialRoute).toContain('"Retry-After": "3600"');
  });

  it("validates social destinations before creating requests or invitations", () => {
    const socialRoute = read("src/app/api/social/route.ts");

    const classLookup = socialRoute.indexOf("const classroom = await prisma.classroom.findFirst");
    const classCreate = socialRoute.indexOf("const req = await prisma.classJoinRequest.create", classLookup);
    expect(classLookup).toBeGreaterThan(-1);
    expect(classCreate).toBeGreaterThan(classLookup);

    const groupLookup = socialRoute.indexOf("const group = await prisma.studentGroup.findFirst");
    const groupCreate = socialRoute.indexOf("const req = await prisma.classJoinRequest.create", groupLookup);
    expect(groupLookup).toBeGreaterThan(-1);
    expect(groupCreate).toBeGreaterThan(groupLookup);

    expect(socialRoute).toContain("enrollment?.isActive");
    expect(socialRoute).toContain("membership?.isActive");
    expect(socialRoute).toContain("input.toUserId === user.id");
    expect(socialRoute).toContain("Invitation déjà envoyée");
  });
});
