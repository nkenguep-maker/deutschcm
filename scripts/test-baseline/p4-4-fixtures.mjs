// P4.4 · Fixtures Coach Racines · deux Coachs Racines + Career Coach + admin
// sans membership + Circles A/B/archived + enfants + coach retiré.
// Idempotent · P-1 uniquement (_common.mjs durci refuse toute autre cible).

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { assertNonProduction, getTestPassword } from "./_common.mjs";

const MODE = process.argv[2];
if (!["seed", "clean", "list"].includes(MODE)) {
  console.error("Usage · node scripts/test-baseline/p4-4-fixtures.mjs <seed|clean|list>");
  process.exit(1);
}
assertNonProduction();
const PW = getTestPassword();

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
const db = new PrismaClient({ adapter, log: ["error"] });

const CIRCLE_A_ID = "test_p4_4_circle_a";
const CIRCLE_B_ID = "test_p4_4_circle_b";
const CIRCLE_ARCH_ID = "test_p4_4_circle_arch";

const EMAILS = {
  coachA:              "paul+p4_4_coach_a@example.com",
  coachB:              "paul+p4_4_coach_b@example.com",
  coachRemoved:        "paul+p4_4_coach_removed@example.com",
  careerCoach:         "paul+p4_4_career_coach@example.com",
  yemaAdminNoBinding:  "paul+p4_4_admin_no_bind@example.com",
  parentA:             "paul+p4_4_parent_a@example.com",
  parentB:             "paul+p4_4_parent_b@example.com",
  foreignParent:       "paul+p4_4_foreign_parent@example.com",
  teacherHostile:      "paul+p4_4_teacher_hostile@example.com",
  centerAdminHostile:  "paul+p4_4_center_admin_hostile@example.com",
  studentHostile:      "paul+p4_4_student_hostile@example.com",
};

async function ensureAuth(email, fullName) {
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 500 });
  let a = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!a) {
    const { data } = await admin.auth.admin.createUser({
      email, password: PW, email_confirm: true,
      user_metadata: { fixture: "TEST_P4_4", full_name: fullName },
    });
    a = data.user;
  }
  return a;
}

async function ensureDbUser(supabaseId, email, fullName, role = "STUDENT") {
  return db.user.upsert({
    where: { email },
    update: { supabaseId, fullName, role, onboardingDone: true },
    create: { supabaseId, email, fullName, role, onboardingDone: true },
  });
}

async function ensureAppRole(userId, role) {
  await db.userAppRole.upsert({
    where: { userId_role: { userId, role } },
    update: {},
    create: { userId, role },
  });
}

async function syncMeta(supabaseId, role) {
  const { data } = await admin.auth.admin.getUserById(supabaseId);
  const existing = data?.user?.user_metadata ?? {};
  await admin.auth.admin.updateUserById(supabaseId, {
    user_metadata: {
      ...existing,
      roles: [role],
      onboarded_map: { [role]: true },
      active_space: role,
    },
  });
}

async function ensureHousehold(id, ownerUserId) {
  const ex = await db.household.findFirst({ where: { id } });
  if (ex) return ex;
  return db.household.create({
    data: { id, ownerUserId, status: "ACTIVE" },
  });
}

async function ensureChildProfile(id, parentUserId, householdId, prenom, age, avatar, langue) {
  const ex = await db.childProfile.findFirst({ where: { id } });
  if (ex) {
    return db.childProfile.update({
      where: { id },
      data: { parentUserId, householdId, prenom, age, avatarAnimal: avatar, activeLangue: langue },
    });
  }
  return db.childProfile.create({
    data: {
      id, parentUserId, householdId, prenom, age,
      avatarAnimal: avatar, activeLangue: langue, langues: [],
    },
  });
}

async function ensureCircle(id, householdId, language, createdByUserId, status = "ACTIVE") {
  const ex = await db.circle.findFirst({ where: { id } });
  if (ex) {
    return db.circle.update({
      where: { id },
      data: { language, status, archivedAt: status === "ARCHIVED" ? new Date() : null },
    });
  }
  return db.circle.create({
    data: {
      id, householdId, language, status, createdByUserId,
      archivedAt: status === "ARCHIVED" ? new Date() : null,
    },
  });
}

async function ensureAdultMembership(circleId, userId, role) {
  const ex = await db.circleMembership.findFirst({
    where: { circleId, userId, role },
  });
  if (ex) {
    return db.circleMembership.update({
      where: { id: ex.id },
      data: { status: "ACTIVE", joinedAt: ex.joinedAt ?? new Date() },
    });
  }
  return db.circleMembership.create({
    data: { circleId, userId, role, status: "ACTIVE", joinedAt: new Date() },
  });
}

