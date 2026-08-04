// P4.5-A closure · harness immutabilité + quotas concurrents + RLS SELECT.
//
// Sécurité · uniquement P-1 via `assertNonProduction`. Cleanup complet
// à la fin, `BASELINE DATA CLEANED` marker en sortie.
//
// Cible testée ·
//   1. Trigger immutability feedback PUBLISHED · refuse UPDATE body/audio/version
//   2. Trigger immutability submission SUBMITTED · refuse UPDATE writtenContent
//   3. Addendum · nouvelle ligne, original inchangé byte-for-byte
//   4. Race hebdo · 1 → 2/3 productions planifiées, code stable
//   5. Race mensuel · 7 → 8/9 productions planifiées, code stable
//   6. RLS SELECT cross-tenant · Teacher B ne voit pas assignment de Teacher A
//   7. RLS SELECT cross-tenant · Coach B ne voit pas circle_assignments de Coach A
//   8. RLS SELECT cross-tenant · parent B ne voit pas child A production

import { assertNonProduction } from "./_common.mjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Inline copy · miroir de src/lib/capacity/racinesProduction.ts pour tourner
// depuis Node/mjs sans compilation TS. Doit rester en phase avec le TS
// source · les tests vitest le vérifient au niveau contrat.
const MAX_ROOTS_PRODUCTIONS_PER_WEEK = 2;
const MAX_ROOTS_PRODUCTIONS_PER_MONTH = 8;

function isoWeekBoundsUtc(at) {
  const d = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()));
  const day = d.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;
  const start = new Date(d);
  start.setUTCDate(d.getUTCDate() - daysSinceMonday);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);
  return { start, end };
}
function utcMonthBounds(at) {
  const start = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), 1));
  const end = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth() + 1, 1));
  return { start, end };
}
async function countPlannedProductionsForChild(tx, childProfileId, from, to) {
  const memberships = await tx.circleMembership.findMany({
    where: { childProfileId, role: "CHILD", status: "ACTIVE" },
    select: { circleId: true },
  });
  const circleIds = memberships.map((m) => m.circleId);
  if (circleIds.length === 0) return 0;
  const assignments = await tx.circleAssignment.findMany({
    where: {
      circleId: { in: circleIds }, status: "PUBLISHED",
      publishedAt: { gte: from, lt: to },
    },
    select: { id: true, targets: { select: { childProfileId: true } } },
  });
  let count = 0;
  for (const a of assignments) {
    if (a.targets.length === 0) count += 1;
    else if (a.targets.some((t) => t.childProfileId === childProfileId)) count += 1;
  }
  return count;
}
async function assertRootsAssignmentWeeklyCapacity(tx, input) {
  const at = input.at ?? new Date();
  const { start, end } = isoWeekBoundsUtc(at);
  const current = await countPlannedProductionsForChild(tx, input.childProfileId, start, end);
  if (current >= MAX_ROOTS_PRODUCTIONS_PER_WEEK) {
    const err = new Error("weekly production limit reached");
    err.code = "roots_weekly_production_limit_reached";
    err.detail = { dimension: "weekly", limit: MAX_ROOTS_PRODUCTIONS_PER_WEEK, attemptedCount: current + 1 };
    throw err;
  }
}
function isSerializationFailure(e) {
  return e?.code === "40001" || e?.code === "P2034"
    || /serialization_failure|could not serialize|TransactionWriteConflict/i.test(e?.message ?? "");
}
async function withRetryInline(fn, errorCode) {
  const max = 3;
  let lastErr;
  for (let attempt = 0; attempt < max; attempt++) {
    try { return await fn(); }
    catch (e) {
      if (!isSerializationFailure(e)) throw e;
      lastErr = e;
      await new Promise((res) => setTimeout(res, 25 * Math.pow(2, attempt)));
    }
  }
  const err = new Error("operation could not complete due to concurrent updates");
  err.code = errorCode; err.cause = lastErr;
  throw err;
}

