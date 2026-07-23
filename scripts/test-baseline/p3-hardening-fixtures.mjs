// P3 hardening · fixtures d'accès Racines par produit (SOLO / FAMILY / NO_ACCESS).
//
// Usage :
//   node scripts/test-baseline/p3-hardening-fixtures.mjs family-empty
//     → parent Family : grant ROOTS_FAMILY actif, 0 enfants
//   node scripts/test-baseline/p3-hardening-fixtures.mjs family-full
//     → parent Family : grant ROOTS_FAMILY actif, enfants restaurés
//   node scripts/test-baseline/p3-hardening-fixtures.mjs solo
//     → parent Solo : grant ROOTS_SOLO actif
//   node scripts/test-baseline/p3-hardening-fixtures.mjs no-access
//     → parent Solo : aucun grant, aucun activationIntent
//   node scripts/test-baseline/p3-hardening-fixtures.mjs restore
//     → réinitialise SOLO + FAMILY dans leur état "healthy" de base
//
// Cibles · users solo/family du projet P-1 uniquement. Grants marqués
// TEST_P3_HARD_* (sourceId=test-p3-hard-*).

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { assertNonProduction, getTestPassword } from "./_common.mjs";

getTestPassword();
assertNonProduction();

const MODE = process.argv[2];
const VALID = ["family-empty", "family-full", "solo", "no-access", "restore"];
if (!VALID.includes(MODE)) {
  console.error(`Usage: node scripts/test-baseline/p3-hardening-fixtures.mjs <${VALID.join("|")}>`);
  process.exit(1);
}

const EMAILS = {
  solo:   "paul+yema_test_racines_solo@example.com",
  family: "paul+yema_test_racines_family@example.com",
};

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
const db = new PrismaClient({ adapter, log: ["error"] });

async function findUser(email) {
  const { data } = await admin.auth.admin.listUsers({ perPage: 200 });
  const u = data.users.find((x) => x.email === email);
  if (!u) throw new Error(`test user not found: ${email}`);
  const dbUser = await db.user.findFirst({ where: { supabaseId: u.id }, select: { id: true } });
  if (!dbUser) throw new Error(`db user missing for ${email}`);
  return { supabaseId: u.id, dbId: dbUser.id };
}

async function ensureProduct(code) {
  let p = await db.product.findFirst({ where: { code } });
  if (!p) {
    p = await db.product.create({
      data: { code, universe: "RACINES", billingType: "SUBSCRIPTION", isActive: true },
    });
    console.log(`  created product ${code}`);
  }
  let v = await db.productVariant.findFirst({ where: { productId: p.id, currency: "EUR" } });
  if (!v) {
    v = await db.productVariant.create({
      data: { productId: p.id, language: "KIKONGO", level: "E1", currency: "EUR", amount: 900, durationDays: 30 },
    });
    console.log(`  created variant for ${code}`);
  }
  return v;
}

async function clearRacinesGrants(dbId) {
  const deleted = await db.accessGrant.deleteMany({
    where: {
      beneficiaryType: "USER",
      beneficiaryId: dbId,
      sourceId: { startsWith: "test-p3-hard-" },
    },
  });
  return deleted.count;
}

async function createRacinesGrant(dbId, variantId, tag) {
  const now = Date.now();
  await db.accessGrant.create({
    data: {
      beneficiaryType: "USER",
      beneficiaryId: dbId,
      productVariantId: variantId,
      sourceType: "PROMO",
      sourceId: `test-p3-hard-${tag.toLowerCase()}`,
      startsAt: new Date(now - 7 * 86_400_000),
      endsAt: new Date(now + 90 * 86_400_000),
      status: "ACTIVE",
      metadata: { fixture: `TEST_P3_HARD_${tag}` },
    },
  });
}

async function setActivationIntent(supabaseId, offer) {
  const { data: { user } } = await admin.auth.admin.getUserById(supabaseId);
  const md = user?.user_metadata ?? {};
  const answers = md.onboardingAnswers ?? {};
  const nextAnswers = offer
    ? { ...answers, activationIntent: { ...(answers.activationIntent ?? {}), racinesOffer: offer } }
    : Object.fromEntries(Object.entries(answers).filter(([k]) => k !== "activationIntent"));
  await admin.auth.admin.updateUserById(supabaseId, {
    user_metadata: { ...md, onboardingAnswers: nextAnswers },
  });
}

async function deleteAllChildren(dbId) {
  const deleted = await db.childProfile.deleteMany({
    where: { parentUserId: dbId, prenom: { startsWith: "TEST_" } },
  });
  return deleted.count;
}

async function ensureFamilyChildren(dbId) {
  const existing = await db.childProfile.count({ where: { parentUserId: dbId } });
  if (existing >= 2) return existing;
  const kids = [
    { prenom: "TEST_Ade", age: 8, avatarAnimal: "chouette", activeLangue: "lingala",
      langues: [{ langue: "lingala", type: "native", echelle: "E1", etoiles: 0, motsAppris: [] }] },
    { prenom: "TEST_Yara", age: 6, avatarAnimal: "panda", activeLangue: "swahili",
      langues: [{ langue: "swahili", type: "native", echelle: "E1", etoiles: 0, motsAppris: [] }] },
  ];
  for (const k of kids) {
    await db.childProfile.create({ data: { parentUserId: dbId, ...k } });
  }
  return kids.length;
}

async function main() {
  console.log(`═══ P3 hardening fixture · mode=${MODE} ═══`);
  const solo = await findUser(EMAILS.solo);
  const family = await findUser(EMAILS.family);

  // Reset baseline pour tous les modes.
  const [c1, c2] = await Promise.all([clearRacinesGrants(solo.dbId), clearRacinesGrants(family.dbId)]);
  console.log(`  cleared TEST_P3_HARD grants · solo=${c1} family=${c2}`);

  if (MODE === "family-empty") {
    const v = await ensureProduct("ROOTS_FAMILY");
    await createRacinesGrant(family.dbId, v.id, "FAMILY_EMPTY");
    const n = await deleteAllChildren(family.dbId);
    console.log(`  → FAMILY grant + ${n} enfants supprimés`);
  } else if (MODE === "family-full") {
    const v = await ensureProduct("ROOTS_FAMILY");
    await createRacinesGrant(family.dbId, v.id, "FAMILY_FULL");
    const n = await ensureFamilyChildren(family.dbId);
    console.log(`  → FAMILY grant + ${n} enfants (min garanti)`);
  } else if (MODE === "solo") {
    const v = await ensureProduct("ROOTS_SOLO");
    await createRacinesGrant(solo.dbId, v.id, "SOLO");
    await setActivationIntent(solo.supabaseId, "SOLO");
    console.log(`  → SOLO grant + activationIntent SOLO`);
  } else if (MODE === "no-access") {
    await setActivationIntent(solo.supabaseId, null);
    console.log(`  → aucun grant, activationIntent effacé`);
  } else if (MODE === "restore") {
    const vSolo = await ensureProduct("ROOTS_SOLO");
    const vFam = await ensureProduct("ROOTS_FAMILY");
    await createRacinesGrant(solo.dbId, vSolo.id, "SOLO");
    await createRacinesGrant(family.dbId, vFam.id, "FAMILY_FULL");
    await ensureFamilyChildren(family.dbId);
    await setActivationIntent(solo.supabaseId, "SOLO");
    await setActivationIntent(family.supabaseId, "FAMILLE");
    console.log(`  → SOLO + FAMILY restaurés`);
  }

  await db.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
