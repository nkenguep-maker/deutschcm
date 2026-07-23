// P4.1 · Concurrence réelle des gardes de capacité (troisième adulte,
// cinquième enfant) via assertCircleAdultCapacity / assertCircleChildCapacity
// exécutés dans des transactions Serializable parallèles.
//
// Prérequis · fixtures posées via `node scripts/test-baseline/p4-1-fixtures.mjs seed`.
// Cible · P-1 (kzzagbojjkivdzzcrmxn). Jamais production.

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";
import { assertNonProduction, getTestPassword } from "./_common.mjs";

// Reproduction locale (Node runtime) des gardes définies dans
// src/lib/circles/capacity.ts · évite le besoin d'un build TypeScript
// pour exécuter les tests P-1. La logique DOIT rester alignée.
const MAX_ADULTS_PER_CIRCLE = 2;
const MAX_CHILDREN_PER_CIRCLE = 4;

class CapacityError extends Error {
  constructor(code, message, detail) {
    super(message);
    this.name = "CapacityError";
    this.code = code;
    this.detail = detail;
  }
}

async function assertCircleAdultCapacity(tx, circleId) {
  const count = await tx.circleMembership.count({
    where: { circleId, status: "ACTIVE", role: { in: ["OWNER", "ADULT"] } },
  });
  if (count >= MAX_ADULTS_PER_CIRCLE) {
    throw new CapacityError("max_adults_reached", "adult capacity reached", {
      limit: MAX_ADULTS_PER_CIRCLE, current: count,
    });
  }
}

async function assertCircleChildCapacity(tx, circleId) {
  const count = await tx.circleMembership.count({
    where: { circleId, status: "ACTIVE", role: "CHILD" },
  });
  if (count >= MAX_CHILDREN_PER_CIRCLE) {
    throw new CapacityError("max_children_reached", "child capacity reached", {
      limit: MAX_CHILDREN_PER_CIRCLE, current: count,
    });
  }
}

assertNonProduction();
getTestPassword();

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
const db = new PrismaClient({ adapter, log: ["error"] });
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const CIRCLE_A = "test_p4_1_circle_a_lingala";
const HH_A = "test_p4_1_hh_a";
const events = [];
function log(label, obj) {
  events.push({ label, ...obj });
  process.stderr.write(`  ${label} · ${JSON.stringify(obj)}\n`);
}

async function ensureExtra(email, fullName) {
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
  let a = list.users.find((u) => u.email === email);
  if (!a) {
    const { data } = await admin.auth.admin.createUser({
      email, password: process.env.P1_TEST_PASSWORD, email_confirm: true,
      user_metadata: { fixture: "TEST_P4_1_RACE" },
    });
    a = data.user;
  }
  let dbu = await db.user.findFirst({ where: { supabaseId: a.id } });
  if (!dbu) {
    dbu = await db.user.create({
      data: { supabaseId: a.id, email, fullName, role: "STUDENT" },
    });
  }
  return { auth: a, db: dbu };
}

async function cleanupExtras(emails) {
  await db.circleMembership.deleteMany({
    where: { user: { email: { in: emails } } },
  });
  await db.userAppRole.deleteMany({
    where: { user: { email: { in: emails } } },
  });
  const dbUsers = await db.user.findMany({ where: { email: { in: emails } }, select: { id: true } });
  await db.user.deleteMany({ where: { id: { in: dbUsers.map((u) => u.id) } } });
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
  for (const email of emails) {
    const u = list.users.find((x) => x.email?.toLowerCase() === email.toLowerCase());
    if (u) await admin.auth.admin.deleteUser(u.id);
  }
}

async function addAdultInTx(userId) {
  return db.$transaction(
    async (tx) => {
      await assertCircleAdultCapacity(tx, CIRCLE_A);
      return tx.circleMembership.create({
        data: {
          circleId: CIRCLE_A, role: "ADULT", status: "ACTIVE",
          userId, joinedAt: new Date(),
        },
        select: { id: true, userId: true },
      });
    },
    { isolationLevel: "Serializable" },
  );
}

async function addChildInTx(childId) {
  return db.$transaction(
    async (tx) => {
      await assertCircleChildCapacity(tx, CIRCLE_A);
      return tx.circleMembership.create({
        data: {
          circleId: CIRCLE_A, role: "CHILD", status: "ACTIVE",
          childProfileId: childId, joinedAt: new Date(),
        },
        select: { id: true, childProfileId: true },
      });
    },
    { isolationLevel: "Serializable" },
  );
}

