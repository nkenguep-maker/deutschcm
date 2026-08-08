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
    const responder = read("src/lib/social/respondJoinRequest.ts");

    expect(socialRoute).toContain("respondToJoinRequest({");
    expect(socialRoute).toContain("responderUserId: user.id");
    expect(responder).toContain("where: { userId: params.responderUserId }");
    expect(responder).toContain("teacherId: teacher.id");
    expect(responder).toContain("creatorId: params.responderUserId");
    expect(responder).toContain('reason: "forbidden"');
  });

  it("only lets the intended recipient answer an invitation", () => {
    const socialRoute = read("src/app/api/social/route.ts");
    const responder = read("src/lib/social/respondJoinRequest.ts");

    expect(socialRoute).toContain("respondToGroupInvite({");
    expect(responder).toContain("toUserId: params.responderUserId");
    expect(responder).toContain('invite.status !== "pending"');
    expect(responder).toContain("userId: params.responderUserId");
  });

  it("materializes accepted group requests and invitations transactionally", () => {
    const responder = read("src/lib/social/respondJoinRequest.ts");

    expect(responder).toContain("prisma.$transaction");
    expect(responder).toContain("tx.studentGroupMember.upsert");
    expect(responder).toMatch(/groupId_userId:\s*\{\s*groupId:\s*group\.id,\s*userId:\s*req\.fromUserId\s*\}/);
    expect(responder).toMatch(/groupId_userId:\s*\{\s*groupId:\s*group\.id,\s*userId:\s*params\.responderUserId\s*\}/);
    expect(responder).toContain('where: { id: invite.id, status: "pending", toUserId: params.responderUserId }');
  });

  it("serializes classroom acceptance and enforces capacity at decision time", () => {
    const responder = read("src/lib/social/respondJoinRequest.ts");
    const lock = responder.indexOf("pg_advisory_xact_lock(hashtextextended(${classroom.id}, 0))");
    const count = responder.indexOf("tx.classroomEnrollment.count", lock);
    const capacity = responder.indexOf("activeCount >= lockedClassroom.maxStudents", count);
    const decide = responder.indexOf("tx.classJoinRequest.updateMany", capacity);
    const enroll = responder.indexOf("tx.classroomEnrollment.upsert", decide);

    expect(lock).toBeGreaterThan(-1);
    expect(count).toBeGreaterThan(lock);
    expect(capacity).toBeGreaterThan(count);
    expect(decide).toBeGreaterThan(capacity);
    expect(enroll).toBeGreaterThan(decide);
    expect(responder).toContain('where: { id: req.id, status: "pending" }');
    expect(responder).toContain('reason: "classroom_full"');
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
