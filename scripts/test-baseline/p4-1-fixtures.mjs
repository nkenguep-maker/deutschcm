// P4.1 · Fixtures Circle · idempotent, P-1 uniquement.
//
// Usage · node scripts/test-baseline/p4-1-fixtures.mjs seed|clean|list
//
// Crée deux foyers (A, B) avec :
//   - 1 owner + 1 adulte + 2 enfants par foyer
//   - 1 Circle KIKONGO ACTIVE dans A avec toutes les memberships + 1 coach
//   - 1 Circle SWAHILI ACTIVE dans B
//   - 1 Circle KIKONGO ARCHIVED dans A (test archivage)
//   - 1 StorageObject métadonnée (aucun upload réel)
// Marque tout avec préfixe TEST_P4_1_ pour cleanup.

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { assertNonProduction, getTestPassword } from "./_common.mjs";

const MODE = process.argv[2];
if (!["seed", "clean", "list"].includes(MODE)) {
  console.error("Usage · node scripts/test-baseline/p4-1-fixtures.mjs <seed|clean|list>");
  process.exit(1);
}

getTestPassword();
assertNonProduction();

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
const db = new PrismaClient({ adapter, log: ["error"] });

const EMAILS = {
  ownerA:   "paul+p4_1_owner_a@example.com",
  adultA:   "paul+p4_1_adult_a@example.com",
  ownerB:   "paul+p4_1_owner_b@example.com",
  coachA:   "paul+p4_1_coach_a@example.com",
};

async function ensureAuthUser(email, fullName) {
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
  const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (existing) return existing;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: process.env.P1_TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName, fixture: "TEST_P4_1" },
  });
  if (error) throw error;
  return data.user;
}

async function ensureDbUser(supabaseId, email, fullName, role = "STUDENT") {
  const existing = await db.user.findUnique({ where: { supabaseId } });
  if (existing) return existing;
  return db.user.create({
    data: {
      supabaseId,
      email,
      fullName,
      role,
      preferredLang: "fr",
      country: "CM",
    },
  });
}

async function ensureAppRole(userId, role) {
  await db.userAppRole.upsert({
    where: { userId_role: { userId, role } },
    update: {},
    create: { userId, role },
  });
}