async function assertRootsAssignmentMonthlyCapacity(tx, input) {
  const at = input.at ?? new Date();
  const { start, end } = utcMonthBounds(at);
  const current = await countPlannedProductionsForChild(tx, input.childProfileId, start, end);
  if (current >= MAX_ROOTS_PRODUCTIONS_PER_MONTH) {
    const err = new Error("monthly production limit reached");
    err.code = "roots_monthly_production_limit_reached";
    err.detail = { dimension: "monthly", limit: MAX_ROOTS_PRODUCTIONS_PER_MONTH, attemptedCount: current + 1 };
    throw err;
  }
}

assertNonProduction();
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
  log: ["error"],
});

const results = [];
function log(label, obj) {
  results.push({ label, ...obj });
  process.stderr.write(`  ${label} · ${JSON.stringify(obj)}\n`);
}

async function purgeTestData() {
  await db.circleFeedback.deleteMany({ where: { id: { startsWith: "test_p4_5_" } } });
  await db.circleSubmissionReply.deleteMany({ where: { id: { startsWith: "test_p4_5_" } } });
  await db.circleSubmission.deleteMany({ where: { id: { startsWith: "test_p4_5_" } } });
  await db.circleAssignmentTarget.deleteMany({ where: { id: { startsWith: "test_p4_5_" } } });
  await db.circleAssignment.deleteMany({ where: { id: { startsWith: "test_p4_5_" } } });
  await db.assignmentFeedback.deleteMany({ where: { id: { startsWith: "test_p4_5_" } } });
  await db.assignmentSubmission.deleteMany({ where: { id: { startsWith: "test_p4_5_" } } });
  await db.assignment.deleteMany({ where: { id: { startsWith: "test_p4_5_" } } });
  await db.classroomEnrollment.deleteMany({ where: { classroomId: { startsWith: "test_p4_5_" } } });
  await db.classroom.deleteMany({ where: { id: { startsWith: "test_p4_5_" } } });
  await db.circleMembership.deleteMany({ where: { circleId: { startsWith: "test_p4_5_" } } });
  await db.circle.deleteMany({ where: { id: { startsWith: "test_p4_5_" } } });
  await db.childProfile.deleteMany({ where: { id: { startsWith: "test_p4_5_" } } });
  await db.household.deleteMany({ where: { id: { startsWith: "test_p4_5_" } } });
  await db.teacher.deleteMany({ where: { id: { startsWith: "test_p4_5_" } } });
  await db.userAppRole.deleteMany({ where: { user: { email: { contains: "p4_5_" } } } });
  await db.user.deleteMany({ where: { email: { contains: "p4_5_" } } });
  await db.auditEvent.deleteMany({ where: { targetId: { startsWith: "test_p4_5_" } } });
}

async function ensureUser(id, email) {
  return db.user.upsert({
    where: { email },
    update: { id, supabaseId: id, fullName: `TEST P4.5 ${email}`, onboardingDone: true },
    create: { id, email, supabaseId: id, fullName: `TEST P4.5 ${email}`, role: "STUDENT", onboardingDone: true },
  });
}

async function ensureTeacher(id, userId) {
  return db.teacher.upsert({
    where: { id }, update: {}, create: { id, userId },
  });
}

async function ensureClassroom(id, teacherId) {
  return db.classroom.upsert({
    where: { id },
    update: {},
    create: { id, name: `TEST P4.5 Classroom ${id}`, teacherId, level: "A1", code: `TP4-5-${id.slice(-6)}` },
  });
}

async function ensureChildProfile(id, parentUserId, householdId, prenom) {
  const ex = await db.childProfile.findFirst({ where: { id } });
  if (ex) return ex;
  return db.childProfile.create({
    data: { id, parentUserId, householdId, prenom, age: 8, avatarAnimal: "🦁", langues: [] },
  });
}

async function ensureHousehold(id, ownerUserId) {
  return db.household.upsert({
    where: { id }, update: {}, create: { id, ownerUserId, status: "ACTIVE" },
  });
}

async function ensureCircle(id, householdId, language, createdByUserId) {
  const ex = await db.circle.findFirst({ where: { id } });
  if (ex) return ex;
  return db.circle.create({
    data: { id, householdId, language, status: "ACTIVE", createdByUserId },
  });
}

