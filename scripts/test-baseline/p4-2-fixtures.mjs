// P4.2 · Fixtures P-1 · Circle + invitation adulte + coach + enfants.
// Réutilise / étend les fixtures P4.1. Idempotent. Refuse la production.
//
// Personas :
//   ownerA · OWNER de Circle A LINGALA
//   adultA · ADULT ACTIVE dans Circle A (déjà présent)
//   invitedAdult · destinataire d'une invitation PENDING valide
//   coachA · COACH ACTIVE (AppRole = RACINES_COACH)
//   secondCoach · RACINES_COACH additionnel (pour tests double coach)
//   ownerB · OWNER de Circle B WOLOF (cross-tenant)
//   4 childProfiles (A1..A4) rattachés au foyer A

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createHash, randomBytes } from "node:crypto";
import { assertNonProduction, getTestPassword } from "./_common.mjs";

const MODE = process.argv[2];
if (!["seed", "clean", "list"].includes(MODE)) {
  console.error("Usage · node scripts/test-baseline/p4-2-fixtures.mjs <seed|clean|list>");
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

const EMAILS = {
  ownerA:       "paul+p4_2_owner_a@example.com",
  adultA:       "paul+p4_2_adult_a@example.com",
  invitedAdult: "paul+p4_2_invited_adult@example.com",
  coachA:       "paul+p4_2_coach_a@example.com",
  secondCoach:  "paul+p4_2_second_coach@example.com",
  ownerB:       "paul+p4_2_owner_b@example.com",
  yemaAdmin:    "paul+p4_2_yema_admin@example.com",
};

const HH_A = "test_p4_2_hh_a";
const HH_B = "test_p4_2_hh_b";
const CIRCLE_A = "test_p4_2_circle_a_lingala";
const CIRCLE_B = "test_p4_2_circle_b_wolof";
const CHILDREN = ["A1", "A2", "A3", "A4"].map((k) => `test_p4_2_child_${k.toLowerCase()}`);

function hashEmail(e) {
  return createHash("sha256").update(e.trim().toLowerCase(), "utf8").digest("hex");
}
function hashToken(t) {
  return createHash("sha256").update(t, "utf8").digest("hex");
}

async function ensureAuth(email, fullName) {
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
  let a = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!a) {
    const { data } = await admin.auth.admin.createUser({
      email, password: PW, email_confirm: true,
      user_metadata: { fixture: "TEST_P4_2", full_name: fullName },
    });
    a = data.user;
  }
  return a;
}

async function ensureDbUser(supabaseId, email, fullName) {
  const ex = await db.user.findFirst({ where: { supabaseId } });
  if (ex) return ex;
  return db.user.create({
    data: { supabaseId, email, fullName, role: "STUDENT" },
  });
}

async function ensureAppRole(userId, role) {
  await db.userAppRole.upsert({
    where: { userId_role: { userId, role } },
    update: {},
    create: { userId, role },
  });
}

async function ensureHousehold(id, ownerUserId) {
  return db.household.upsert({
    where: { id },
    update: { ownerUserId },
    create: { id, ownerUserId, status: "ACTIVE" },
  });
}

async function ensureCircleActive(id, householdId, language, createdByUserId) {
  const ex = await db.circle.findFirst({ where: { id } });
  if (ex) {
    return db.circle.update({
      where: { id }, data: { status: "ACTIVE", archivedAt: null, createdByUserId },
    });
  }
  return db.circle.create({
    data: { id, householdId, language, status: "ACTIVE", createdByUserId },
  });
}

async function ensureMembership(circleId, role, opts) {
  const where = opts.userId
    ? { circleId, userId: opts.userId, status: "ACTIVE" }
    : { circleId, childProfileId: opts.childProfileId, status: "ACTIVE" };
  const ex = await db.circleMembership.findFirst({ where });
  if (ex) {
    return db.circleMembership.update({
      where: { id: ex.id }, data: { role, status: "ACTIVE" },
    });
  }
  return db.circleMembership.create({
    data: {
      circleId, role, status: "ACTIVE",
      userId: opts.userId ?? null,
      childProfileId: opts.childProfileId ?? null,
      invitedByUserId: opts.invitedByUserId ?? null,
      joinedAt: new Date(),
    },
  });
}

