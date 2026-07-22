// P-1 Baseline · CREATE
// Provisionne 6 comptes Supabase Auth + données représentatives Prisma.
// Idempotent : re-run OK. Refuse la production via _common.assertNonProduction().

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { assertNonProduction, ACCOUNTS, getTestPassword, TEST_NAME_PREFIX } from "./_common.mjs";

const TEST_PASSWORD = getTestPassword();

assertNonProduction();

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
const db = new PrismaClient({ adapter, log: ["error"] });

async function findOrCreateAuthUser(email, fullName, role) {
  // Look up existing
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
  const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (existing) {
    // Ensure metadata roles is set
    await admin.auth.admin.updateUserById(existing.id, {
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: fullName, role, roles: [role], active_space: role, onboarded_map: { [role]: true } },
    });
    return existing;
  }
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName, role, roles: [role], active_space: role, onboarded_map: { [role]: true } },
  });
  if (error) throw error;
  return created.user;
}

async function upsertDbUser(supabaseId, email, fullName, role) {
  const existing = await db.user.findUnique({ where: { supabaseId } });
  if (existing) {
    return await db.user.update({
      where: { supabaseId },
      data: { email, fullName, role, onboardingDone: true, isValidated: true },
    });
  }
  // Check for orphan by email
  const orphan = await db.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
  if (orphan) {
    return await db.user.update({
      where: { id: orphan.id },
      data: { supabaseId, email, fullName, role, onboardingDone: true, isValidated: true },
    });
  }
  return await db.user.create({
    data: {
      id: `test_${supabaseId.slice(0, 8)}`,
      supabaseId,
      email,
      fullName,
      role,
      preferredLang: "fr",
      country: "CM",
      onboardingDone: true,
      isValidated: true,
    },
  });
}

async function upsertUserRoles(userId, roles) {
  for (const r of roles) {
    await db.userRole.upsert({
      where: { userId_role: { userId, role: r } },
      create: { userId, role: r, status: "ACTIVE", onboarded: true },
      update: { status: "ACTIVE", onboarded: true },
    });
  }
}

async function ensureLearningPath(userId, universe, language, level, intention) {
  const existing = await db.learningPath.findFirst({
    where: { userId, universe, language, status: "ACTIVE" },
  });
  if (existing) return existing;
  return await db.learningPath.create({
    data: { userId, universe, language, currentLevel: level, intention, status: "ACTIVE" },
  });
}

async function ensureHousehold(ownerUserId) {
  const existing = await db.household.findFirst({ where: { ownerUserId, status: "ACTIVE" } });
  if (existing) return existing;
  const created = await db.household.create({
    data: { ownerUserId, status: "ACTIVE" },
  });
  await db.householdMembership.create({
    data: { householdId: created.id, userId: ownerUserId, role: "OWNER", status: "ACTIVE" },
  });
  return created;
}

async function ensureChildProfile(parentUserId, prenom, avatarAnimal, age, langue, type, echelle) {
  const existing = await db.childProfile.findFirst({ where: { parentUserId, prenom } });
  const langues = [{ langue, type, echelle, etoiles: 0, motsAppris: [] }];
  if (existing) {
    return await db.childProfile.update({
      where: { id: existing.id },
      data: { avatarAnimal, age, langues, activeLangue: langue },
    });
  }
  return await db.childProfile.create({
    data: { parentUserId, prenom, avatarAnimal, age, langues, activeLangue: langue },
  });
}

async function ensureTeacherProfile(userId) {
  const existing = await db.teacher.findUnique({ where: { userId } });
  if (existing) return existing;
  return await db.teacher.create({
    data: { userId, bio: "TEST_Bio", languages: ["de"], speciality: [], certifications: [], maxStudents: 20 },
  });
}

async function ensureClassroomV1(teacherId, name) {
  const existing = await db.classroom.findFirst({ where: { teacherId, name } });
  if (existing) return existing;
  const code = `TEST-CLS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  return await db.classroom.create({
    data: {
      teacherId,
      name,
      description: "TEST_ classroom baseline",
      level: "A1",
      code,
      maxStudents: 20,
      isActive: true,
    },
  });
}

async function ensureLanguageCenter(ownerId, name) {
  const existing = await db.languageCenter.findFirst({ where: { name } });
  if (existing) return existing;
  const code = `TEST-CTR-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  return await db.languageCenter.create({
    data: {
      name,
      city: "TEST_Douala",
      country: "CM",
      code,
      plan: "starter",
    },
  });
}

console.log("═══ P-1 Baseline · CREATE ═══");
console.log(`Supabase: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
console.log(`Accounts: ${ACCOUNTS.length}`);
console.log(`Password (all accounts): ***  (P1_TEST_PASSWORD env)`);
console.log("");

const results = {};

for (const acc of ACCOUNTS) {
  console.log(`── [${acc.label}] ${acc.email}`);
  const authUser = await findOrCreateAuthUser(acc.email, acc.fullName, acc.role);
  console.log(`   auth id: ${authUser.id}`);
  const dbUser = await upsertDbUser(authUser.id, acc.email, acc.fullName, acc.role);
  console.log(`   db  id: ${dbUser.id}`);
  await upsertUserRoles(dbUser.id, [acc.role]);
  results[acc.label] = { authId: authUser.id, dbId: dbUser.id };
}

// Learning paths
console.log("\n── Learning paths");
const monde = results.monde;
const lpMonde = await ensureLearningPath(monde.dbId, "MONDE", "DEUTSCH", "A1", "SUR_PLACE");
console.log(`   Monde deutsch A1: ${lpMonde.id}`);

const solo = results.racines_solo;
const lpSolo = await ensureLearningPath(solo.dbId, "RACINES", "WOLOF", "A1", "RACINES_SOI");
console.log(`   Racines solo wolof: ${lpSolo.id}`);

const family = results.racines_family;
const lpFamily = await ensureLearningPath(family.dbId, "RACINES", "LINGALA", "A1", "TRANSMISSION");
console.log(`   Racines famille lingala: ${lpFamily.id}`);

// Household + children
console.log("\n── Household famille + 2 enfants");
const household = await ensureHousehold(family.dbId);
console.log(`   household: ${household.id}`);
const c1 = await ensureChildProfile(family.dbId, "TEST_Ade", "chouette", 7, "lingala", "native", "E1");
const c2 = await ensureChildProfile(family.dbId, "TEST_Yara", "tortue", 9, "deutsch", "foreign", "M1");
console.log(`   enfant 1: ${c1.id} (TEST_Ade / lingala native)`);
console.log(`   enfant 2: ${c2.id} (TEST_Yara / deutsch foreign)`);

// Teacher
console.log("\n── Teacher + classroom + students");
const teacher = results.teacher;
const teacherProfile = await ensureTeacherProfile(teacher.dbId);
console.log(`   teacher profile: ${teacherProfile.id}`);
const classroom = await ensureClassroomV1(teacherProfile.id, `${TEST_NAME_PREFIX}KLASSE_A1`);
console.log(`   classroom V1: ${classroom.id} · code ${classroom.code}`);

// Center
console.log("\n── Language center");
const center = results.center;
const centerEntity = await ensureLanguageCenter(center.dbId, `${TEST_NAME_PREFIX}CENTRE_YEMA_DEV`);
console.log(`   center: ${centerEntity.id} · code ${centerEntity.code}`);

console.log("\n═══ Baseline created OK ═══");
console.log(JSON.stringify(results, null, 2));

await db.$disconnect();
