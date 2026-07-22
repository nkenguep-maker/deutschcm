// P2 · Fixtures d'accès + progression Monde · idempotent, refuse la prod.
//
// Usage :
//   node scripts/test-baseline/p2-access-fixtures.mjs active     # grant +90j, aucun progress touché
//   node scripts/test-baseline/p2-access-fixtures.mjs expired    # grant endsAt hier, progress conservé
//   node scripts/test-baseline/p2-access-fixtures.mjs none       # aucun grant, aucun progress touché
//   node scripts/test-baseline/p2-access-fixtures.mjs new        # grant +90j, TOUS les ModuleProgress TEST_ effacés
//   node scripts/test-baseline/p2-access-fixtures.mjs completed  # grant +90j, TOUS les modules a1-beta-* posés COMPLETED
//
// Cibles · le user monde du projet P-1 uniquement. Grants marqués
// TEST_P2_* (sourceId=test-p2-*) et ModuleProgress via userId scopé.

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { assertNonProduction, getTestPassword } from "./_common.mjs";

getTestPassword();
assertNonProduction();

const MODE = process.argv[2];
const VALID_MODES = ["active", "expired", "none", "new", "completed"];
if (!VALID_MODES.includes(MODE)) {
  console.error(`Usage: node scripts/test-baseline/p2-access-fixtures.mjs <${VALID_MODES.join("|")}>`);
  process.exit(1);
}

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
const db = new PrismaClient({ adapter, log: ["error"] });

async function findMondeUser() {
  const { data } = await admin.auth.admin.listUsers({ perPage: 200 });
  const monde = data.users.find((u) => u.email === "paul+yema_test_monde@example.com");
  if (!monde) throw new Error("monde test user not found · run create-test-baseline first");
  const dbUser = await db.user.findFirst({ where: { supabaseId: monde.id }, select: { id: true } });
  if (!dbUser) throw new Error("db user for monde not found");
  return dbUser;
}

async function findOrCreatePriceVariant() {
  let product = await db.product.findFirst({ where: { code: "PASSAGE" } });
  if (!product) {
    product = await db.product.create({
      data: { code: "PASSAGE", universe: "MONDE", billingType: "ONE_TIME", isActive: true },
    });
    console.log("  created product PASSAGE");
  }
  let variant = await db.productVariant.findFirst({
    where: { productId: product.id, currency: "EUR", level: "A1" },
  });
  if (!variant) {
    variant = await db.productVariant.create({
      data: {
        productId: product.id, language: "DEUTSCH", level: "A1",
        currency: "EUR", amount: 7500, durationDays: 120,
      },
    });
    console.log("  created variant A1 EUR (test)");
  }
  return variant;
}

/** Ou trouve, ou crée un Course + Module Prisma "test" pour attacher ModuleProgress.
 *  Utilise l'ID exact du module dans src/data/a1-beta-modules.ts comme id Prisma.
 *  Cela permet aux queries dashboard (moduleId startsWith "a1-beta-") de matcher. */
async function ensureA1BetaModules() {
  const A1_BETA_IDS = [];
  for (let l = 1; l <= 5; l++) {
    for (const type of ["lesen", "hoeren", "sprechen", "schreiben", "quiz"]) {
      A1_BETA_IDS.push(`a1-beta-${l}-${type}`);
    }
  }
  // Course parent
  let course = await db.course.findFirst({ where: { title: "TEST_A1_BETA" } });
  if (!course) {
    course = await db.course.create({
      data: {
        title: "TEST_A1_BETA",
        description: "Test course for P2 fixtures · A1 Beta modules",
        level: "A1",
        isPublished: false,
      },
    });
    console.log("  created course TEST_A1_BETA");
  }
  let created = 0;
  for (const [i, id] of A1_BETA_IDS.entries()) {
    const existing = await db.module.findUnique({ where: { id } });
    if (!existing) {
      await db.module.create({
        data: {
          id,                                   // clé identique à src/data/a1-beta-modules.ts
          courseId: course.id,
          title: id,
          type: "LESSON",
          sortOrder: i,
          isPublished: true,
        },
      });
      created++;
    }
  }
  if (created > 0) console.log(`  created ${created} test module rows for a1-beta-*`);
  return A1_BETA_IDS;
}

async function clearGrants(dbUserId) {
  const deleted = await db.accessGrant.deleteMany({
    where: {
      beneficiaryType: "USER",
      beneficiaryId: dbUserId,
      sourceId: { startsWith: "test-p2-" },
    },
  });
  return deleted.count;
}

async function clearModuleProgress(dbUserId) {
  const deleted = await db.moduleProgress.deleteMany({
    where: { userId: dbUserId, moduleId: { startsWith: "a1-beta-" } },
  });
  return deleted.count;
}

async function createGrant(dbUser, variant, mode) {
  const now = Date.now();
  const startsAt = new Date(now - 30 * 86_400_000);
  const endsAt = mode === "expired"
    ? new Date(now - 1 * 86_400_000)
    : new Date(now + 90 * 86_400_000);
  const grant = await db.accessGrant.create({
    data: {
      beneficiaryType: "USER",
      beneficiaryId: dbUser.id,
      productVariantId: variant.id,
      sourceType: "PROMO",
      sourceId: `test-p2-${mode}`,
      startsAt, endsAt,
      status: "ACTIVE",
      metadata: { level: "A1", fixture: `TEST_P2_${mode.toUpperCase()}`, note: "P2 test fixture" },
    },
  });
  console.log(`  → grant ${mode} created · id=${grant.id.slice(0, 12)}… ends=${endsAt.toISOString().slice(0, 10)}`);
}

async function seedProgress(dbUserId, moduleIds) {
  const now = new Date();
  let created = 0;
  for (const [i, moduleId] of moduleIds.entries()) {
    await db.moduleProgress.upsert({
      where: { userId_moduleId: { userId: dbUserId, moduleId } },
      update: {
        status: "COMPLETED",
        completedAt: now,
        startedAt: new Date(now.getTime() - (moduleIds.length - i) * 60_000),
      },
      create: {
        userId: dbUserId, moduleId,
        status: "COMPLETED",
        completedAt: now,
        startedAt: new Date(now.getTime() - (moduleIds.length - i) * 60_000),
      },
    });
    created++;
  }
  console.log(`  → seeded ${created} ModuleProgress COMPLETED`);
}

async function main() {
  console.log(`═══ P2 access fixture · mode=${MODE} ═══`);
  const dbUser = await findMondeUser();

  // Grants : toujours reset avant chaque run
  const clearedGrants = await clearGrants(dbUser.id);
  console.log(`  cleared ${clearedGrants} previous TEST_P2 grant(s)`);

  // ModuleProgress · reset uniquement pour NEW / COMPLETED / NONE
  // pour ne pas casser une session de dev déjà en cours quand on toggle
  // simplement grant active/expired sans vouloir toucher la progression.
  if (MODE === "new" || MODE === "completed" || MODE === "none") {
    const clearedProgress = await clearModuleProgress(dbUser.id);
    console.log(`  cleared ${clearedProgress} previous ModuleProgress a1-beta-*`);
  }

  if (MODE === "none") {
    console.log("  → no grant created (access = NONE, progress cleared)");
    await db.$disconnect();
    return;
  }

  const variant = await findOrCreatePriceVariant();
  await createGrant(dbUser, variant, MODE === "new" || MODE === "completed" ? "active" : MODE);

  if (MODE === "completed") {
    const modIds = await ensureA1BetaModules();
    await seedProgress(dbUser.id, modIds);
  }

  await db.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