async function ensureChild(id, parentUserId, householdId, prenom, animal, age) {
  const ex = await db.childProfile.findFirst({ where: { id } });
  if (ex) return db.childProfile.update({
    where: { id }, data: { parentUserId, householdId, prenom, avatarAnimal: animal, age },
  });
  return db.childProfile.create({
    data: { id, parentUserId, householdId, prenom, avatarAnimal: animal, age, langues: [] },
  });
}

async function seed() {
  console.log("═══ P4.2 · seed ═══");
  const authUsers = await Promise.all(
    Object.entries(EMAILS).map(([k, email]) => ensureAuth(email, `TEST P4.2 ${k}`)),
  );
  const [ownerAAuth, adultAAuth, invitedAuth, coachAAuth, secondCoachAuth, ownerBAuth, adminAuth] = authUsers;
  const [ownerA, adultA, invitedAdult, coachA, secondCoach, ownerB, yemaAdmin] = await Promise.all([
    ensureDbUser(ownerAAuth.id, EMAILS.ownerA, "TEST P4.2 owner A"),
    ensureDbUser(adultAAuth.id, EMAILS.adultA, "TEST P4.2 adult A"),
    ensureDbUser(invitedAuth.id, EMAILS.invitedAdult, "TEST P4.2 invited adult"),
    ensureDbUser(coachAAuth.id, EMAILS.coachA, "TEST P4.2 coach A"),
    ensureDbUser(secondCoachAuth.id, EMAILS.secondCoach, "TEST P4.2 second coach"),
    ensureDbUser(ownerBAuth.id, EMAILS.ownerB, "TEST P4.2 owner B"),
    ensureDbUser(adminAuth.id, EMAILS.yemaAdmin, "TEST P4.2 admin"),
  ]);
  await Promise.all([
    ensureAppRole(ownerA.id, "PARENT"),
    ensureAppRole(adultA.id, "PARENT"),
    ensureAppRole(invitedAdult.id, "PARENT"),
    ensureAppRole(coachA.id, "RACINES_COACH"),
    ensureAppRole(secondCoach.id, "RACINES_COACH"),
    ensureAppRole(ownerB.id, "PARENT"),
    ensureAppRole(yemaAdmin.id, "YEMA_ADMIN"),
  ]);

  const hA = await ensureHousehold(HH_A, ownerA.id);
  const hB = await ensureHousehold(HH_B, ownerB.id);
  const cA = await ensureCircleActive(CIRCLE_A, hA.id, "LINGALA", ownerA.id);
  const cB = await ensureCircleActive(CIRCLE_B, hB.id, "WOLOF", ownerB.id);

  // Enfants foyer A · 4 (à la limite)
  const children = await Promise.all([
    ensureChild(CHILDREN[0], ownerA.id, hA.id, "TEST_A1", "chouette", 7),
    ensureChild(CHILDREN[1], ownerA.id, hA.id, "TEST_A2", "tortue", 6),
    ensureChild(CHILDREN[2], ownerA.id, hA.id, "TEST_A3", "panda", 5),
    ensureChild(CHILDREN[3], ownerA.id, hA.id, "TEST_A4", "girafe", 4),
  ]);

  // Memberships Circle A · OWNER + ADULT + COACH + 4 CHILD (foyer complet)
  await ensureMembership(cA.id, "OWNER", { userId: ownerA.id, invitedByUserId: ownerA.id });
  await ensureMembership(cA.id, "ADULT", { userId: adultA.id, invitedByUserId: ownerA.id });
  await ensureMembership(cA.id, "COACH", { userId: coachA.id, invitedByUserId: yemaAdmin.id });
  for (const c of children) {
    await ensureMembership(cA.id, "CHILD", { childProfileId: c.id, invitedByUserId: ownerA.id });
  }
  // Circle B · OWNER seul (cross-tenant)
  await ensureMembership(cB.id, "OWNER", { userId: ownerB.id, invitedByUserId: ownerB.id });

  // Invitations · valide, expirée, révoquée · pour tests token
  const now = new Date();
  await db.circleInvitation.deleteMany({
    where: { circleId: cA.id, invitedEmailHash: hashEmail(EMAILS.invitedAdult) },
  });
  const validRaw = randomBytes(32).toString("base64url");
  const expiredRaw = randomBytes(32).toString("base64url");
  const revokedRaw = randomBytes(32).toString("base64url");
  await db.circleInvitation.create({
    data: {
      id: "test_p4_2_inv_valid",
      circleId: cA.id, role: "ADULT", status: "PENDING",
      invitedEmailHash: hashEmail(EMAILS.invitedAdult),
      invitedByUserId: ownerA.id,
      tokenHash: hashToken(validRaw),
      expiresAt: new Date(now.getTime() + 72 * 3600_000),
    },
  });
  await db.circleInvitation.create({
    data: {
      id: "test_p4_2_inv_expired",
      circleId: cA.id, role: "ADULT", status: "EXPIRED",
      invitedEmailHash: hashEmail("expired+" + EMAILS.invitedAdult),
      invitedByUserId: ownerA.id,
      tokenHash: hashToken(expiredRaw),
      expiresAt: new Date(now.getTime() - 3600_000),
    },
  });
  await db.circleInvitation.create({
    data: {
      id: "test_p4_2_inv_revoked",
      circleId: cA.id, role: "ADULT", status: "REVOKED",
      invitedEmailHash: hashEmail("revoked+" + EMAILS.invitedAdult),
      invitedByUserId: ownerA.id,
      tokenHash: hashToken(revokedRaw),
      expiresAt: new Date(now.getTime() + 3600_000),
      revokedAt: now,
      revokedByUserId: ownerA.id,
    },
  });

  console.log(`  circles A=${cA.id} B=${cB.id}`);
  console.log(`  fixtures OK · pending token stored (hash only)`);
  console.log(`  invited email · ${EMAILS.invitedAdult}`);
  // Note · le token brut n'est jamais imprimé. Les tests le regénèrent via
  // POST /api/circles/[cid]/invitations/adult qui retourne X-P4-Test-Token.
  await db.$disconnect();
}