async function seed() {
  console.log("═══ P4.1 · seed fixtures ═══");
  const [aOwnerAuth, aAdultAuth, bOwnerAuth, coachAuth] = await Promise.all([
    ensureAuthUser(EMAILS.ownerA, "TEST P4.1 Owner A"),
    ensureAuthUser(EMAILS.adultA, "TEST P4.1 Adult A"),
    ensureAuthUser(EMAILS.ownerB, "TEST P4.1 Owner B"),
    ensureAuthUser(EMAILS.coachA, "TEST P4.1 Coach A"),
  ]);
  const [aOwner, aAdult, bOwner, coach] = await Promise.all([
    ensureDbUser(aOwnerAuth.id, EMAILS.ownerA, "TEST P4.1 Owner A"),
    ensureDbUser(aAdultAuth.id, EMAILS.adultA, "TEST P4.1 Adult A"),
    ensureDbUser(bOwnerAuth.id, EMAILS.ownerB, "TEST P4.1 Owner B"),
    ensureDbUser(coachAuth.id, EMAILS.coachA, "TEST P4.1 Coach A"),
  ]);
  await Promise.all([
    ensureAppRole(aOwner.id, "PARENT"),
    ensureAppRole(aAdult.id, "PARENT"),
    ensureAppRole(bOwner.id, "PARENT"),
    ensureAppRole(coach.id, "RACINES_COACH"),
  ]);

  const hA = await db.household.upsert({
    where: { id: "test_p4_1_hh_a" },
    update: { ownerUserId: aOwner.id },
    create: { id: "test_p4_1_hh_a", ownerUserId: aOwner.id, status: "ACTIVE" },
  });
  const hB = await db.household.upsert({
    where: { id: "test_p4_1_hh_b" },
    update: { ownerUserId: bOwner.id },
    create: { id: "test_p4_1_hh_b", ownerUserId: bOwner.id, status: "ACTIVE" },
  });

  await db.householdMembership.upsert({
    where: { householdId_userId: { householdId: hA.id, userId: aAdult.id } },
    update: { role: "ADULT", status: "ACTIVE" },
    create: { householdId: hA.id, userId: aAdult.id, role: "ADULT", status: "ACTIVE" },
  });

  // Enfants foyer A (2 · limite testable)
  const childA1 = await db.childProfile.upsert({
    where: { id: "test_p4_1_child_a1" },
    update: { parentUserId: aOwner.id, householdId: hA.id, prenom: "TEST_A1", avatarAnimal: "chouette", age: 7, langues: [], activeLangue: null },
    create: { id: "test_p4_1_child_a1", parentUserId: aOwner.id, householdId: hA.id, prenom: "TEST_A1", avatarAnimal: "chouette", age: 7, langues: [], activeLangue: null },
  });
  const childA2 = await db.childProfile.upsert({
    where: { id: "test_p4_1_child_a2" },
    update: { parentUserId: aOwner.id, householdId: hA.id, prenom: "TEST_A2", avatarAnimal: "tortue", age: 5, langues: [], activeLangue: null },
    create: { id: "test_p4_1_child_a2", parentUserId: aOwner.id, householdId: hA.id, prenom: "TEST_A2", avatarAnimal: "tortue", age: 5, langues: [], activeLangue: null },
  });

  // Circle A · KIKONGO ACTIVE
  const cA = await (async () => {
    const existing = await db.circle.findFirst({
      where: { id: "test_p4_1_circle_a_lingala" },
    });
    if (existing) {
      return db.circle.update({
        where: { id: existing.id },
        data: { status: "ACTIVE", createdByUserId: aOwner.id, archivedAt: null },
      });
    }
    return db.circle.create({
      data: {
        id: "test_p4_1_circle_a_lingala",
        householdId: hA.id,
        language: "LINGALA",
        status: "ACTIVE",
        createdByUserId: aOwner.id,
      },
    });
  })();

  // Memberships Circle A (idempotent via findFirst puis create)
  for (const [key, role, userId, childProfileId] of [
    ["a_owner", "OWNER", aOwner.id, null],
    ["a_adult", "ADULT", aAdult.id, null],
    ["a_coach", "COACH", coach.id, null],
    ["a_c1", "CHILD", null, childA1.id],
    ["a_c2", "CHILD", null, childA2.id],
  ]) {
    const where = userId
      ? { circleId_userId: { circleId: cA.id, userId } }
      : null;
    const existing = await db.circleMembership.findFirst({
      where: { circleId: cA.id, userId: userId ?? undefined, childProfileId: childProfileId ?? undefined, status: "ACTIVE" },
    });
    if (existing) continue;
    await db.circleMembership.create({
      data: {
        circleId: cA.id,
        role,
        status: "ACTIVE",
        userId,
        childProfileId,
        invitedByUserId: aOwner.id,
        joinedAt: new Date(),
      },
    });
    void where;
  }

  // Circle A · SWAHILI ARCHIVED (test archivage · doit permettre recréation même langue).
  await (async () => {
    const existing = await db.circle.findFirst({
      where: { id: "test_p4_1_circle_a_swahili_archived" },
    });
    if (existing) {
      return db.circle.update({
        where: { id: existing.id },
        data: { status: "ARCHIVED", archivedAt: new Date() },
      });
    }
    return db.circle.create({
      data: {
        id: "test_p4_1_circle_a_swahili_archived",
        householdId: hA.id,
        language: "SWAHILI",
        status: "ARCHIVED",
        createdByUserId: aOwner.id,
        archivedAt: new Date(),
      },
    });
  })();

  // Circle B · WOLOF ACTIVE (cross-tenant)
  const cB = await (async () => {
    const existing = await db.circle.findFirst({
      where: { id: "test_p4_1_circle_b_wolof" },
    });
    if (existing) {
      return db.circle.update({
        where: { id: existing.id },
        data: { status: "ACTIVE", createdByUserId: bOwner.id, archivedAt: null },
      });
    }
    return db.circle.create({
      data: {
        id: "test_p4_1_circle_b_wolof",
        householdId: hB.id,
        language: "WOLOF",
        status: "ACTIVE",
        createdByUserId: bOwner.id,
      },
    });
  })();
  const bOwnerMembership = await db.circleMembership.findFirst({
    where: { circleId: cB.id, userId: bOwner.id, status: "ACTIVE" },
  });
  if (!bOwnerMembership) {
    await db.circleMembership.create({
      data: {
        circleId: cB.id,
        role: "OWNER",
        status: "ACTIVE",
        userId: bOwner.id,
        invitedByUserId: bOwner.id,
        joinedAt: new Date(),
      },
    });
  }

  // StorageObject métadonnée uniquement (aucun upload réel)
  await db.storageObject.upsert({
    where: { bucket_path: { bucket: "circle-audio", path: "test/p4_1/fixture-1.webm" } },
    update: {},
    create: {
      bucket: "circle-audio",
      path: "test/p4_1/fixture-1.webm",
      ownerUserId: aOwner.id,
      circleId: cA.id,
      purpose: "CIRCLE_MESSAGE_AUDIO",
      mimeType: "audio/webm",
      sizeBytes: 12345,
      durationSeconds: 30,
      retentionUntil: new Date(Date.now() + 90 * 86_400_000),
    },
  });

  console.log(`  circles · A=${cA.id} · B=${cB.id}`);
  console.log(`  households · A=${hA.id} · B=${hB.id}`);
  await db.$disconnect();
}

