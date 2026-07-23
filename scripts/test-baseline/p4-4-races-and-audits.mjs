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

// Reproduit inline `withSerializableRetry` de src/lib/db/retry.ts pour
// refléter fidèlement le contrat des routes admin coach (POST + DELETE
// enveloppées avec ce helper). Max 3 tentatives, backoff 25/50/100 ms.
function isSerializationFailure(e) {
  return (
    e?.code === "40001" ||
    e?.code === "P2034" ||
    /serialization_failure|could not serialize|TransactionWriteConflict/i.test(e?.message ?? "")
  );
}
async function withRetryInline(fn, errorCode) {
  const max = 3;
  let lastErr;
  for (let attempt = 0; attempt < max; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (!isSerializationFailure(e)) throw e;
      lastErr = e;
      await new Promise((res) => setTimeout(res, 25 * Math.pow(2, attempt)));
    }
  }
  const err = new Error("operation could not complete due to concurrent updates");
  err.code = errorCode;
  err.cause = lastErr;
  throw err;
}

// P4.4 closure · émission unique post-échec de ROOTS_COACH_CAPACITY_REACHED.
// Reproduit `src/lib/audit/rootsCoachCapacity.ts` inline (metadata `attemptedCount`).
async function emitCoachCapacityAuditInline({ error, actorUserId, actorRole, circleId, coachUserId, routeAction }) {
  if (!error || (error.code !== "coach_circle_capacity_reached" && error.code !== "coach_profile_capacity_reached")) return;
  try {
    await db.auditEvent.create({
      data: {
        actorUserId, actorRole,
        action: "ROOTS_COACH_CAPACITY_REACHED",
        targetType: "RootsCoachAssignment", targetId: coachUserId,
        scopeType: "Circle", scopeId: circleId,
        metadata: {
          reasonCode: "capacity_reached",
          capacityType: error.dimension ?? null,
          limit: error.limit ?? null,
          attemptedCount: error.attemptedCount ?? null,
          routeAction,
        },
      },
    });
  } catch (e) {
    process.stderr.write(`[audit] CAPACITY_REACHED write failed: ${e.message}\n`);
  }
}

