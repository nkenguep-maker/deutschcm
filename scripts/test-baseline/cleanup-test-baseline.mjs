// P-1 Baseline · CLEANUP
// Supprime tous les comptes Auth et données DB créés par create-test-baseline.
// Refuse toute suppression d'entité sans préfixe test.

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { assertNonProduction, ACCOUNTS, TEST_NAME_PREFIX } from "./_common.mjs";

assertNonProduction();

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
const db = new PrismaClient({ adapter, log: ["error"] });

console.log("═══ P-1 Baseline · CLEANUP ═══\n");

// 1. Cleanup child profiles (guard: only prenom starting TEST_)
const kids = await db.childProfile.deleteMany({
  where: { prenom: { startsWith: TEST_NAME_PREFIX } },
});
console.log(`✓ child_profiles TEST_ · ${kids.count} supprimé(s)`);

// 2. Cleanup teachers linked to test users
const testUsers = await db.user.findMany({
  where: { email: { contains: "yema_test_" } },
  select: { id: true, email: true },
});
console.log(`  ${testUsers.length} test users trouvés en DB`);

const testUserIds = testUsers.map((u) => u.id);

// Household + memberships
const hhs = await db.household.findMany({ where: { ownerUserId: { in: testUserIds } }, select: { id: true } });
const hhIds = hhs.map((h) => h.id);
await db.householdMembership.deleteMany({ where: { householdId: { in: hhIds } } });
await db.household.deleteMany({ where: { id: { in: hhIds } } });
console.log(`✓ households TEST_ · ${hhs.length} supprimé(s)`);

// Classrooms (V1) + assignments
const tps = await db.teacher.findMany({ where: { userId: { in: testUserIds } }, select: { id: true } });
const tpIds = tps.map((t) => t.id);
const classrooms = await db.classroom.findMany({
  where: { teacherId: { in: tpIds }, name: { startsWith: TEST_NAME_PREFIX } },
  select: { id: true },
});
const classroomIds = classrooms.map((c) => c.id);
await db.classroomEnrollment.deleteMany({ where: { classroomId: { in: classroomIds } } });
await db.assignmentSubmission.deleteMany({ where: { assignment: { classroomId: { in: classroomIds } } } });
await db.assignment.deleteMany({ where: { classroomId: { in: classroomIds } } });
await db.classroom.deleteMany({ where: { id: { in: classroomIds } } });
console.log(`✓ classrooms TEST_ · ${classrooms.length} supprimé(s)`);

// Teacher profiles
await db.teacher.deleteMany({ where: { userId: { in: testUserIds } } });
console.log(`✓ teacher profiles · ${tps.length} supprimé(s)`);

// LanguageCenter (only TEST_)
const centers = await db.languageCenter.deleteMany({
  where: { name: { startsWith: TEST_NAME_PREFIX } },
});
console.log(`✓ language_centers TEST_ · ${centers.count} supprimé(s)`);

// LearningPaths
await db.learningPath.deleteMany({ where: { userId: { in: testUserIds } } });
console.log(`✓ learning_paths des test users · deletemany`);

// UserRoles
await db.userRole.deleteMany({ where: { userId: { in: testUserIds } } });
console.log(`✓ user_roles des test users · deletemany`);

// Users
const usersDeleted = await db.user.deleteMany({ where: { id: { in: testUserIds } } });
console.log(`✓ users TEST_ · ${usersDeleted.count} supprimé(s)`);

// Supabase Auth users
const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
let authCount = 0;
for (const acc of ACCOUNTS) {
  const u = list.users.find((x) => x.email?.toLowerCase() === acc.email.toLowerCase());
  if (u) {
    if (!u.email.includes("yema_test_")) {
      throw new Error(`REFUSED: cannot delete non-test auth user ${u.email}`);
    }
    const { error } = await admin.auth.admin.deleteUser(u.id);
    if (error) console.log(`  ! failed to delete auth ${acc.label}: ${error.message}`);
    else authCount++;
  }
}
console.log(`✓ Supabase Auth users · ${authCount} supprimé(s)`);

console.log("\n═══ Cleanup complet ═══");
console.log("Note: storageState et captures Playwright sont hors DB — supprime manuellement :");
console.log("  rm -rf scripts/test-baseline/storage-state/ scripts/test-baseline/captures/");

await db.$disconnect();
