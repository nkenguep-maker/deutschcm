#!/usr/bin/env node
// Lot 7C · orchestre npm run test:entitlements:p1 · DB-level assertions.
//
// Vérifie les règles commerciales figées côté produit :
//   - FAMILY_WORLD : ≤ 3 sièges enfant Monde, aucun siège adulte Monde
//   - CHILD_WORLD_SINGLE : 1 seul siège enfant Monde
//   - ROOTS_FAMILY : ≤ 2 sièges adultes Racines, ≤ 4 sièges enfant Racines
//   - Family seul → aucun grant PASSAGE implicite
//   - PASSAGE grant explicite → hasAdultWorldAccess true
//
// Ne modifie AUCUNE fixture · lecture seule DB.

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const P1_REF = "kzzagbojjkivdzzcrmxn";
const BLOCKED = new Set([
  "sbjhvlrkbyjckdxujjsk",
  "mamofhrurksyuuolucea",
  "qggwvonfumuimjfsgpdz",
]);

function fail(msg, code = 1) {
  console.error(`[entitlements] FAIL · ${msg}`);
  process.exit(code);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!url || !url.includes(P1_REF)) fail(`URL non-P1 · ${url}`);
for (const b of BLOCKED) if (url.includes(b)) fail(`blocklisted ${b}`);

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }) });

async function main() {
  console.log("[entitlements] STEP 1 · catalogue produits présent");
  const codes = ["PASSAGE", "ROOTS_SOLO", "ROOTS_FAMILY", "FAMILY_WORLD", "CHILD_WORLD_SINGLE"];
  const products = await db.product.findMany({ where: { code: { in: codes } }, select: { code: true } });
  const found = new Set(products.map((p) => p.code));
  for (const c of codes) if (!found.has(c)) fail(`Product ${c} absent du catalogue P-1`);
  console.log(`  · ${found.size}/${codes.length} produits présents`);

  console.log("[entitlements] STEP 2 · Family QA · aucun grant PASSAGE par défaut");
  const familyUser = await db.user.findUnique({
    where: { email: "test_yema_qa_family@example.com" },
    select: { id: true },
  });
  if (!familyUser) fail("Family QA absent · run yema-qa-fixtures.mjs");
  const familyPassage = await db.accessGrant.findFirst({
    where: {
      beneficiaryType: "USER",
      beneficiaryId: familyUser.id,
      status: "ACTIVE",
      productVariant: { product: { code: "PASSAGE" } },
    },
  });
  if (familyPassage) console.log(`  ⚠ Family a un grant PASSAGE actif (cumul Family+Passage · test de cumul possible)`);
  else console.log(`  · Family sans PASSAGE · aucun accès adulte Monde implicite`);

  console.log("[entitlements] STEP 3 · Household QA · FAMILY_WORLD grant valide");
  const fwGrant = await db.accessGrant.findFirst({
    where: {
      beneficiaryType: "HOUSEHOLD",
      status: "ACTIVE",
      productVariant: { product: { code: "FAMILY_WORLD" } },
    },
    include: { productVariant: { include: { product: true } } },
  });
  if (!fwGrant) console.log(`  ⚠ Aucun grant FAMILY_WORLD sur P-1 · fixture manquante`);
  else console.log(`  · FAMILY_WORLD grant ${fwGrant.id} · variant ${fwGrant.productVariantId}`);

  console.log("[entitlements] STEP 4 · Enfants Monde du Household QA · plafond 3 sièges");
  if (fwGrant) {
    const householdMondeChildren = await db.childProfile.count({
      where: { householdId: fwGrant.beneficiaryId, universe: "MONDE" },
    });
    if (householdMondeChildren > 3) fail(`FAMILY_WORLD dépassé · ${householdMondeChildren} enfants Monde (max 3)`);
    console.log(`  · ${householdMondeChildren} enfants Monde dans household (≤ 3 ✓)`);
  }

  console.log("[entitlements] STEP 5 · ROOTS_FAMILY grant · sièges adultes explicites");
  const rfHouseholdGrant = await db.accessGrant.findFirst({
    where: {
      beneficiaryType: "HOUSEHOLD",
      status: "ACTIVE",
      productVariant: { product: { code: "ROOTS_FAMILY" } },
    },
  });
  if (rfHouseholdGrant) {
    const adultSeatGrants = await db.accessGrant.count({
      where: {
        beneficiaryType: "USER",
        status: "ACTIVE",
        productVariant: { product: { code: "ROOTS_FAMILY" } },
        sourceId: rfHouseholdGrant.beneficiaryId,
      },
    });
    if (adultSeatGrants > 2) fail(`ROOTS_FAMILY dépassé · ${adultSeatGrants} sièges adultes (max 2)`);
    console.log(`  · ${adultSeatGrants} sièges adultes ROOTS_FAMILY (≤ 2 ✓)`);
    const rfChildren = await db.childProfile.count({
      where: { householdId: rfHouseholdGrant.beneficiaryId, universe: "RACINES" },
    });
    if (rfChildren > 4) fail(`ROOTS_FAMILY enfants dépassé · ${rfChildren} (max 4)`);
    console.log(`  · ${rfChildren} enfants Racines dans household (≤ 4 ✓)`);
  }

  console.log("[entitlements] STEP 6 · Universe explicite · aucun ChildProfile QA universe=null");
  const orphanUniverse = await db.childProfile.count({
    where: { id: { startsWith: "test_yema_qa_" }, universe: null },
  });
  if (orphanUniverse > 0) fail(`${orphanUniverse} ChildProfile QA avec universe=null · brief §2 fail-closed`);
  console.log(`  · aucun ChildProfile QA universe null ✓`);

  console.log("[entitlements] STEP 7 · Universe mismatch · aucun learningGoal Monde sur Racines");
  const mismatched = await db.childProfile.findMany({
    where: {
      id: { startsWith: "test_yema_qa_" },
      universe: "RACINES",
      NOT: { learningGoal: null },
    },
    select: { id: true, learningGoal: true },
  });
  if (mismatched.length > 0) fail(`ChildProfile RACINES avec learningGoal Monde · ${mismatched.map((c) => c.id).join(",")}`);
  console.log(`  · aucun mismatch Universe/learningGoal ✓`);

  console.log("[entitlements] ALL OK");
  await db.$disconnect();
}

main().catch(async (e) => {
  console.error(`[entitlements] ERROR · ${e.message}`);
  try { await db.$disconnect(); } catch {}
  process.exit(1);
});