async function clean() {
  console.log("═══ P4.1 · clean fixtures ═══");
  const emails = Object.values(EMAILS);
  // Storage metadata first
  await db.storageObject.deleteMany({ where: { path: { startsWith: "test/p4_1/" } } });
  // Circles cascade memberships
  await db.circle.deleteMany({ where: { id: { startsWith: "test_p4_1_" } } });
  // Children rattachés au household ou par prefix
  await db.childProfile.deleteMany({
    where: { OR: [{ id: { startsWith: "test_p4_1_" } }, { prenom: { startsWith: "TEST_" } }] },
  });
  // Household memberships + households
  await db.householdMembership.deleteMany({ where: { householdId: { startsWith: "test_p4_1_" } } });
  await db.household.deleteMany({ where: { id: { startsWith: "test_p4_1_" } } });
  // AuditEvent lié aux fixtures (targetId ou scopeId)
  await db.auditEvent.deleteMany({
    where: {
      OR: [
        { targetId: { startsWith: "test_p4_1_" } },
        { scopeId: { startsWith: "test_p4_1_" } },
      ],
    },
  });
  // Prisma User rows par email (avant Supabase delete pour éviter les orphelins)
  const dbUsers = await db.user.findMany({ where: { email: { in: emails } }, select: { id: true } });
  const ids = dbUsers.map((u) => u.id);
  if (ids.length) {
    await db.userAppRole.deleteMany({ where: { userId: { in: ids } } });
    await db.userRole.deleteMany({ where: { userId: { in: ids } } });
    await db.user.deleteMany({ where: { id: { in: ids } } });
  }
  // Supabase Auth
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
  for (const email of emails) {
    const u = list.users.find((x) => x.email?.toLowerCase() === email.toLowerCase());
    if (u) await admin.auth.admin.deleteUser(u.id);
  }
  console.log(`  cleaned · ${ids.length} db users · ${emails.length} auth users · circles/household/storage/audit`);
  await db.$disconnect();
}

async function list() {
  const circles = await db.circle.findMany({
    where: { id: { startsWith: "test_p4_1_" } },
    include: { memberships: true },
  });
  console.log(JSON.stringify(circles, null, 2));
  await db.$disconnect();
}

if (MODE === "seed") await seed();
else if (MODE === "clean") await clean();
else await list();
