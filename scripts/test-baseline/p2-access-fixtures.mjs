// P2 · Fixtures d'accès Monde · pose ou supprime des AccessGrant TEST_
// sur le user monde du projet P-1. Idempotent, refuse la production.
//
// Usage :
//   node scripts/test-baseline/p2-access-fixtures.mjs active
//   node scripts/test-baseline/p2-access-fixtures.mjs expired
//   node scripts/test-baseline/p2-access-fixtures.mjs none
//
// Créé un AccessGrant sur beneficiaryType=USER, beneficiaryId=<dbUser.id>,
// sourceType=PROMO, sourceId="test-p2-fixture". Metadata contient
// { level: "A1", fixture: "TEST_P2_..." } pour identification/cleanup.

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { assertNonProduction, getTestPassword } from "./_common.mjs";

// Guard · lu pour valider présence, jamais loggé.
getTestPassword();
assertNonProduction();

const MODE = process.argv[2];
if (!["active", "expired", "none"].includes(MODE)) {
  console.error("Usage: node scripts/test-baseline/p2-access-fixtures.mjs <active|expired|none>");
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
  // Trouve (ou crée) une variante minimale pour lier l'AccessGrant.
  // On utilise sourceType=PROMO + sourceId marqué test, mais
  // AccessGrant.productVariantId est requis, il faut donc UN variant.
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

async function clearFixtures(dbUserId) {
  // Supprime les AccessGrants marqués TEST_P2_
  const deleted = await db.accessGrant.deleteMany({
    where: {
      beneficiaryType: "USER",
      beneficiaryId: dbUserId,
      sourceId: { startsWith: "test-p2-" },
    },
  });
  return deleted.count;
}

async function main() {
  console.log(`═══ P2 access fixture · mode=${MODE} ═══`);
  const dbUser = await findMondeUser();
  const cleared = await clearFixtures(dbUser.id);
  console.log(`  cleared ${cleared} previous TEST_P2 grant(s)`);

  if (MODE === "none") {
    console.log("  → no grant created (access = NONE)");
    await db.$disconnect();
    return;
  }

  const variant = await findOrCreatePriceVariant();
  const now = Date.now();
  const startsAt = new Date(now - 30 * 86_400_000);        // il y a 30 jours
  const endsAt = MODE === "active"
    ? new Date(now + 90 * 86_400_000)                       // +90 jours
    : new Date(now - 1 * 86_400_000);                       // hier · EXPIRED

  const grant = await db.accessGrant.create({
    data: {
      beneficiaryType: "USER",
      beneficiaryId: dbUser.id,
      productVariantId: variant.id,
      sourceType: "PROMO",
      sourceId: `test-p2-${MODE}`,
      startsAt, endsAt,
      status: "ACTIVE",
      metadata: { level: "A1", fixture: `TEST_P2_${MODE.toUpperCase()}`, note: "P2 test fixture" },
    },
  });
  console.log(`  → grant ${MODE} created · id=${grant.id.slice(0, 12)}… ends=${endsAt.toISOString().slice(0, 10)}`);

  await db.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
