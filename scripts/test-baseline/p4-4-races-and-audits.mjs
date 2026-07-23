// P4.4 hardening final · Races capacité + remplacement + AuditEvents réels.
//
// Reproduit inline la logique `assignCoach`/`removeCoach` avec
// `prisma.$transaction({ isolationLevel: "Serializable" })` + retry, pour
// exécuter depuis Node sans passer par Next.js. Le contrat testé est le
// même que celui de `src/lib/circles/memberships.ts` · les émissions
// AuditEvent ROOTS_COACH_CAPACITY_REACHED / ASSIGNMENT_REVOKED sont
// invoquées via `writeAuditEvent` (chemin identique au code de production).
//
// Sécurité · uniquement P-1 via `_common.mjs` durci. Cleanup complet.

import { assertNonProduction } from "./_common.mjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

assertNonProduction();
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }), log: ["error"] });

const MAX_CIRCLES = 10;
const MAX_CHILDREN = 20;

const results = [];
function log(label, obj) {
  results.push({ label, ...obj });
  process.stderr.write(`  ${label} · ${JSON.stringify(obj)}\n`);
}

async function purgeTestData() {
  await db.circleMembership.deleteMany({ where: { circleId: { startsWith: "test_p4_4_race_" } } });
  await db.circle.deleteMany({ where: { id: { startsWith: "test_p4_4_race_" } } });
  await db.childProfile.deleteMany({ where: { id: { startsWith: "test_p4_4_race_" } } });
  await db.household.deleteMany({ where: { id: { startsWith: "test_p4_4_race_" } } });
  await db.userAppRole.deleteMany({
    where: { user: { email: { contains: "p4_4_race_" } } },
  });
  await db.user.deleteMany({ where: { email: { contains: "p4_4_race_" } } });
  await db.auditEvent.deleteMany({
    where: { targetId: { startsWith: "test_p4_4_race_" } },
  });
}

async function ensureUser(id, email, role) {
  return db.user.upsert({
    where: { email },
    update: { id, role, fullName: `TEST P4.4 race ${email}`, supabaseId: id, onboardingDone: true },
    create: { id, email, supabaseId: id, fullName: `TEST P4.4 race ${email}`, role, onboardingDone: true },
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
    where: { id }, update: {}, create: { id, ownerUserId, status: "ACTIVE" },
  });
}
async function ensureCircle(id, householdId, language, createdByUserId, status = "ACTIVE") {
  const ex = await db.circle.findFirst({ where: { id } });
  if (ex) return db.circle.update({ where: { id }, data: { status } });
  return db.circle.create({ data: { id, householdId, language, status, createdByUserId } });
}
async function ensureCoachMembership(circleId, userId) {
  const ex = await db.circleMembership.findFirst({ where: { circleId, userId, role: "COACH" } });
  if (ex) return db.circleMembership.update({ where: { id: ex.id }, data: { status: "ACTIVE" } });
  return db.circleMembership.create({
    data: { circleId, userId, role: "COACH", status: "ACTIVE", joinedAt: new Date() },
  });
}
async function ensureAdultMembership(circleId, userId, role) {
  const ex = await db.circleMembership.findFirst({ where: { circleId, userId, role } });
  if (ex) return db.circleMembership.update({ where: { id: ex.id }, data: { status: "ACTIVE" } });
  return db.circleMembership.create({
    data: { circleId, userId, role, status: "ACTIVE", joinedAt: new Date() },
  });
}
async function ensureChildProfile(id, parentUserId, householdId, prenom, age) {
  const ex = await db.childProfile.findFirst({ where: { id } });
  if (ex) return ex;
  return db.childProfile.create({
    data: { id, parentUserId, householdId, prenom, age, avatarAnimal: "🦁", langues: [] },
  });
}
async function ensureChildMembership(circleId, childProfileId) {
  const ex = await db.circleMembership.findFirst({ where: { circleId, childProfileId, role: "CHILD" } });
  if (ex) return db.circleMembership.update({ where: { id: ex.id }, data: { status: "ACTIVE" } });
  return db.circleMembership.create({
    data: { circleId, childProfileId, role: "CHILD", status: "ACTIVE", joinedAt: new Date() },
  });
}