async function testThirdAdult() {
  process.stderr.write("\n═══ §3 · Concurrence 3ᵉ adulte (max 2) ═══\n");
  // État de départ · fixtures posent OWNER + ADULT (2 adultes déjà).
  const before = await db.circleMembership.count({
    where: { circleId: CIRCLE_A, status: "ACTIVE", role: { in: ["OWNER", "ADULT"] } },
  });
  log("initial active adults", { count: before, expect: MAX_ADULTS_PER_CIRCLE });

  const [x, y] = await Promise.all([
    ensureExtra("paul+p4_1_race_x@example.com", "TEST P4.1 race X"),
    ensureExtra("paul+p4_1_race_y@example.com", "TEST P4.1 race Y"),
  ]);

  // Deux ADULT concurrents · les deux devraient être refusés.
  const results = await Promise.allSettled([
    addAdultInTx(x.db.id),
    addAdultInTx(y.db.id),
  ]);
  const succ = results.filter((r) => r.status === "fulfilled");
  const fail = results.filter((r) => r.status === "rejected");
  const failCodes = fail.map((r) => {
    const err = r.reason;
    if (err instanceof CapacityError) return err.code;
    return err?.code ?? err?.message?.slice(0, 60);
  });
  log("concurrent 3rd adult attempts", {
    successes: succ.length,
    failures: fail.length,
    failureCodes: failCodes,
  });

  const after = await db.circleMembership.count({
    where: { circleId: CIRCLE_A, status: "ACTIVE", role: { in: ["OWNER", "ADULT"] } },
  });
  log("final active adults", { count: after, expect: MAX_ADULTS_PER_CIRCLE, ok: after === MAX_ADULTS_PER_CIRCLE });

  // Cleanup any successful membership + extras
  for (const r of succ) {
    if (r.value?.id) await db.circleMembership.delete({ where: { id: r.value.id } });
  }
  await cleanupExtras(["paul+p4_1_race_x@example.com", "paul+p4_1_race_y@example.com"]);
}

async function testFifthChild() {
  process.stderr.write("\n═══ §4 · Concurrence 5ᵉ enfant (max 4) ═══\n");
  // Fixtures posent 2 CHILD. Ajoutons 2 CHILD supplémentaires pour arriver à 4.
  const owner = await db.user.findFirst({ where: { email: "paul+p4_1_owner_a@example.com" } });
  const extraKids = [];
  for (let i = 0; i < 2; i++) {
    const c = await db.childProfile.create({
      data: {
        id: `test_p4_1_race_kid_${i}`,
        parentUserId: owner.id,
        householdId: HH_A,
        prenom: `TEST_RaceKid${i}`,
        avatarAnimal: "chouette",
        age: 6 + i,
        langues: [],
      },
    });
    await db.circleMembership.create({
      data: {
        circleId: CIRCLE_A, role: "CHILD", status: "ACTIVE",
        childProfileId: c.id, joinedAt: new Date(),
      },
    });
    extraKids.push(c);
  }
  const before = await db.circleMembership.count({
    where: { circleId: CIRCLE_A, status: "ACTIVE", role: "CHILD" },
  });
  log("initial active children", { count: before, expect: MAX_CHILDREN_PER_CIRCLE });

  // Créer 2 enfants supplémentaires · non liés au cercle · pour tester ajout concurrent
  const race = [];
  for (let i = 0; i < 2; i++) {
    const c = await db.childProfile.create({
      data: {
        id: `test_p4_1_race_5th_${i}`,
        parentUserId: owner.id,
        householdId: HH_A,
        prenom: `TEST_Race5th${i}`,
        avatarAnimal: "tortue",
        age: 5,
        langues: [],
      },
    });
    race.push(c);
  }

  const results = await Promise.allSettled([
    addChildInTx(race[0].id),
    addChildInTx(race[1].id),
  ]);
  const succ = results.filter((r) => r.status === "fulfilled");
  const fail = results.filter((r) => r.status === "rejected");
  const failCodes = fail.map((r) => {
    const err = r.reason;
    if (err instanceof CapacityError) return err.code;
    return err?.code ?? err?.message?.slice(0, 60);
  });
  log("concurrent 5th child attempts", {
    successes: succ.length,
    failures: fail.length,
    failureCodes: failCodes,
  });

  const after = await db.circleMembership.count({
    where: { circleId: CIRCLE_A, status: "ACTIVE", role: "CHILD" },
  });
  log("final active children", { count: after, expect: MAX_CHILDREN_PER_CIRCLE, ok: after === MAX_CHILDREN_PER_CIRCLE });

  // Cleanup
  for (const r of succ) {
    if (r.value?.id) await db.circleMembership.delete({ where: { id: r.value.id } });
  }
  for (const c of [...extraKids, ...race]) {
    await db.childProfile.delete({ where: { id: c.id } });
  }
}

async function main() {
  try {
    await testThirdAdult();
    await testFifthChild();
  } finally {
    await db.$disconnect();
  }
  const { writeFile, mkdir } = await import("node:fs/promises");
  await mkdir("/tmp/p4-1-captures", { recursive: true });
  await writeFile("/tmp/p4-1-captures/capacity-race.json", JSON.stringify(events, null, 2));
  process.stderr.write(`\nWritten /tmp/p4-1-captures/capacity-race.json (${events.length} events)\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