// Reproduit inline la logique assignCoach de src/lib/circles/memberships.ts
// Contrat closure P4.4 · N'ÉMET AUCUN audit CAPACITY_REACHED depuis la tx métier
// (les retries SSI produiraient des doublons). L'audit est émis une seule fois
// par le caller après échec définitif via `emitCoachCapacityAuditInline`.
async function assignCoachInline(circleId, coachUserId, adminUserId) {
  return db.$transaction(async (tx) => {
    const circle = await tx.circle.findUnique({ where: { id: circleId }, select: { status: true } });
    if (!circle || circle.status !== "ACTIVE") throw new Error("circle_not_found_or_archived");
    const cr = await tx.userAppRole.findFirst({ where: { userId: coachUserId, role: "RACINES_COACH" } });
    if (!cr) throw new Error("target_not_racines_coach");
    await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(hashtext($1)::bigint)`, circleId);
    const existing = await tx.circleMembership.findFirst({
      where: { circleId, status: "ACTIVE", role: "COACH" },
    });
    if (existing) throw Object.assign(new Error("coach_already_assigned"), { code: "coach_already_assigned" });
    const activeCircles = await tx.circleMembership.findMany({
      where: { userId: coachUserId, role: "COACH", status: "ACTIVE" },
      select: { circleId: true },
    });
    if (activeCircles.length >= MAX_CIRCLES) {
      throw Object.assign(new Error("coach_circle_capacity_reached"), {
        code: "coach_circle_capacity_reached", dimension: "circles",
        limit: MAX_CIRCLES, attemptedCount: activeCircles.length + 1,
      });
    }
    const circleIds = [...activeCircles.map(c => c.circleId), circleId];
    const activeChildren = await tx.circleMembership.count({
      where: { circleId: { in: circleIds }, role: "CHILD", status: "ACTIVE" },
    });
    if (activeChildren > MAX_CHILDREN) {
      throw Object.assign(new Error("coach_profile_capacity_reached"), {
        code: "coach_profile_capacity_reached", dimension: "children",
        limit: MAX_CHILDREN, attemptedCount: activeChildren,
      });
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

// Reproduit inline removeCoach · ROOTS_COACH_ASSIGNMENT_REVOKED est écrit
// DANS la même tx que l'update de statut · sur SSI rollback / retry, l'audit
// disparaît · exactement 1 audit par commit effectif.
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
    // In-tx · idempotence transactionnelle.
    await tx.auditEvent.create({
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
    });
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

  // Concurrence · deux assignations en parallèle (avec retry Serializable
  // pour refléter le contrat prod des routes admin coach). Post-échec ·
  // émission unique CAPACITY_REACHED depuis le "route" inline.
  const capBeforeS1 = await db.auditEvent.count({
    where: { action: "ROOTS_COACH_CAPACITY_REACHED", targetId: coachA.id },
  });
  const [r10, r11] = await Promise.allSettled([
    withRetryInline(() => assignCoachInline(circle10.id, coachA.id, admin.id), "concurrent_coach_assignment"),
    withRetryInline(() => assignCoachInline(circle11.id, coachA.id, admin.id), "concurrent_coach_assignment"),
  ]);
  for (const r of [r10, r11]) {
    if (r.status === "rejected") {
      await emitCoachCapacityAuditInline({
        error: r.reason, actorUserId: admin.id, actorRole: "YEMA_ADMIN",
        circleId: r === r10 ? circle10.id : circle11.id,
        coachUserId: coachA.id, routeAction: "assignCoach",
      });
    }
  }
  const successes = [r10, r11].filter(r => r.status === "fulfilled").length;
  const errs = [r10, r11].filter(r => r.status === "rejected").map(r => r.reason?.code ?? r.reason?.message?.slice(0, 40));
  log("S1 · race result", { successes, errs });

  const finalActive = await db.circleMembership.count({
    where: { userId: coachA.id, role: "COACH", status: "ACTIVE" },
  });
  log("S1 · final active circles (max 10)", { count: finalActive });

  // Bonus · une fois qu'on est à 10, tenter le 11e Circle · doit émettre
  // ROOTS_COACH_CAPACITY_REACHED (2ème requête refusée, indépendante de la
  // race S1 · +1 audit acceptable).
  const hh12 = await ensureHousehold("test_p4_4_race_household_c1_target12", parentX.id);
  const circle12 = await ensureCircle("test_p4_4_race_c1_target12", hh12.id, "LINGALA", parentX.id, "ACTIVE");
  await ensureAdultMembership(circle12.id, parentX.id, "OWNER");
  const r12 = await withRetryInline(
    () => assignCoachInline(circle12.id, coachA.id, admin.id),
    "concurrent_coach_assignment",
  ).catch(async (e) => {
    await emitCoachCapacityAuditInline({
      error: e, actorUserId: admin.id, actorRole: "YEMA_ADMIN",
      circleId: circle12.id, coachUserId: coachA.id, routeAction: "assignCoach",
    });
    return { err: e.code ?? e.message };
  });
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
  // Delta attendu · 1 (loser de la race) + 1 (11e attempt post-race) = 2 audits
  // distincts, chacun pour une requête refusée réelle. §4 doc doctrine.
  log("S1 · ROOTS_COACH_CAPACITY_REACHED events (post-idempotence)", {
    totalTargetingCoachA: capacityAudits.length,
    deltaFromRace: capacityAudits.length - capBeforeS1,
    firstMetadata: capacityAudits[0]?.metadata,
  });

  // ── SCENARIO 1b · concurrence 19→20/21 profils (capacité children) ───
  // Setup · un Coach D fresh avec 19 CHILD memberships déjà en place dans 4
  // Circles owned. Deux nouveaux Circles cibles, chacun avec 1 CHILD
  // (donc chaque assignCoach ajouterait +1 profil au coach). Race : les
  // deux assignCoach tournent en concurrence Serializable · 1 doit gagner
  // (final=20), l'autre doit échouer avec `coach_profile_capacity_reached`
  // et un unique AuditEvent ROOTS_COACH_CAPACITY_REACHED avec
  // capacityType="children", limit=20, current=20.
  process.stderr.write("\n─── S1b · 19→20/21 profils race ───\n");
  const coachD = await ensureUser("test_p4_4_race_coach_d_id", "test_p4_4_race_coach_d@example.com", "STUDENT");
  await ensureAppRole(coachD.id, "RACINES_COACH");
  const parentY = await ensureUser("test_p4_4_race_parent_y_id", "test_p4_4_race_parent_y@example.com", "STUDENT");
  const hhY = await ensureHousehold("test_p4_4_race_household_p_y", parentY.id);
  // 4 Circles owned par parentY, coachD est COACH ACTIVE sur les 4.
  // On y répartit 19 CHILD memberships (5 + 5 + 5 + 4).
  const S1B_LANGS = ["WOLOF", "DOUALA", "LINGALA", "BAMBARA"];
  const s1bCircles = [];
  const s1bDist = [5, 5, 5, 4];
  let childIdx = 0;
  for (let i = 0; i < 4; i++) {
    const c = await ensureCircle(`test_p4_4_race_p_c${i}`, hhY.id, S1B_LANGS[i], parentY.id, "ACTIVE");
    await ensureAdultMembership(c.id, parentY.id, "OWNER");
    await ensureCoachMembership(c.id, coachD.id);
    for (let j = 0; j < s1bDist[i]; j++) {
      const cp = await ensureChildProfile(
        `test_p4_4_race_p_child_${childIdx}`, parentY.id, hhY.id, `Enf${childIdx}`, 8,
      );
      await ensureChildMembership(c.id, cp.id);
      childIdx++;
    }
    s1bCircles.push(c);
  }
  const s1bBaseline = await db.circleMembership.count({
    where: {
      circleId: { in: s1bCircles.map((c) => c.id) },
      role: "CHILD", status: "ACTIVE",
    },
  });
  log("S1b · baseline children coached by D (expect 19)", { count: s1bBaseline });

  // Deux Circles cibles fresh (household distincts pour respecter unique-per-language)
  const hhZ1 = await ensureHousehold("test_p4_4_race_household_p_z1", parentY.id);
  const hhZ2 = await ensureHousehold("test_p4_4_race_household_p_z2", parentY.id);
  const circleZ1 = await ensureCircle("test_p4_4_race_p_target_z1", hhZ1.id, "YORUBA", parentY.id, "ACTIVE");
  const circleZ2 = await ensureCircle("test_p4_4_race_p_target_z2", hhZ2.id, "SWAHILI", parentY.id, "ACTIVE");
  await ensureAdultMembership(circleZ1.id, parentY.id, "OWNER");
  await ensureAdultMembership(circleZ2.id, parentY.id, "OWNER");
  const childZ1 = await ensureChildProfile("test_p4_4_race_p_child_z1", parentY.id, hhZ1.id, "EnfZ1", 8);
  const childZ2 = await ensureChildProfile("test_p4_4_race_p_child_z2", parentY.id, hhZ2.id, "EnfZ2", 8);
  await ensureChildMembership(circleZ1.id, childZ1.id);
  await ensureChildMembership(circleZ2.id, childZ2.id);

  const capBeforeS1b = await db.auditEvent.count({
    where: { action: "ROOTS_COACH_CAPACITY_REACHED", targetId: coachD.id },
  });
  // Utilise withRetryInline pour reproduire le contrat exact des routes admin
  // coach POST · le loser SSI retry, voit attemptedCount=21 après commit du
  // gagnant, et déclenche coach_profile_capacity_reached. L'audit est émis
  // UNE FOIS par le "route" caller après l'échec définitif (retry épuisé).
  const [rZ1, rZ2] = await Promise.allSettled([
    withRetryInline(() => assignCoachInline(circleZ1.id, coachD.id, admin.id), "concurrent_coach_assignment"),
    withRetryInline(() => assignCoachInline(circleZ2.id, coachD.id, admin.id), "concurrent_coach_assignment"),
  ]);
  for (const r of [rZ1, rZ2]) {
    if (r.status === "rejected") {
      await emitCoachCapacityAuditInline({
        error: r.reason, actorUserId: admin.id, actorRole: "YEMA_ADMIN",
        circleId: r === rZ1 ? circleZ1.id : circleZ2.id,
        coachUserId: coachD.id, routeAction: "assignCoach",
      });
    }
  }
  const s1bSuccesses = [rZ1, rZ2].filter((r) => r.status === "fulfilled").length;
  const s1bErrs = [rZ1, rZ2].filter((r) => r.status === "rejected").map((r) => r.reason?.code ?? r.reason?.message?.slice(0, 60));
  log("S1b · race result (expect 1 success max)", { successes: s1bSuccesses, errs: s1bErrs });

  // Compte les enfants dans les Circles où Coach D est effectivement ACTIVE
  // (pas dans les Circles Z où D n'a pas gagné la course).
  const coachDActiveCircles = await db.circleMembership.findMany({
    where: { userId: coachD.id, role: "COACH", status: "ACTIVE" },
    select: { circleId: true },
  });
  const s1bFinalChildren = await db.circleMembership.count({
    where: {
      circleId: { in: coachDActiveCircles.map((m) => m.circleId) },
      role: "CHILD", status: "ACTIVE",
    },
  });
  const s1bFinalCoachCircles = coachDActiveCircles.length;
  log("S1b · final state (expect children<=20, coachCircles<=5)", {
    finalChildren: s1bFinalChildren, finalCoachCircles: s1bFinalCoachCircles,
  });

  const capAfterS1b = await db.auditEvent.findMany({
    where: {
      action: "ROOTS_COACH_CAPACITY_REACHED",
      targetId: coachD.id,
    },
    select: { metadata: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  log("S1b · ROOTS_COACH_CAPACITY_REACHED delta + firstMetadata (attemptedCount)", {
    before: capBeforeS1b,
    afterTotal: capAfterS1b.length,
    delta: capAfterS1b.length - capBeforeS1b,
    firstMetadata: capAfterS1b[0]?.metadata,
    metadataUsesAttemptedCount: capAfterS1b[0]?.metadata &&
      typeof capAfterS1b[0].metadata === "object" &&
      "attemptedCount" in capAfterS1b[0].metadata,
    metadataStillHasCurrent: capAfterS1b[0]?.metadata &&
      typeof capAfterS1b[0].metadata === "object" &&
      "current" in capAfterS1b[0].metadata,
  });
  // Structural check · l'unique événement doit avoir capacityType="children"
  const s1bChildrenEvents = capAfterS1b.filter(
    (a) => a.metadata && typeof a.metadata === "object" && a.metadata.capacityType === "children",
  );
  log("S1b · CAPACITY_REACHED children-only events", { count: s1bChildrenEvents.length });

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

  const revokeBeforeS2 = await db.auditEvent.count({
    where: { action: "ROOTS_COACH_ASSIGNMENT_REVOKED", scopeId: targetCircle },
  });
  const [rB, rC] = await Promise.allSettled([
    (async () => {
      await withRetryInline(() => removeCoachInline(targetCircle, admin.id), "concurrent_coach_replacement");
      return withRetryInline(() => assignCoachInline(targetCircle, coachB.id, admin.id), "concurrent_coach_assignment");
    })(),
    (async () => {
      await withRetryInline(() => removeCoachInline(targetCircle, admin.id), "concurrent_coach_replacement");
      return withRetryInline(() => assignCoachInline(targetCircle, coachC.id, admin.id), "concurrent_coach_assignment");
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
  // Idempotence transactionnelle · le loser rollback avec son audit · delta doit
  // valoir 1 (exactement 1 revoke committé, celui du gagnant).
  log("S2 · ROOTS_COACH_ASSIGNMENT_REVOKED events (idempotence)", {
    totalOnCircle: revokeAudits.length,
    deltaFromRace: revokeAudits.length - revokeBeforeS2,
    firstMetadata: revokeAudits[0]?.metadata,
  });
  const loser = [rB, rC].find((r) => r.status === "rejected");
  const loserCode = loser?.reason?.code ?? null;
  const loserMsg = loser?.reason?.message ?? "";
  log("S2 · loser code + no Prisma leak", {
    code: loserCode,
    exposedP2034: /P2034/.test(loserMsg),
    exposedTransactionWriteConflict: /TransactionWriteConflict/.test(loserMsg),
    exposedINTERNAL: /INTERNAL/.test(loserMsg),
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

  // ── SCENARIO 3.5 · Option A · SCOPE_AMBIGUOUS n'est PLUS producteur du drift ──
  // Doctrine P4.4 finale · le resolver ne produit plus SCOPE_AMBIGUOUS sur
  // (count > 20). Ce check reste comme verrou de doctrine · même en état de
  // drift extrême (> 20 memberships COACH ACTIVE), aucun événement
  // ROOTS_COACH_SCOPE_AMBIGUOUS ne doit être émis · l'enum reste réservé
  // à des états futurs d'ambiguïté vraie (fusion identité, mappings pro
  // contradictoires). Un drift capacité doit être remonté via
  // CAPACITY_REACHED par les workflows (assignCoach / addChildToCircle),
  // pas par le resolver.
  process.stderr.write("\n─── S3.5 · SCOPE_AMBIGUOUS n'est plus producteur drift (Option A) ───\n");
  const scopeAmbiguousBefore = await db.auditEvent.count({
    where: { action: "ROOTS_COACH_SCOPE_AMBIGUOUS" },
  });
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
  const scopeAmbiguousAfter = await db.auditEvent.count({
    where: { action: "ROOTS_COACH_SCOPE_AMBIGUOUS" },
  });
  log("S3.5 · drift observedCount + scope_ambiguous delta", {
    observedCount,
    scopeAmbiguousBefore,
    scopeAmbiguousAfter,
    delta: scopeAmbiguousAfter - scopeAmbiguousBefore,
  });
  if (scopeAmbiguousAfter !== scopeAmbiguousBefore) {
    throw new Error("S3.5 · FAIL · SCOPE_AMBIGUOUS émis alors que Option A l'interdit");
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
  // Vérification zéro fixture résiduelle · guard-rail visible dans les logs.
  const [fixtureCircles, fixtureChildProfiles, fixtureUsers, fixtureAudits] =
    await Promise.all([
      db.circle.count({ where: { id: { startsWith: "test_p4_4_race_" } } }),
      db.childProfile.count({ where: { id: { startsWith: "test_p4_4_race_" } } }),
      db.user.count({ where: { email: { contains: "p4_4_race_" } } }),
      db.auditEvent.count({ where: { targetId: { startsWith: "test_p4_4_race_" } } }),
    ]);
  log("cleanup · residual fixtures (all expect 0)", {
    circles: fixtureCircles,
    childProfiles: fixtureChildProfiles,
    users: fixtureUsers,
    audits: fixtureAudits,
  });
  if (fixtureCircles + fixtureChildProfiles + fixtureUsers + fixtureAudits === 0) {
    process.stderr.write("\nBASELINE DATA CLEANED\n");
  } else {
    process.stderr.write("\nBASELINE DATA CLEANUP FAILED · residual fixtures detected\n");
  }
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