async function main() {
  process.stderr.write("═══ P4.5-A · foundations closure ═══\n\n");
  await purgeTestData();

  // ── Fixtures acteurs ────────────────────────────────────────────────
  const teacherAUser = await ensureUser("test_p4_5_teacher_a_user", "test_p4_5_teacher_a@example.com");
  const teacherBUser = await ensureUser("test_p4_5_teacher_b_user", "test_p4_5_teacher_b@example.com");
  const studentAUser = await ensureUser("test_p4_5_student_a_user", "test_p4_5_student_a@example.com");
  const studentBUser = await ensureUser("test_p4_5_student_b_user", "test_p4_5_student_b@example.com");
  const coachAUser = await ensureUser("test_p4_5_coach_a_user", "test_p4_5_coach_a@example.com");
  const coachBUser = await ensureUser("test_p4_5_coach_b_user", "test_p4_5_coach_b@example.com");
  const parentAUser = await ensureUser("test_p4_5_parent_a_user", "test_p4_5_parent_a@example.com");
  const parentBUser = await ensureUser("test_p4_5_parent_b_user", "test_p4_5_parent_b@example.com");

  const teacherA = await ensureTeacher("test_p4_5_teacher_a", teacherAUser.id);
  const teacherB = await ensureTeacher("test_p4_5_teacher_b", teacherBUser.id);
  const classroomA = await ensureClassroom("test_p4_5_classroom_a", teacherA.id);
  const classroomB = await ensureClassroom("test_p4_5_classroom_b", teacherB.id);
  await db.classroomEnrollment.upsert({
    where: { classroomId_userId: { classroomId: classroomA.id, userId: studentAUser.id } },
    update: { isActive: true },
    create: { classroomId: classroomA.id, userId: studentAUser.id, isActive: true },
  });
  await db.classroomEnrollment.upsert({
    where: { classroomId_userId: { classroomId: classroomB.id, userId: studentBUser.id } },
    update: { isActive: true },
    create: { classroomId: classroomB.id, userId: studentBUser.id, isActive: true },
  });

  const householdA = await ensureHousehold("test_p4_5_household_a", parentAUser.id);
  const householdB = await ensureHousehold("test_p4_5_household_b", parentBUser.id);
  const circleA = await ensureCircle("test_p4_5_circle_a", householdA.id, "WOLOF", parentAUser.id);
  const circleB = await ensureCircle("test_p4_5_circle_b", householdB.id, "DOUALA", parentBUser.id);
  await db.userAppRole.upsert({
    where: { userId_role: { userId: coachAUser.id, role: "RACINES_COACH" } },
    update: {}, create: { userId: coachAUser.id, role: "RACINES_COACH" },
  });
  await db.userAppRole.upsert({
    where: { userId_role: { userId: coachBUser.id, role: "RACINES_COACH" } },
    update: {}, create: { userId: coachBUser.id, role: "RACINES_COACH" },
  });
  await db.circleMembership.create({
    data: { circleId: circleA.id, userId: coachAUser.id, role: "COACH", status: "ACTIVE", joinedAt: new Date() },
  });
  await db.circleMembership.create({
    data: { circleId: circleB.id, userId: coachBUser.id, role: "COACH", status: "ACTIVE", joinedAt: new Date() },
  });
  const childA = await ensureChildProfile("test_p4_5_child_a", parentAUser.id, householdA.id, "EnfA");
  const childB = await ensureChildProfile("test_p4_5_child_b", parentBUser.id, householdB.id, "EnfB");
  await db.circleMembership.create({
    data: { circleId: circleA.id, childProfileId: childA.id, role: "CHILD", status: "ACTIVE", joinedAt: new Date() },
  });
  await db.circleMembership.create({
    data: { circleId: circleB.id, childProfileId: childB.id, role: "CHILD", status: "ACTIVE", joinedAt: new Date() },
  });

  // ── §4 · immutabilité submission SUBMITTED ─────────────────────────
  process.stderr.write("\n─── §4 · immutabilité submission SUBMITTED ───\n");
  const asmA = await db.assignment.create({
    data: {
      id: "test_p4_5_asm_immut", classroomId: classroomA.id,
      title: "TP immutabilité", type: "WRITTEN", status: "PUBLISHED",
      publishedAt: new Date(), createdByTeacherId: teacherA.id,
    },
  });
  const subA = await db.assignmentSubmission.create({
    data: {
      id: "test_p4_5_sub_immut", assignmentId: asmA.id, userId: studentAUser.id,
      writtenContent: "contenu original", status: "SUBMITTED", version: 1,
      submittedAt: new Date(),
    },
  });
  let subImmutErr = null;
  try {
    await db.assignmentSubmission.update({
      where: { id: subA.id }, data: { writtenContent: "TAMPERED" },
    });
  } catch (e) { subImmutErr = e.message.slice(0, 100); }
  log("§4 · UPDATE writtenContent SUBMITTED refused", { refused: !!subImmutErr, sample: subImmutErr });

  let subVersionErr = null;
  try {
    await db.assignmentSubmission.update({
      where: { id: subA.id }, data: { version: 999 },
    });
  } catch (e) { subVersionErr = e.message.slice(0, 100); }
  log("§4 · UPDATE version SUBMITTED refused", { refused: !!subVersionErr });

  // Transition SUBMITTED → WITHDRAWN autorisée (sans mutation contenu).
  const wdRes = await db.assignmentSubmission.update({
    where: { id: subA.id }, data: { status: "WITHDRAWN", withdrawnAt: new Date() },
  }).catch((e) => ({ err: e.message.slice(0, 80) }));
  log("§4 · transition SUBMITTED → WITHDRAWN allowed", { status: wdRes?.status ?? wdRes?.err });

  // ── §4 · immutabilité circle_submissions SUBMITTED ─────────────────
  process.stderr.write("\n─── §4 · immutabilité circle_submissions ───\n");
  const cAsm = await db.circleAssignment.create({
    data: {
      id: "test_p4_5_c_asm_immut", circleId: circleA.id,
      createdByCoachUserId: coachAUser.id,
      title: "Activité immutabilité", productionType: "WRITTEN",
      status: "PUBLISHED", publishedAt: new Date(),
    },
  });
  const cSub = await db.circleSubmission.create({
    data: {
      id: "test_p4_5_c_sub_immut", assignmentId: cAsm.id,
      childProfileId: childA.id, submittedByUserId: parentAUser.id,
      writtenContent: "original enfant A", status: "SUBMITTED",
      version: 1, submittedAt: new Date(),
    },
  });
  let cSubImmutErr = null;
  try {
    await db.circleSubmission.update({
      where: { id: cSub.id }, data: { writtenContent: "TAMPERED" },
    });
  } catch (e) { cSubImmutErr = e.message.slice(0, 100); }
  log("§4 · CircleSubmission UPDATE writtenContent SUBMITTED refused", { refused: !!cSubImmutErr });

  // ── §5 · immutabilité feedback PUBLISHED (Monde + Racines) ─────────
  process.stderr.write("\n─── §5 · immutabilité feedback PUBLISHED ───\n");
  const asmB = await db.assignment.create({
    data: {
      id: "test_p4_5_asm_fb", classroomId: classroomA.id, title: "TP feedback",
      type: "WRITTEN", status: "PUBLISHED", publishedAt: new Date(),
      createdByTeacherId: teacherA.id,
    },
  });
  const subB = await db.assignmentSubmission.create({
    data: {
      id: "test_p4_5_sub_fb", assignmentId: asmB.id, userId: studentAUser.id,
      writtenContent: "réponse", status: "SUBMITTED", version: 1,
      submittedAt: new Date(),
    },
  });
  const fbMonde = await db.assignmentFeedback.create({
    data: {
      id: "test_p4_5_fb_monde", submissionId: subB.id, authorTeacherId: teacherA.id,
      status: "PUBLISHED", version: 1, writtenContent: "Bien !",
      publishedAt: new Date(),
    },
  });
  let fbUpdErr = null;
  try {
    await db.assignmentFeedback.update({
      where: { id: fbMonde.id }, data: { writtenContent: "TAMPERED" },
    });
  } catch (e) { fbUpdErr = e.message.slice(0, 100); }
  log("§5 · UPDATE feedback Monde PUBLISHED refused", { refused: !!fbUpdErr, sample: fbUpdErr });

  let fbStorageErr = null;
  try {
    await db.assignmentFeedback.update({
      where: { id: fbMonde.id }, data: { storageObjectId: "test_p4_5_fake_storage" },
    });
  } catch (e) { fbStorageErr = e.message.slice(0, 100); }
  log("§5 · replace storageObjectId PUBLISHED refused", { refused: !!fbStorageErr });

  // Feedback Racines PUBLISHED
  const cFb = await db.circleFeedback.create({
    data: {
      id: "test_p4_5_c_fb", submissionId: cSub.id, authorCoachUserId: coachAUser.id,
      status: "PUBLISHED", version: 1, writtenContent: "Bravo !",
      publishedAt: new Date(),
    },
  });
  let cFbUpdErr = null;
  try {
    await db.circleFeedback.update({
      where: { id: cFb.id }, data: { writtenContent: "TAMPERED" },
    });
  } catch (e) { cFbUpdErr = e.message.slice(0, 100); }
  log("§5 · UPDATE feedback Racines PUBLISHED refused", { refused: !!cFbUpdErr, sample: cFbUpdErr });

  // ── §7 · addendum · original inchangé + nouvelle ligne ─────────────
  process.stderr.write("\n─── §7 · addendum ───\n");
  const fbOriginalBefore = await db.circleFeedback.findUnique({ where: { id: cFb.id } });
  const cAddendum = await db.circleFeedback.create({
    data: {
      id: "test_p4_5_c_fb_addendum", submissionId: cSub.id,
      authorCoachUserId: coachAUser.id, status: "ADDENDUM", version: 2,
      supersedesFeedbackId: cFb.id, writtenContent: "Précision · à retravailler.",
      publishedAt: new Date(),
    },
  });
  const fbOriginalAfter = await db.circleFeedback.findUnique({ where: { id: cFb.id } });
  const byteForByte =
    fbOriginalBefore.writtenContent === fbOriginalAfter.writtenContent
    && fbOriginalBefore.version === fbOriginalAfter.version
    && fbOriginalBefore.publishedAt?.getTime() === fbOriginalAfter.publishedAt?.getTime()
    && fbOriginalBefore.storageObjectId === fbOriginalAfter.storageObjectId;
  log("§7 · addendum · original inchangé byte-for-byte", {
    byteForByte, supersedesFeedbackId: cAddendum.supersedesFeedbackId,
    newVersion: cAddendum.version,
  });

  // ── §8 · race hebdomadaire 1 → 2/3 productions par childProfile ────
  process.stderr.write("\n─── §8 · race hebdomadaire ───\n");
  // Enfant dédié à la race hebdo · isolé des tests immutabilité précédents.
  const now = new Date();
  const childRaceWk = await ensureChildProfile("test_p4_5_child_race_wk", parentAUser.id, householdA.id, "EnfRaceWk");
  const raceCircle = await ensureCircle("test_p4_5_race_circle_wk", householdA.id, "LINGALA", parentAUser.id);
  await db.circleMembership.create({
    data: { circleId: raceCircle.id, userId: coachAUser.id, role: "COACH", status: "ACTIVE", joinedAt: new Date() },
  });
  await db.circleMembership.create({
    data: { circleId: raceCircle.id, childProfileId: childRaceWk.id, role: "CHILD", status: "ACTIVE", joinedAt: new Date() },
  });
  // 1 production planifiée déjà cette semaine · état "1 → 2/3".
  await db.circleAssignment.create({
    data: {
      id: "test_p4_5_race_asm_seed", circleId: raceCircle.id,
      createdByCoachUserId: coachAUser.id, title: "Seed hebdo",
      productionType: "WRITTEN", status: "PUBLISHED",
      publishedAt: now,
    },
  });

  async function attemptWeeklyPublish(assignmentId, childProfileId) {
    return db.$transaction(async (tx) => {
      // Advisory lock par childProfileId · évite race avec 2 concurrent
      // transactions sur le même profil.
      await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(hashtext($1)::bigint)`, childProfileId);
      await assertRootsAssignmentWeeklyCapacity(tx, { childProfileId, at: now });
      const upd = await tx.circleAssignment.update({
        where: { id: assignmentId }, data: { status: "PUBLISHED", publishedAt: now },
      });
      return upd;
    }, { isolationLevel: "Serializable" });
  }

  const raceAsm1 = await db.circleAssignment.create({
    data: {
      id: "test_p4_5_race_asm_wk_1", circleId: raceCircle.id,
      createdByCoachUserId: coachAUser.id, title: "Race hebdo 1",
      productionType: "WRITTEN", status: "DRAFT",
    },
  });
  const raceAsm2 = await db.circleAssignment.create({
    data: {
      id: "test_p4_5_race_asm_wk_2", circleId: raceCircle.id,
      createdByCoachUserId: coachAUser.id, title: "Race hebdo 2",
      productionType: "WRITTEN", status: "DRAFT",
    },
  });

  const [rW1, rW2] = await Promise.allSettled([
    withRetryInline(() => attemptWeeklyPublish(raceAsm1.id, childRaceWk.id), "concurrent_assignment_update"),
    withRetryInline(() => attemptWeeklyPublish(raceAsm2.id, childRaceWk.id), "concurrent_assignment_update"),
  ]);
  const wkSuccesses = [rW1, rW2].filter((r) => r.status === "fulfilled").length;
  const wkErrs = [rW1, rW2].filter((r) => r.status === "rejected").map((r) => r.reason?.code ?? r.reason?.message?.slice(0, 50));
  const wkExposedP2034 = wkErrs.some((e) => /P2034|TransactionWriteConflict|INTERNAL/i.test(e ?? ""));
  const wkStable = wkErrs.every((e) => !e || e === "roots_weekly_production_limit_reached" || /concurrent_/.test(e));
  const wkFinalPublished = await db.circleAssignment.count({
    where: { circleId: raceCircle.id, status: "PUBLISHED", publishedAt: { gte: new Date(now.getTime() - 86400000 * 8) } },
  });
  log("§8 · race hebdomadaire result", {
    successes: wkSuccesses, errs: wkErrs, finalPublished: wkFinalPublished,
    exposedP2034: wkExposedP2034, allCodesStable: wkStable,
  });

  // ── §8 · race mensuelle 7 → 8/9 ─────────────────────────────────────
  process.stderr.write("\n─── §8 · race mensuelle ───\n");
  // Profil dédié à la race mensuelle · état de départ "7 planifiées".
  const { start: mStart } = utcMonthBounds(now);
  const childRaceMo = await ensureChildProfile("test_p4_5_child_race_mo", parentAUser.id, householdA.id, "EnfRaceMo");
  const monthCircle = await ensureCircle("test_p4_5_race_circle_mo", householdA.id, "SWAHILI", parentAUser.id);
  await db.circleMembership.create({
    data: { circleId: monthCircle.id, userId: coachAUser.id, role: "COACH", status: "ACTIVE", joinedAt: new Date() },
  });
  await db.circleMembership.create({
    data: { circleId: monthCircle.id, childProfileId: childRaceMo.id, role: "CHILD", status: "ACTIVE", joinedAt: new Date() },
  });
  // Seed 7 productions publiées ce mois sur monthCircle · état "7 → 8/9".
  for (let i = 0; i < 7; i++) {
    await db.circleAssignment.create({
      data: {
        id: `test_p4_5_race_asm_month_seed_${i}`, circleId: monthCircle.id,
        createdByCoachUserId: coachAUser.id, title: `Seed month ${i}`,
        productionType: "WRITTEN", status: "PUBLISHED", publishedAt: now,
      },
    });
  }

  async function attemptMonthlyPublish(assignmentId, childProfileId) {
    return db.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(hashtext($1)::bigint)`, childProfileId);
      await assertRootsAssignmentMonthlyCapacity(tx, { childProfileId, at: now });
      const upd = await tx.circleAssignment.update({
        where: { id: assignmentId }, data: { status: "PUBLISHED", publishedAt: now },
      });
      return upd;
    }, { isolationLevel: "Serializable" });
  }

  const raceMon1 = await db.circleAssignment.create({
    data: {
      id: "test_p4_5_race_asm_month_1", circleId: monthCircle.id,
      createdByCoachUserId: coachAUser.id, title: "Race month 1",
      productionType: "WRITTEN", status: "DRAFT",
    },
  });
  const raceMon2 = await db.circleAssignment.create({
    data: {
      id: "test_p4_5_race_asm_month_2", circleId: monthCircle.id,
      createdByCoachUserId: coachAUser.id, title: "Race month 2",
      productionType: "WRITTEN", status: "DRAFT",
    },
  });

  const [rM1, rM2] = await Promise.allSettled([
    withRetryInline(() => attemptMonthlyPublish(raceMon1.id, childRaceMo.id), "concurrent_assignment_update"),
    withRetryInline(() => attemptMonthlyPublish(raceMon2.id, childRaceMo.id), "concurrent_assignment_update"),
  ]);
  const monSuccesses = [rM1, rM2].filter((r) => r.status === "fulfilled").length;
  const monErrs = [rM1, rM2].filter((r) => r.status === "rejected").map((r) => r.reason?.code ?? r.reason?.message?.slice(0, 50));
  const monExposedP2034 = monErrs.some((e) => /P2034|TransactionWriteConflict|INTERNAL/i.test(e ?? ""));
  const monStable = monErrs.every((e) => !e || e === "roots_monthly_production_limit_reached" || /concurrent_/.test(e));
  const monFinalPublished = await db.circleAssignment.count({
    where: {
      circleId: monthCircle.id,
      status: "PUBLISHED",
      publishedAt: { gte: mStart },
    },
  });
  log("§8 · race mensuelle result", {
    successes: monSuccesses, errs: monErrs, finalPublished: monFinalPublished,
    exposedP2034: monExposedP2034, allCodesStable: monStable,
  });

  // ── §7 · RLS SELECT cross-tenant · lecture avec Prisma vs helpers ───
  //
  // Note · Prisma passe par service_role (bypass RLS). Pour tester
  // effectivement les policies SELECT, on invoque directement les helpers
  // Postgres avec un p_user_id explicite · cela reproduit ce que le rôle
  // authenticated verrait. Le test complet des policies via JWT anon/auth
  // demande un client Supabase (P4.5-F closure) · ici on verrouille les
  // helpers.
  process.stderr.write("\n─── §7 · cross-tenant helpers ───\n");
  const teacherAOnAsmA = await db.$queryRawUnsafe(
    `SELECT is_teacher_for_assignment($1, $2) AS ok`,
    "test_p4_5_asm_fb", teacherAUser.id,
  );
  const teacherBOnAsmA = await db.$queryRawUnsafe(
    `SELECT is_teacher_for_assignment($1, $2) AS ok`,
    "test_p4_5_asm_fb", teacherBUser.id,
  );
  const studentAOnAsmA = await db.$queryRawUnsafe(
    `SELECT is_student_for_assignment($1, $2) AS ok`,
    "test_p4_5_asm_fb", studentAUser.id,
  );
  const studentBOnAsmA = await db.$queryRawUnsafe(
    `SELECT is_student_for_assignment($1, $2) AS ok`,
    "test_p4_5_asm_fb", studentBUser.id,
  );
  log("§7 · Teacher A on assignment A (expect true)", { ok: teacherAOnAsmA[0]?.ok });
  log("§7 · Teacher B on assignment A (expect false)", { ok: teacherBOnAsmA[0]?.ok });
  log("§7 · Student A on assignment A (expect true)", { ok: studentAOnAsmA[0]?.ok });
  log("§7 · Student B on assignment A (expect false)", { ok: studentBOnAsmA[0]?.ok });

  const parentAOnChildA = await db.$queryRawUnsafe(
    `SELECT is_child_parent($1, $2) AS ok`, childA.id, parentAUser.id,
  );
  const parentBOnChildA = await db.$queryRawUnsafe(
    `SELECT is_child_parent($1, $2) AS ok`, childA.id, parentBUser.id,
  );
  const coachAOnSubA = await db.$queryRawUnsafe(
    `SELECT can_view_circle_submission($1, $2) AS ok`, cSub.id, coachAUser.id,
  );
  const coachBOnSubA = await db.$queryRawUnsafe(
    `SELECT can_view_circle_submission($1, $2) AS ok`, cSub.id, coachBUser.id,
  );
  const parentBOnSubA = await db.$queryRawUnsafe(
    `SELECT can_view_circle_submission($1, $2) AS ok`, cSub.id, parentBUser.id,
  );
  log("§7 · Parent A on Child A (expect true)", { ok: parentAOnChildA[0]?.ok });
  log("§7 · Parent B on Child A (expect false)", { ok: parentBOnChildA[0]?.ok });
  log("§7 · Coach A on Submission A (expect true)", { ok: coachAOnSubA[0]?.ok });
  log("§7 · Coach B on Submission A (expect false)", { ok: coachBOnSubA[0]?.ok });
  log("§7 · Parent B on Submission A (expect false)", { ok: parentBOnSubA[0]?.ok });

  // ── Cleanup ──────────────────────────────────────────────────────────
  await purgeTestData();
  const [aTeach, aClass, aAssign, aSub, aFb, aCircle, aCA, aCT, aCS, aCF, aCR] = await Promise.all([
    db.teacher.count({ where: { id: { startsWith: "test_p4_5_" } } }),
    db.classroom.count({ where: { id: { startsWith: "test_p4_5_" } } }),
    db.assignment.count({ where: { id: { startsWith: "test_p4_5_" } } }),
    db.assignmentSubmission.count({ where: { id: { startsWith: "test_p4_5_" } } }),
    db.assignmentFeedback.count({ where: { id: { startsWith: "test_p4_5_" } } }),
    db.circle.count({ where: { id: { startsWith: "test_p4_5_" } } }),
    db.circleAssignment.count({ where: { id: { startsWith: "test_p4_5_" } } }),
    db.circleAssignmentTarget.count({ where: { id: { startsWith: "test_p4_5_" } } }),
    db.circleSubmission.count({ where: { id: { startsWith: "test_p4_5_" } } }),
    db.circleFeedback.count({ where: { id: { startsWith: "test_p4_5_" } } }),
    db.circleSubmissionReply.count({ where: { id: { startsWith: "test_p4_5_" } } }),
  ]);
  const total = aTeach + aClass + aAssign + aSub + aFb + aCircle + aCA + aCT + aCS + aCF + aCR;
  log("cleanup · residual fixtures (all expect 0)", {
    teachers: aTeach, classrooms: aClass, assignments: aAssign, submissions: aSub,
    feedbacks: aFb, circles: aCircle, circleAssignments: aCA, targets: aCT,
    circleSubmissions: aCS, circleFeedbacks: aCF, circleReplies: aCR, total,
  });
  if (total === 0) process.stderr.write("\nBASELINE DATA CLEANED\n");
  else process.stderr.write("\nCLEANUP FAILED · residual fixtures detected\n");

  await db.$disconnect();

  const { writeFile, mkdir } = await import("node:fs/promises");
  await mkdir("/tmp/p4-5-captures", { recursive: true });
  await writeFile("/tmp/p4-5-captures/foundations.json", JSON.stringify(results, null, 2));
  process.stderr.write(`\nWritten /tmp/p4-5-captures/foundations.json\n`);
}

main().catch(async (e) => {
  console.error(e);
  try { await purgeTestData(); await db.$disconnect(); } catch {}
  process.exit(1);
});