async function clean() {
  console.log("═══ P4.2 · clean ═══");
  const emails = Object.values(EMAILS);
  await db.circleInvitation.deleteMany({ where: { id: { startsWith: "test_p4_2_" } } });
  await db.circleMembership.deleteMany({ where: { circleId: { startsWith: "test_p4_2_" } } });
  await db.circle.deleteMany({ where: { id: { startsWith: "test_p4_2_" } } });
  await db.childProfile.deleteMany({ where: { id: { startsWith: "test_p4_2_" } } });
  await db.household.deleteMany({ where: { id: { startsWith: "test_p4_2_" } } });
  await db.auditEvent.deleteMany({
    where: { OR: [{ scopeId: { startsWith: "test_p4_2_" } }, { targetId: { startsWith: "test_p4_2_" } }] },
  });
  const dbUsers = await db.user.findMany({ where: { email: { in: emails } }, select: { id: true } });
  const ids = dbUsers.map((u) => u.id);
  if (ids.length) {
    await db.userAppRole.deleteMany({ where: { userId: { in: ids } } });
    await db.user.deleteMany({ where: { id: { in: ids } } });
  }
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
  for (const email of emails) {
    const u = list.users.find((x) => x.email?.toLowerCase() === email.toLowerCase());
    if (u) await admin.auth.admin.deleteUser(u.id);
  }
  console.log(`  cleaned · ${ids.length} db users · ${emails.length} auth users · invitations + circles + fixtures`);
  await db.$disconnect();
}

async function list() {
  const inv = await db.circleInvitation.findMany({
    where: { id: { startsWith: "test_p4_2_" } },
    select: { id: true, status: true, expiresAt: true, invitedEmailHash: true },
  });
  console.log(JSON.stringify(inv, null, 2));
  await db.$disconnect();
}

if (MODE === "seed") await seed();
else if (MODE === "clean") await clean();
else await list();