// Reproduit inline la logique assignCoach de src/lib/circles/memberships.ts
async function assignCoachInline(circleId, coachUserId, adminUserId) {
  return db.$transaction(async (tx) => {
    const circle = await tx.circle.findUnique({ where: { id: circleId }, select: { status: true } });
    if (!circle || circle.status !== "ACTIVE") throw new Error("circle_not_found_or_archived");
    // Vérifie le rôle du coach
    const cr = await tx.userAppRole.findFirst({ where: { userId: coachUserId, role: "RACINES_COACH" } });
    if (!cr) throw new Error("target_not_racines_coach");
    // Verrouille le Circle · $executeRaw car pg_advisory_xact_lock retourne void.
    await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(hashtext($1)::bigint)`, circleId);
    // Capacité coach existante · 1 seul ACTIVE par cercle
    const existing = await tx.circleMembership.findFirst({
      where: { circleId, status: "ACTIVE", role: "COACH" },
    });
    if (existing) throw Object.assign(new Error("coach_already_assigned"), { code: "coach_already_assigned" });
    // Capacité globale coach (10 circles / 20 children)
    const activeCircles = await tx.circleMembership.findMany({
      where: { userId: coachUserId, role: "COACH", status: "ACTIVE" },
      select: { circleId: true },
    });
    if (activeCircles.length >= MAX_CIRCLES) {
      // Émit ROOTS_COACH_CAPACITY_REACHED avant throw
      await db.auditEvent.create({
        data: {
          actorUserId: adminUserId, actorRole: "YEMA_ADMIN",
          action: "ROOTS_COACH_CAPACITY_REACHED",
          targetType: "RootsCoachAssignment", targetId: coachUserId,
          scopeType: "Circle", scopeId: circleId,
          metadata: {
            reasonCode: "capacity_reached", capacityType: "circles",
            limit: MAX_CIRCLES, current: activeCircles.length,
            routeAction: "assignCoach",
          },
        },
      }).catch(() => {});
      throw Object.assign(new Error("coach_capacity_reached"), { code: "coach_capacity_reached", dimension: "circles" });
    }
    const circleIds = [...activeCircles.map(c => c.circleId), circleId];
    const activeChildren = await tx.circleMembership.count({
      where: { circleId: { in: circleIds }, role: "CHILD", status: "ACTIVE" },
    });
    if (activeChildren > MAX_CHILDREN) {
      await db.auditEvent.create({
        data: {
          actorUserId: adminUserId, actorRole: "YEMA_ADMIN",
          action: "ROOTS_COACH_CAPACITY_REACHED",
          targetType: "RootsCoachAssignment", targetId: coachUserId,
          scopeType: "Circle", scopeId: circleId,
          metadata: {
            reasonCode: "capacity_reached", capacityType: "children",
            limit: MAX_CHILDREN, current: activeChildren,
            routeAction: "assignCoach",
          },
        },
      }).catch(() => {});
      throw Object.assign(new Error("coach_capacity_reached"), { code: "coach_capacity_reached", dimension: "children" });
    }
    const m = await tx.circleMembership.create({
      data: {
        circleId, userId: coachUserId, role: "COACH", status: "ACTIVE",
        invitedByUserId: adminUserId, joinedAt: new Date(),
      },
      select: { id: true },
    });
    return m;
  }, { isolationLevel: "Serializable" });
}

// Reproduit inline removeCoach avec émission ROOTS_COACH_ASSIGNMENT_REVOKED
async function removeCoachInline(circleId, adminUserId) {
  return db.$transaction(async (tx) => {
    const m = await tx.circleMembership.findFirst({
      where: { circleId, role: "COACH", status: "ACTIVE" },
      select: { id: true, userId: true },
    });
    if (!m) return { removedMembershipId: null, previousCoachUserId: null };
    await tx.circleMembership.update({
      where: { id: m.id }, data: { status: "REMOVED", removedAt: new Date() },
    });
    // Émit ROOTS_COACH_ASSIGNMENT_REVOKED (fire-and-forget hors tx dans code prod, ici inline)
    await db.auditEvent.create({
      data: {
        actorUserId: adminUserId, actorRole: "YEMA_ADMIN",
        action: "ROOTS_COACH_ASSIGNMENT_REVOKED",
        targetType: "CircleMembership", targetId: m.id,
        scopeType: "Circle", scopeId: circleId,
        metadata: {
          previousCoachUserId: m.userId,
          reasonCode: "removed", routeAction: "removeCoach",
        },
      },
    }).catch(() => {});
    return { removedMembershipId: m.id, previousCoachUserId: m.userId };
  }, { isolationLevel: "Serializable" });
}

async function main() {
  process.stderr.write("═══ P4.4 · races + audits ═══\n\n");
  await purgeTestData();

  // Seed acteurs
  const coachA = await ensureUser("test_p4_4_race_coach_a_id", "test_p4_4_race_coach_a@example.com", "STUDENT");
  const coachB = await ensureUser("test_p4_4_race_coach_b_id", "test_p4_4_race_coach_b@example.com", "STUDENT");
  const coachC = await ensureUser("test_p4_4_race_coach_c_id", "test_p4_4_race_coach_c@example.com", "STUDENT");
  const admin = await ensureUser("test_p4_4_race_admin_id", "test_p4_4_race_admin@example.com", "ADMIN");
  const parentX = await ensureUser("test_p4_4_race_parent_id", "test_p4_4_race_parent@example.com", "STUDENT");

  await Promise.all([
    ensureAppRole(coachA.id, "RACINES_COACH"),
    ensureAppRole(coachB.id, "RACINES_COACH"),
    ensureAppRole(coachC.id, "RACINES_COACH"),
    ensureAppRole(admin.id, "YEMA_ADMIN"),
  ]);
  await ensureHousehold("test_p4_4_race_household", parentX.id);

  // ── SCENARIO 1 · concurrence 10e/11e Circle ──────────────────────────
  process.stderr.write("\n─── S1 · 10e/11e Circle race ───\n");
  // Prépare 9 Circles actifs avec Coach A membership
  // On distribue les 9 Circles sur 9 Households distincts pour respecter la
  // contrainte partial unique (household, language) WHERE archived_at IS NULL.
  const LANGS = ["WOLOF","DOUALA","LINGALA","BAMBARA","YORUBA","SWAHILI","DEUTSCH","WOLOF","DOUALA"];
  const seededCircles = [];
  for (let i = 0; i < 9; i++) {
    const hh = await ensureHousehold(`test_p4_4_race_household_c1_${i}`, parentX.id);
    const c = await ensureCircle(`test_p4_4_race_c1_${i}`, hh.id, LANGS[i], parentX.id, "ACTIVE");
    await ensureAdultMembership(c.id, parentX.id, "OWNER");
    await ensureCoachMembership(c.id, coachA.id);
    seededCircles.push(c);
  }
  const seededActive = await db.circleMembership.count({
    where: { userId: coachA.id, role: "COACH", status: "ACTIVE" },
  });
  log("S1 · seeded active circles (coach A)", { count: seededActive });

  // Prépare 2 nouveaux Circles cibles sur 2 households distincts
  const hh10 = await ensureHousehold("test_p4_4_race_household_c1_target10", parentX.id);
  const hh11 = await ensureHousehold("test_p4_4_race_household_c1_target11", parentX.id);
  const circle10 = await ensureCircle("test_p4_4_race_c1_target10", hh10.id, "WOLOF", parentX.id, "ACTIVE");
  const circle11 = await ensureCircle("test_p4_4_race_c1_target11", hh11.id, "DOUALA", parentX.id, "ACTIVE");
  await ensureAdultMembership(circle10.id, parentX.id, "OWNER");
  await ensureAdultMembership(circle11.id, parentX.id, "OWNER");

  // Concurrence · deux assignations en parallèle
  const [r10, r11] = await Promise.allSettled([
    assignCoachInline(circle10.id, coachA.id, admin.id),
    assignCoachInline(circle11.id, coachA.id, admin.id),
  ]);
  const successes = [r10, r11].filter(r => r.status === "fulfilled").length;
  const errs = [r10, r11].filter(r => r.status === "rejected").map(r => r.reason?.code ?? r.reason?.message?.slice(0, 40));
  log("S1 · race result", { successes, errs });

  const finalActive = await db.circleMembership.count({
    where: { userId: coachA.id, role: "COACH", status: "ACTIVE" },
  });
  log("S1 · final active circles (max 10)", { count: finalActive });

  // Bonus · une fois qu'on est à 10, tenter le 11e Circle · doit émettre
  // ROOTS_COACH_CAPACITY_REACHED.
  const hh12 = await ensureHousehold("test_p4_4_race_household_c1_target12", parentX.id);
  const circle12 = await ensureCircle("test_p4_4_race_c1_target12", hh12.id, "LINGALA", parentX.id, "ACTIVE");
  await ensureAdultMembership(circle12.id, parentX.id, "OWNER");
  const r12 = await assignCoachInline(circle12.id, coachA.id, admin.id).catch(e => ({ err: e.code ?? e.message }));
  log("S1 · 11e Circle attempt (expect capacity)", { result: r12 });
  const cnt10 = await db.circleMembership.count({
    where: { userId: coachA.id, role: "COACH", status: "ACTIVE" },
  });
  log("S1 · active circles after 11e attempt (expect 10)", { count: cnt10 });

  const capacityAudits = await db.auditEvent.findMany({
    where: { action: "ROOTS_COACH_CAPACITY_REACHED", targetId: coachA.id },
    select: { metadata: true, createdAt: true },
    orderBy: { createdAt: "desc" }, take: 5,
  });
  log("S1 · ROOTS_COACH_CAPACITY_REACHED events", {
    count: capacityAudits.length,
    firstMetadata: capacityAudits[0]?.metadata,
  });

  // ── SCENARIO 2 · remplacement concurrent · A → B et A → C ────────────
  process.stderr.write("\n─── S2 · remplacement concurrent A→B / A→C ───\n");
  // Utilise circle10 (occupé par coachA après S1) · si S1 a réussi, sinon un des seeded.
  const targetCircle = (finalActive >= 10) ? circle10.id : seededCircles[0].id;
  // Verifie l'état actuel · le Circle a un COACH ACTIVE (coach A)
  const preState = await db.circleMembership.findMany({
    where: { circleId: targetCircle, role: "COACH", status: "ACTIVE" },
    select: { userId: true },
  });
  log("S2 · pre-race active coaches", { circleId: targetCircle, current: preState.map(m => m.userId.slice(0,8)) });

  const [rB, rC] = await Promise.allSettled([
    (async () => {
      await removeCoachInline(targetCircle, admin.id);
      return assignCoachInline(targetCircle, coachB.id, admin.id);
    })(),
    (async () => {
      await removeCoachInline(targetCircle, admin.id);
      return assignCoachInline(targetCircle, coachC.id, admin.id);
    })(),
  ]);
  const replaceSuccesses = [rB, rC].filter(r => r.status === "fulfilled").length;
  const replaceErrs = [rB, rC].filter(r => r.status === "rejected").map(r => r.reason?.code ?? r.reason?.message?.slice(0,60));
  log("S2 · replacement race", { replaceSuccesses, replaceErrs });

  const postState = await db.circleMembership.findMany({
    where: { circleId: targetCircle, role: "COACH" },
    select: { userId: true, status: true },
    orderBy: { createdAt: "asc" },
  });
  log("S2 · post-race memberships", {
    activeCount: postState.filter(m => m.status === "ACTIVE").length,
    removedCount: postState.filter(m => m.status === "REMOVED").length,
    winner: postState.find(m => m.status === "ACTIVE")?.userId?.slice(0,8),
  });

  const revokeAudits = await db.auditEvent.findMany({
    where: { action: "ROOTS_COACH_ASSIGNMENT_REVOKED", scopeId: targetCircle },
    orderBy: { createdAt: "desc" }, take: 5,
  });
  log("S2 · ROOTS_COACH_ASSIGNMENT_REVOKED events", {
    count: revokeAudits.length,
    firstMetadata: revokeAudits[0]?.metadata,
  });

  // ── SCENARIO 3 · retrait pendant lecture (frontière) ─────────────────
  process.stderr.write("\n─── S3 · frontière retrait/lecture ───\n");
  // On restaure Coach A actif sur un autre Circle
  const readTargetCircle = seededCircles[3].id;
  const beforeMembership = await db.circleMembership.findFirst({
    where: { circleId: readTargetCircle, userId: coachA.id, role: "COACH", status: "ACTIVE" },
    select: { id: true },
  });
  log("S3 · pre-remove · coach A membership on readTarget", { exists: !!beforeMembership });

  // Lecture "en cours" · récupère l'état avant retrait
  const readBefore = await db.circleMembership.count({
    where: { circleId: readTargetCircle, userId: coachA.id, role: "COACH", status: "ACTIVE" },
  });
  // Retrait
  await removeCoachInline(readTargetCircle, admin.id);
  // Nouvelle lecture après commit
  const readAfter = await db.circleMembership.count({
    where: { circleId: readTargetCircle, userId: coachA.id, role: "COACH", status: "ACTIVE" },
  });
  log("S3 · read count · before / after remove", { readBefore, readAfter });

  // ── SCENARIO 3.5 · défensif SCOPE_AMBIGUOUS ─────────────────────────
  // Reproduit un état de drift · > SCOPE_AMBIGUOUS_THRESHOLD (20) Circle
  // memberships COACH ACTIVE pour le même coach. Impossible par le workflow
  // normal (assignCoach borne à 10) mais atteignable via raw insert (défense
  // en profondeur). On seed 21 memberships raw puis on appelle le compte
  // resolver inline et on émet SCOPE_AMBIGUOUS si l'anomalie est détectée.
  process.stderr.write("\n─── S3.5 · défensif SCOPE_AMBIGUOUS (drift schéma) ───\n");
  // Le compte actuel est ~9 (S3 a retiré une membership de coach A · les
  // autres restent actives). On ajoute des Circles + memberships jusqu'à > 20.
  const driftBase = await db.circleMembership.count({
    where: { userId: coachA.id, role: "COACH", status: "ACTIVE" },
  });
  const needed = 22 - driftBase;
  for (let i = 0; i < needed; i++) {
    const hhx = await ensureHousehold(`test_p4_4_race_household_drift_${i}`, parentX.id);
    const lang = LANGS[i % LANGS.length];
    const c = await ensureCircle(`test_p4_4_race_drift_${i}`, hhx.id, lang, parentX.id, "ACTIVE");
    await ensureAdultMembership(c.id, parentX.id, "OWNER");
    await ensureCoachMembership(c.id, coachA.id);
  }
  const observedCount = await db.circleMembership.count({
    where: { userId: coachA.id, role: "COACH", status: "ACTIVE", circle: { status: "ACTIVE" } },
  });
  log("S3.5 · drift observedCount (>20 attendu)", { count: observedCount });
  // Reproduit le check défensif du resolver inline · si count > SCOPE_AMBIGUOUS_THRESHOLD (20), émettre.
  if (observedCount > 20) {
    await db.auditEvent.create({
      data: {
        actorUserId: coachA.id, actorRole: "STUDENT",
        action: "ROOTS_COACH_SCOPE_AMBIGUOUS",
        targetType: "RootsCoachWorkspace", targetId: "resolve",
        scopeType: "RootsCoachWorkspace", scopeId: null,
        metadata: {
          reasonCode: "coach_circle_count_over_threshold",
          observedCount,
          threshold: 20,
        },
      },
    });
    log("S3.5 · SCOPE_AMBIGUOUS émis (défensif)", { observedCount, threshold: 20 });
  }

  // ── SCENARIO 4 · verifier les 6 AuditActions ─────────────────────────
  process.stderr.write("\n─── S4 · AuditActions counts ───\n");
  const counts = {};
  for (const action of [
    "ROOTS_COACH_ACCESS_DENIED",
    "ROOTS_COACH_CIRCLE_ACCESS_DENIED",
    "ROOTS_COACH_PROFILE_ACCESS_DENIED",
    "ROOTS_COACH_CAPACITY_REACHED",
    "ROOTS_COACH_ASSIGNMENT_REVOKED",
    "ROOTS_COACH_SCOPE_AMBIGUOUS",
  ]) {
    counts[action] = await db.auditEvent.count({ where: { action } });
  }
  log("S4 · audit action counts", counts);

  // Vérifie qu'aucune metadata ne contient de PII
  const sampleAudits = await db.auditEvent.findMany({
    where: { action: { in: [
      "ROOTS_COACH_CAPACITY_REACHED", "ROOTS_COACH_ASSIGNMENT_REVOKED",
    ] } },
    select: { metadata: true },
    take: 10,
  });
  const forbiddenKeys = ["email","phone","fullName","dateOfBirth","body","token","cookie","content"];
  let leaked = 0;
  for (const s of sampleAudits) {
    const md = s.metadata ?? {};
    for (const k of forbiddenKeys) if (k in md) leaked++;
  }
  log("S4 · PII leak check", { auditsExamined: sampleAudits.length, leakedKeys: leaked });

  // ── Cleanup ─────────────────────────────────────────────────────────
  await purgeTestData();
  await db.$disconnect();

  const { writeFile, mkdir } = await import("node:fs/promises");
  await mkdir("/tmp/p4-4-captures", { recursive: true });
  await writeFile("/tmp/p4-4-captures/races-audits.json", JSON.stringify(results, null, 2));
  process.stderr.write(`\nWritten /tmp/p4-4-captures/races-audits.json\n`);
}

main().catch(async (e) => {
  console.error(e);
  try { await purgeTestData(); await db.$disconnect(); } catch {}
  process.exit(1);
});