async function ensureCoachMembership(circleId, userId, status = "ACTIVE") {
  const ex = await db.circleMembership.findFirst({
    where: { circleId, userId, role: "COACH" },
  });
  if (ex) {
    return db.circleMembership.update({
      where: { id: ex.id },
      data: { status, joinedAt: ex.joinedAt ?? new Date(), removedAt: status === "REMOVED" ? new Date() : null },
    });
  }
  return db.circleMembership.create({
    data: {
      circleId, userId, role: "COACH", status,
      joinedAt: new Date(),
      removedAt: status === "REMOVED" ? new Date() : null,
    },
  });
}

async function ensureChildMembership(circleId, childProfileId, status = "ACTIVE") {
  const ex = await db.circleMembership.findFirst({
    where: { circleId, childProfileId, role: "CHILD" },
  });
  if (ex) {
    return db.circleMembership.update({
      where: { id: ex.id },
      data: { status, joinedAt: ex.joinedAt ?? new Date() },
    });
  }
  return db.circleMembership.create({
    data: { circleId, childProfileId, role: "CHILD", status, joinedAt: new Date() },
  });
}

async function seed() {
  console.log("═══ P4.4 · seed ═══");
  const authUsers = await Promise.all(
    Object.entries(EMAILS).map(([key, email]) =>
      ensureAuth(email, `TEST P4.4 ${key}`).then((u) => [key, u]),
    ),
  );
  const auth = Object.fromEntries(authUsers);

  const dbUsers = await Promise.all([
    ensureDbUser(auth.coachA.id, EMAILS.coachA, "TEST P4.4 Coach A", "STUDENT"),
    ensureDbUser(auth.coachB.id, EMAILS.coachB, "TEST P4.4 Coach B", "STUDENT"),
    ensureDbUser(auth.coachRemoved.id, EMAILS.coachRemoved, "TEST P4.4 Coach Removed", "STUDENT"),
    ensureDbUser(auth.careerCoach.id, EMAILS.careerCoach, "TEST P4.4 Career Coach", "STUDENT"),
    ensureDbUser(auth.yemaAdminNoBinding.id, EMAILS.yemaAdminNoBinding, "TEST P4.4 Admin No Bind", "ADMIN"),
    ensureDbUser(auth.parentA.id, EMAILS.parentA, "TEST P4.4 Parent A", "STUDENT"),
    ensureDbUser(auth.parentB.id, EMAILS.parentB, "TEST P4.4 Parent B", "STUDENT"),
    ensureDbUser(auth.foreignParent.id, EMAILS.foreignParent, "TEST P4.4 Foreign Parent", "STUDENT"),
    ensureDbUser(auth.teacherHostile.id, EMAILS.teacherHostile, "TEST P4.4 Teacher Hostile", "TEACHER"),
    ensureDbUser(auth.centerAdminHostile.id, EMAILS.centerAdminHostile, "TEST P4.4 Center Admin Hostile", "CENTER"),
    ensureDbUser(auth.studentHostile.id, EMAILS.studentHostile, "TEST P4.4 Student Hostile", "STUDENT"),
  ]);
  const [coachA, coachB, coachRemoved, careerCoach, adminNoBind,
         parentA, parentB, foreignParent, teacherHostile, centerAdminHostile, studentHostile] = dbUsers;

  await Promise.all([
    ensureAppRole(coachA.id, "RACINES_COACH"),
    ensureAppRole(coachB.id, "RACINES_COACH"),
    ensureAppRole(coachRemoved.id, "RACINES_COACH"),
    ensureAppRole(careerCoach.id, "CAREER_COACH"),
    ensureAppRole(adminNoBind.id, "YEMA_ADMIN"),
    ensureAppRole(parentA.id, "PARENT"),
    ensureAppRole(parentB.id, "PARENT"),
    ensureAppRole(foreignParent.id, "PARENT"),
    ensureAppRole(teacherHostile.id, "TEACHER"),
    ensureAppRole(centerAdminHostile.id, "CENTER_ADMIN"),
    ensureAppRole(studentHostile.id, "LEARNER"),
  ]);

  await Promise.all([
    syncMeta(auth.coachA.id, "STUDENT"),
    syncMeta(auth.coachB.id, "STUDENT"),
    syncMeta(auth.coachRemoved.id, "STUDENT"),
    syncMeta(auth.careerCoach.id, "STUDENT"),
    syncMeta(auth.yemaAdminNoBinding.id, "ADMIN"),
    syncMeta(auth.parentA.id, "STUDENT"),
    syncMeta(auth.parentB.id, "STUDENT"),
    syncMeta(auth.foreignParent.id, "STUDENT"),
    syncMeta(auth.teacherHostile.id, "TEACHER"),
    syncMeta(auth.centerAdminHostile.id, "CENTER"),
    syncMeta(auth.studentHostile.id, "STUDENT"),
  ]);

  const householdA = await ensureHousehold("test_p4_4_household_a", parentA.id);
  const householdB = await ensureHousehold("test_p4_4_household_b", parentB.id);
  const householdForeign = await ensureHousehold("test_p4_4_household_foreign", foreignParent.id);

  const child_A_1 = await ensureChildProfile("test_p4_4_child_a_1", parentA.id, householdA.id, "Awa",  8, "🦁", "WOLOF");
  const child_A_2 = await ensureChildProfile("test_p4_4_child_a_2", parentA.id, householdA.id, "Kofi", 11, "🐘", "WOLOF");
  const child_B_1 = await ensureChildProfile("test_p4_4_child_b_1", parentB.id, householdB.id, "Yara", 6, "🦊", "DOUALA");
  const child_removed = await ensureChildProfile("test_p4_4_child_removed", parentA.id, householdA.id, "Adja", 9, "🐢", "WOLOF");

  const circleA = await ensureCircle(CIRCLE_A_ID, householdA.id, "WOLOF", parentA.id, "ACTIVE");
  const circleB = await ensureCircle(CIRCLE_B_ID, householdB.id, "DOUALA", parentB.id, "ACTIVE");
  const circleArch = await ensureCircle(CIRCLE_ARCH_ID, householdForeign.id, "LINGALA", foreignParent.id, "ARCHIVED");

  await Promise.all([
    ensureAdultMembership(circleA.id, parentA.id, "OWNER"),
    ensureAdultMembership(circleB.id, parentB.id, "OWNER"),
    ensureAdultMembership(circleArch.id, foreignParent.id, "OWNER"),
    // Coach A assigné à Circle A · Coach B assigné à Circle B ·
    // Coach Removed était sur Circle A puis retiré (Q10).
    ensureCoachMembership(circleA.id, coachA.id, "ACTIVE"),
    ensureCoachMembership(circleB.id, coachB.id, "ACTIVE"),
    ensureCoachMembership(circleA.id, coachRemoved.id, "REMOVED"),
    // Coach A est aussi sur Circle archivé (mais Circle archivé donc pas actif).
    ensureCoachMembership(circleArch.id, coachA.id, "ACTIVE"),
    // Enfants dans les Circles.
    ensureChildMembership(circleA.id, child_A_1.id, "ACTIVE"),
    ensureChildMembership(circleA.id, child_A_2.id, "ACTIVE"),
    ensureChildMembership(circleB.id, child_B_1.id, "ACTIVE"),
    // Enfant retiré · doit être exclu.
    ensureChildMembership(circleA.id, child_removed.id, "REMOVED"),
  ]);

  console.log(`  coaches · A=${coachA.id.slice(0,8)} B=${coachB.id.slice(0,8)} removed=${coachRemoved.id.slice(0,8)}`);
  console.log(`  career=${careerCoach.id.slice(0,8)} adminNoBind=${adminNoBind.id.slice(0,8)}`);
  console.log(`  circles · A=${circleA.id} B=${circleB.id} arch=${circleArch.id}`);
  console.log(`  children · A1=${child_A_1.id} A2=${child_A_2.id} B1=${child_B_1.id} removed=${child_removed.id}`);
  await db.$disconnect();
}

