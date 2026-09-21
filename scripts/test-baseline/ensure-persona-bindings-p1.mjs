// P-1 only · idempotent repair for the canonical 9-persona QA matrix.
//
// Why this exists:
// - CENTER_ADMIN resolution is authoritative through Teacher.centerId.
// - RACINES_COACH is more useful for runtime QA when it owns an active
//   Circle scope with at least one child.
//
// Safety: assertNonProduction() loads only .env.p1-baseline and refuses every
// project ref except kzzagbojjkivdzzcrmxn. This script never targets Prod.

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { assertNonProduction } from "./_common.mjs";

assertNonProduction();

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
  log: ["error"],
});

const EMAILS = {
  center: "test_yema_qa_center_admin@example.com",
  coach: "test_yema_qa_coach@example.com",
  family: "test_yema_qa_family@example.com",
};

const IDS = {
  center: "test_yema_qa_center",
  centerBinding: "test_yema_qa_center_admin_bind",
  circle: "test_yema_qa_circle_family_wolof",
  ownerMembership: "test_yema_qa_circle_owner",
  coachMembership: "test_yema_qa_circle_coach",
  childMembership: "test_yema_qa_circle_child_racines",
};

async function requireUser(email) {
  const user = await db.user.findUnique({ where: { email }, select: { id: true, email: true } });
  if (!user) throw new Error(`QA fixture missing: ${email}`);
  return user;
}

async function main() {
  const [centerAdmin, coach, family] = await Promise.all([
    requireUser(EMAILS.center),
    requireUser(EMAILS.coach),
    requireUser(EMAILS.family),
  ]);

  const child = await db.childProfile.findFirst({
    where: { parentUserId: family.id, universe: "RACINES" },
    orderBy: { createdAt: "asc" },
    select: { id: true, householdId: true },
  });
  if (!child?.householdId) throw new Error("QA Racines child/household fixture missing");

  await db.$transaction(async (tx) => {
    await tx.languageCenter.upsert({
      where: { id: IDS.center },
      update: { name: "YEMA QA Center", city: "Yaoundé", country: "CM", isVerified: true, plan: "qa" },
      create: { id: IDS.center, name: "YEMA QA Center", city: "Yaoundé", country: "CM", isVerified: true, plan: "qa" },
    });

    await tx.teacher.upsert({
      where: { id: IDS.centerBinding },
      update: { userId: centerAdmin.id, centerId: IDS.center, isVerified: true },
      create: { id: IDS.centerBinding, userId: centerAdmin.id, centerId: IDS.center, isVerified: true },
    });

    await tx.circle.upsert({
      where: { id: IDS.circle },
      update: { householdId: child.householdId, language: "WOLOF", status: "ACTIVE", createdByUserId: family.id, archivedAt: null },
      create: { id: IDS.circle, householdId: child.householdId, language: "WOLOF", status: "ACTIVE", createdByUserId: family.id },
    });

    await tx.circleMembership.upsert({
      where: { id: IDS.ownerMembership },
      update: { circleId: IDS.circle, role: "OWNER", status: "ACTIVE", userId: family.id, childProfileId: null, removedAt: null, joinedAt: new Date() },
      create: { id: IDS.ownerMembership, circleId: IDS.circle, role: "OWNER", status: "ACTIVE", userId: family.id, joinedAt: new Date() },
    });
    await tx.circleMembership.upsert({
      where: { id: IDS.coachMembership },
      update: { circleId: IDS.circle, role: "COACH", status: "ACTIVE", userId: coach.id, childProfileId: null, removedAt: null, joinedAt: new Date() },
      create: { id: IDS.coachMembership, circleId: IDS.circle, role: "COACH", status: "ACTIVE", userId: coach.id, joinedAt: new Date() },
    });
    await tx.circleMembership.upsert({
      where: { id: IDS.childMembership },
      update: { circleId: IDS.circle, role: "CHILD", status: "ACTIVE", userId: null, childProfileId: child.id, removedAt: null, joinedAt: new Date() },
      create: { id: IDS.childMembership, circleId: IDS.circle, role: "CHILD", status: "ACTIVE", childProfileId: child.id, joinedAt: new Date() },
    });
  });

  const [centerBinding, coachMembership] = await Promise.all([
    db.teacher.findFirst({ where: { userId: centerAdmin.id, centerId: IDS.center }, select: { id: true, isVerified: true } }),
    db.circleMembership.findFirst({ where: { userId: coach.id, circleId: IDS.circle, role: "COACH", status: "ACTIVE" }, select: { id: true } }),
  ]);

  if (!centerBinding || !coachMembership) throw new Error("QA persona binding verification failed");
  process.stderr.write("QA PERSONA BINDINGS READY\n");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