async function clean() {
  console.log("═══ P4.4 · clean ═══");
  const emails = Object.values(EMAILS);
  await db.circleMembership.deleteMany({
    where: { circleId: { startsWith: "test_p4_4_" } },
  });
  await db.circle.deleteMany({ where: { id: { startsWith: "test_p4_4_" } } });
  await db.childProfile.deleteMany({ where: { id: { startsWith: "test_p4_4_" } } });
  await db.household.deleteMany({ where: { id: { startsWith: "test_p4_4_" } } });
  const dbUsers = await db.user.findMany({ where: { email: { in: emails } }, select: { id: true } });
  const ids = dbUsers.map((u) => u.id);
  if (ids.length) {
    await db.userAppRole.deleteMany({ where: { userId: { in: ids } } });
    await db.userRole.deleteMany({ where: { userId: { in: ids } } });
    await db.user.deleteMany({ where: { id: { in: ids } } });
  }
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 500 });
  for (const email of emails) {
    const u = list.users.find((x) => x.email?.toLowerCase() === email.toLowerCase());
    if (u) await admin.auth.admin.deleteUser(u.id);
  }
  console.log(`  cleaned · ${ids.length} db users · ${emails.length} auth users · circles + children`);
  await db.$disconnect();
}

async function list() {
  const circles = await db.circle.findMany({
    where: { id: { startsWith: "test_p4_4_" } },
    include: { memberships: { include: { user: { select: { email: true } }, childProfile: { select: { prenom: true } } } } },
  });
  console.log(JSON.stringify(circles, null, 2));
  await db.$disconnect();
}

if (MODE === "seed") await seed();
else if (MODE === "clean") await clean();
else await list();
