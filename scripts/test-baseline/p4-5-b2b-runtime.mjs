// P4.5-B2b1 · harness runtime backend · immutabilité DB columnar + 5 races.
//
// Utilise les fixtures P-1 (setup automatique · run p4-5-b-fixtures.mjs si besoin).
// Cleanup obligatoire à la fin · sortie `BASELINE DATA CLEANED`.
//
// Sécurité · uniquement P-1 via `assertNonProduction`. Aucune écriture prod.

import { assertNonProduction } from "./_common.mjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

assertNonProduction();
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
  log: ["error"],
});

const PREFIX = "test_p4_5_b_";
const results = [];

function log(label, obj) {
  results.push({ label, ...obj });
  process.stderr.write(`  ${label} · ${JSON.stringify(obj)}\n`);
}

async function purgeTestData() {
  await db.assignmentFeedback.deleteMany({ where: { id: { startsWith: PREFIX } } });
  await db.assignmentSubmission.deleteMany({ where: { id: { startsWith: PREFIX } } });
  await db.assignment.deleteMany({ where: { id: { startsWith: PREFIX } } });
  await db.classroomEnrollment.deleteMany({
    where: { OR: [{ classroomId: { startsWith: PREFIX } }, { userId: { startsWith: PREFIX } }] },
  });
  await db.classroom.deleteMany({ where: { id: { startsWith: PREFIX } } });
  await db.teacher.deleteMany({ where: { id: { startsWith: PREFIX } } });
  await db.userAppRole.deleteMany({ where: { userId: { startsWith: PREFIX } } });
  await db.auditEvent.deleteMany({ where: { targetId: { startsWith: PREFIX } } });
  await db.user.deleteMany({ where: { email: { contains: PREFIX } } });
}

// Retry pattern inline · miroir de src/lib/db/retry.ts.
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

async function main() {
  process.stderr.write("═══ P4.5-B2b1 · runtime backend ═══\n\n");
  await purgeTestData();

  // ── Setup fixtures minimales pour le harness ──────────────────────
  const teacherAUser = await db.user.upsert({
    where: { email: `${PREFIX}teacher_a@example.com` },
    update: {}, create: {
      id: `${PREFIX}teacher_a_user`, email: `${PREFIX}teacher_a@example.com`,
      supabaseId: `${PREFIX}teacher_a_user`, role: "TEACHER",
      fullName: "TEST P4.5-B teacher A", onboardingDone: true,
    },
  });
  const teacherBUser = await db.user.upsert({
    where: { email: `${PREFIX}teacher_b@example.com` },
    update: {}, create: {
      id: `${PREFIX}teacher_b_user`, email: `${PREFIX}teacher_b@example.com`,
      supabaseId: `${PREFIX}teacher_b_user`, role: "TEACHER",
      fullName: "TEST P4.5-B teacher B", onboardingDone: true,
    },
  });
  const studentAUser = await db.user.upsert({
    where: { email: `${PREFIX}student_a@example.com` },
    update: {}, create: {
      id: `${PREFIX}student_a_user`, email: `${PREFIX}student_a@example.com`,
      supabaseId: `${PREFIX}student_a_user`, role: "STUDENT",
      fullName: "TEST P4.5-B student A", onboardingDone: true,
    },
  });
  const teacherA = await db.teacher.upsert({
    where: { id: `${PREFIX}teacher_a` }, update: {},
    create: { id: `${PREFIX}teacher_a`, userId: teacherAUser.id },
  });
  const teacherB = await db.teacher.upsert({
    where: { id: `${PREFIX}teacher_b` }, update: {},
    create: { id: `${PREFIX}teacher_b`, userId: teacherBUser.id },
  });
  const classroomA = await db.classroom.upsert({
    where: { id: `${PREFIX}classroom_a` }, update: {},
    create: {
      id: `${PREFIX}classroom_a`, name: "Klasse A",
      teacherId: teacherA.id, level: "A1", code: `TP45B-A${Date.now().toString().slice(-6)}`,
    },
  });
  const classroomB = await db.classroom.upsert({
    where: { id: `${PREFIX}classroom_b` }, update: {},
    create: {
      id: `${PREFIX}classroom_b`, name: "Klasse B",
      teacherId: teacherB.id, level: "A1", code: `TP45B-B${Date.now().toString().slice(-6)}`,
    },
  });
  await db.classroomEnrollment.upsert({
    where: { classroomId_userId: { classroomId: classroomA.id, userId: studentAUser.id } },
    update: { isActive: true },
    create: { classroomId: classroomA.id, userId: studentAUser.id, isActive: true },
  });

  // ── §10 · immutabilité colonnes scope (triggers 00004) ─────────────
  process.stderr.write("\n─── §10 · immutabilité columnar ───\n");

  const asmSample = await db.assignment.create({
    data: {
      id: `${PREFIX}asm_immut`,
      classroom: { connect: { id: classroomA.id } },
      title: "Draft immutabilité", type: "WRITTEN", status: "DRAFT",
      createdByTeacher: { connect: { id: teacherA.id } },
    },
  });

  let asmScopeErr = null;
  try {
    await db.assignment.update({
      where: { id: asmSample.id },
      data: { classroom: { connect: { id: classroomB.id } } },
    });
  } catch (e) { asmScopeErr = e.message.slice(0, 100); }
  log("§10 · Assignment · UPDATE classroomId DRAFT refused (trigger)", { refused: !!asmScopeErr });

  let asmAuthorErr = null;
  try {
    await db.assignment.update({
      where: { id: asmSample.id },
      data: { createdByTeacher: { connect: { id: teacherB.id } } },
    });
  } catch (e) { asmAuthorErr = e.message.slice(0, 100); }
  log("§10 · Assignment · UPDATE createdByTeacherId refused (trigger)", { refused: !!asmAuthorErr });

  // Assignment SUBMITTED test uses AssignmentSubmission trigger.
  const asmForSub = await db.assignment.update({
    where: { id: asmSample.id },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });
  const subSample = await db.assignmentSubmission.create({
    data: {
      id: `${PREFIX}sub_immut`,
      assignment: { connect: { id: asmForSub.id } },
      user: { connect: { id: studentAUser.id } },
      writtenContent: "brouillon", status: "DRAFT", version: 1,
    },
  });

  let subAsmErr = null;
  try {
    // Créer un 2e assignment pour tester le déplacement.
    const asmOther = await db.assignment.create({
      data: {
        id: `${PREFIX}asm_other`,
        classroom: { connect: { id: classroomA.id } },
        title: "Autre", type: "WRITTEN", status: "PUBLISHED",
        publishedAt: new Date(),
        createdByTeacher: { connect: { id: teacherA.id } },
      },
    });
    await db.assignmentSubmission.update({
      where: { id: subSample.id },
      data: { assignment: { connect: { id: asmOther.id } } },
    });
  } catch (e) { subAsmErr = e.message.slice(0, 100); }
  log("§10 · Submission · UPDATE assignmentId DRAFT refused (trigger)", { refused: !!subAsmErr });

  let subUserErr = null;
  try {
    await db.assignmentSubmission.update({
      where: { id: subSample.id },
      data: { user: { connect: { id: teacherBUser.id } } },
    });
  } catch (e) { subUserErr = e.message.slice(0, 100); }
  log("§10 · Submission · UPDATE userId DRAFT refused (trigger)", { refused: !!subUserErr });

  let subVersionErr = null;
  try {
    await db.assignmentSubmission.update({
      where: { id: subSample.id }, data: { version: 999 },
    });
  } catch (e) { subVersionErr = e.message.slice(0, 100); }
  log("§10 · Submission · UPDATE version DRAFT refused (trigger)", { refused: !!subVersionErr });

  // Feedback tests · submission SUBMITTED nécessaire pour feedback DRAFT.
  await db.assignmentSubmission.update({
    where: { id: subSample.id },
    data: { status: "SUBMITTED", submittedAt: new Date() },
  });
  const fbSample = await db.assignmentFeedback.create({
    data: {
      id: `${PREFIX}fb_immut`,
      submission: { connect: { id: subSample.id } },
      authorTeacher: { connect: { id: teacherA.id } },
      status: "DRAFT", version: 1, writtenContent: "brouillon fb",
    },
  });

  let fbAuthorErr = null;
  try {
    await db.assignmentFeedback.update({
      where: { id: fbSample.id },
      data: { authorTeacher: { connect: { id: teacherB.id } } },
    });
  } catch (e) { fbAuthorErr = e.message.slice(0, 100); }
  log("§10 · Feedback · UPDATE authorTeacherId DRAFT refused (trigger)", { refused: !!fbAuthorErr });

  let fbVersionErr = null;
  try {
    await db.assignmentFeedback.update({
      where: { id: fbSample.id }, data: { version: 999 },
    });
  } catch (e) { fbVersionErr = e.message.slice(0, 100); }
  log("§10 · Feedback · UPDATE version DRAFT refused (trigger)", { refused: !!fbVersionErr });

  // ── §11 races (backend, via prisma.$transaction Serializable) ──────
  process.stderr.write("\n─── §11 · Race 1 · double publish Assignment ───\n");
  const raceAsm = await db.assignment.create({
    data: {
      id: `${PREFIX}race_asm`,
      classroom: { connect: { id: classroomA.id } },
      title: "Race publish", type: "WRITTEN", status: "DRAFT",
      createdByTeacher: { connect: { id: teacherA.id } },
    },
  });

  async function publishAsm() {
    return db.$transaction(async (tx) => {
      const asm = await tx.assignment.findUnique({ where: { id: raceAsm.id }, select: { status: true } });
      if (asm.status !== "DRAFT") {
        const err = new Error("invalid_assignment_transition"); err.code = "invalid_assignment_transition";
        throw err;
      }
      const upd = await tx.assignment.update({
        where: { id: raceAsm.id, status: "DRAFT" },
        data: { status: "PUBLISHED", publishedAt: new Date() },
      });
      await tx.auditEvent.create({
        data: {
          actorUserId: teacherAUser.id, actorRole: "TEACHER",
          action: "ASSIGNMENT_PUBLISHED",
          targetType: "Assignment", targetId: raceAsm.id,
          scopeType: "Classroom", scopeId: classroomA.id,
          metadata: { teacherId: teacherA.id, routeAction: "publishAssignment" },
        },
      });
      return upd;
    }, { isolationLevel: "Serializable" });
  }

  const [r1a, r1b] = await Promise.allSettled([
    withRetryInline(publishAsm, "concurrent_assignment_update"),
    withRetryInline(publishAsm, "concurrent_assignment_update"),
  ]);
  const r1s = [r1a, r1b].filter((r) => r.status === "fulfilled").length;
  const r1errs = [r1a, r1b].filter((r) => r.status === "rejected").map((r) => r.reason?.code ?? r.reason?.message?.slice(0, 50));
  const r1exposedP2034 = r1errs.some((e) => /P2034|TransactionWriteConflict/i.test(e ?? ""));
  const asmFinalStatus = (await db.assignment.findUnique({ where: { id: raceAsm.id }, select: { status: true } })).status;
  const r1audits = await db.auditEvent.count({ where: { action: "ASSIGNMENT_PUBLISHED", targetId: raceAsm.id } });
  log("§11 · Race 1 · double publish assignment", {
    successes: r1s, errs: r1errs, finalStatus: asmFinalStatus, audits: r1audits, exposedP2034: r1exposedP2034,
  });

  process.stderr.write("\n─── §11 · Race 2 · double submit ───\n");
  await db.assignment.update({
    where: { id: raceAsm.id }, data: { status: "DRAFT", publishedAt: null },
  });
  // Trigger de status ne peut plus revenir à DRAFT après PUBLISHED... vérifions.
  // En fait le trigger `p4_5_enforce_submission_immutability` ne s'applique
  // qu'à assignment_submissions, pas assignments. Le service applicatif
  // interdit PUBLISHED→DRAFT mais on peut le faire en direct via Prisma
  // pour reset le test. Puis republish.
  await db.assignment.update({
    where: { id: raceAsm.id }, data: { status: "PUBLISHED", publishedAt: new Date() },
  });
  const raceSub = await db.assignmentSubmission.create({
    data: {
      id: `${PREFIX}race_sub`,
      assignment: { connect: { id: raceAsm.id } },
      user: { connect: { id: studentAUser.id } },
      writtenContent: "réponse", status: "DRAFT", version: 1,
    },
  });
  async function submitSub() {
    return db.$transaction(async (tx) => {
      const sub = await tx.assignmentSubmission.findUnique({
        where: { id: raceSub.id }, select: { status: true },
      });
      if (sub.status !== "DRAFT") {
        const err = new Error("invalid_submission_transition"); err.code = "invalid_submission_transition";
        throw err;
      }
      const upd = await tx.assignmentSubmission.update({
        where: { id: raceSub.id, status: "DRAFT" },
        data: { status: "SUBMITTED", submittedAt: new Date() },
      });
      await tx.auditEvent.create({
        data: {
          actorUserId: studentAUser.id, actorRole: "STUDENT",
          action: "SUBMISSION_SUBMITTED",
          targetType: "AssignmentSubmission", targetId: raceSub.id,
          scopeType: "Assignment", scopeId: raceAsm.id,
          metadata: { classroomId: classroomA.id, version: 1, routeAction: "submitSubmission" },
        },
      });
      return upd;
    }, { isolationLevel: "Serializable" });
  }
  const [r2a, r2b] = await Promise.allSettled([
    withRetryInline(submitSub, "concurrent_submission_update"),
    withRetryInline(submitSub, "concurrent_submission_update"),
  ]);
  const r2s = [r2a, r2b].filter((r) => r.status === "fulfilled").length;
  const r2errs = [r2a, r2b].filter((r) => r.status === "rejected").map((r) => r.reason?.code ?? r.reason?.message?.slice(0, 50));
  const r2audits = await db.auditEvent.count({ where: { action: "SUBMISSION_SUBMITTED", targetId: raceSub.id } });
  const subFinal = (await db.assignmentSubmission.findUnique({ where: { id: raceSub.id }, select: { status: true, writtenContent: true } }));
  log("§11 · Race 2 · double submit", {
    successes: r2s, errs: r2errs, finalStatus: subFinal.status, audits: r2audits,
    exposedP2034: r2errs.some((e) => /P2034|TransactionWriteConflict/i.test(e ?? "")),
  });

  process.stderr.write("\n─── §11 · Race 3 · double new version ───\n");
  async function createVersion(nextVer) {
    return db.$transaction(async (tx) => {
      // Lock par (assignmentId, studentUserId) via advisory lock.
      await tx.$executeRawUnsafe(
        `SELECT pg_advisory_xact_lock(hashtext($1)::bigint)`,
        `${raceAsm.id}:${studentAUser.id}`,
      );
      const latest = await tx.assignmentSubmission.findFirst({
        where: { assignmentId: raceAsm.id, userId: studentAUser.id },
        orderBy: { version: "desc" }, select: { id: true, status: true, version: true },
      });
      if (latest.status !== "SUBMITTED") {
        const err = new Error("submission_invalid_transition"); err.code = "submission_invalid_transition";
        throw err;
      }
      await tx.assignmentSubmission.update({
        where: { id: latest.id, status: "SUBMITTED" },
        data: { status: "SUPERSEDED" },
      });
      const created = await tx.assignmentSubmission.create({
        data: {
          id: `${PREFIX}race_sub_v${nextVer}_${Date.now()}`,
          assignment: { connect: { id: raceAsm.id } },
          user: { connect: { id: studentAUser.id } },
          writtenContent: `nouvelle version v${nextVer}`,
          status: "DRAFT", version: latest.version + 1,
        },
        select: { id: true, version: true },
      });
      return created;
    }, { isolationLevel: "Serializable" });
  }
  const [r3a, r3b] = await Promise.allSettled([
    withRetryInline(() => createVersion(2), "concurrent_submission_update"),
    withRetryInline(() => createVersion(2), "concurrent_submission_update"),
  ]);
  const r3s = [r3a, r3b].filter((r) => r.status === "fulfilled").length;
  const r3errs = [r3a, r3b].filter((r) => r.status === "rejected").map((r) => r.reason?.code ?? r.reason?.message?.slice(0, 50));
  const r3versions = await db.assignmentSubmission.findMany({
    where: { assignmentId: raceAsm.id, userId: studentAUser.id },
    select: { version: true, status: true }, orderBy: { version: "asc" },
  });
  log("§11 · Race 3 · double new version", {
    successes: r3s, errs: r3errs, versions: r3versions,
    exposedP2034: r3errs.some((e) => /P2034|TransactionWriteConflict/i.test(e ?? "")),
  });

  process.stderr.write("\n─── §11 · Race 4 · double publish feedback ───\n");
  // Publier fbSample d'abord pour libérer le partial unique DRAFT.
  await db.assignmentFeedback.update({
    where: { id: fbSample.id },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });
  const raceFb = await db.assignmentFeedback.create({
    data: {
      id: `${PREFIX}race_fb`,
      submission: { connect: { id: subSample.id } },
      authorTeacher: { connect: { id: teacherA.id } },
      status: "DRAFT", version: 2, writtenContent: "à publier",
    },
  });
  async function publishFb() {
    return db.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `SELECT pg_advisory_xact_lock(hashtext($1)::bigint)`, raceFb.id,
      );
      const fb = await tx.assignmentFeedback.findUnique({
        where: { id: raceFb.id }, select: { status: true },
      });
      if (fb.status !== "DRAFT") {
        const err = new Error("feedback_already_published"); err.code = "feedback_already_published";
        throw err;
      }
      const upd = await tx.assignmentFeedback.update({
        where: { id: raceFb.id, status: "DRAFT" },
        data: { status: "PUBLISHED", publishedAt: new Date() },
      });
      await tx.auditEvent.create({
        data: {
          actorUserId: teacherAUser.id, actorRole: "TEACHER",
          action: "FEEDBACK_PUBLISHED",
          targetType: "AssignmentFeedback", targetId: raceFb.id,
          scopeType: "AssignmentSubmission", scopeId: subSample.id,
          metadata: { teacherId: teacherA.id, routeAction: "publishFeedback" },
        },
      });
      return upd;
    }, { isolationLevel: "Serializable" });
  }
  const [r4a, r4b] = await Promise.allSettled([
    withRetryInline(publishFb, "concurrent_feedback_update"),
    withRetryInline(publishFb, "concurrent_feedback_update"),
  ]);
  const r4s = [r4a, r4b].filter((r) => r.status === "fulfilled").length;
  const r4errs = [r4a, r4b].filter((r) => r.status === "rejected").map((r) => r.reason?.code ?? r.reason?.message?.slice(0, 50));
  const r4audits = await db.auditEvent.count({ where: { action: "FEEDBACK_PUBLISHED", targetId: raceFb.id } });
  const fbFinal = await db.assignmentFeedback.findUnique({ where: { id: raceFb.id }, select: { status: true } });
  log("§11 · Race 4 · double publish feedback", {
    successes: r4s, errs: r4errs, finalStatus: fbFinal.status, audits: r4audits,
    exposedP2034: r4errs.some((e) => /P2034|TransactionWriteConflict/i.test(e ?? "")),
  });

  process.stderr.write("\n─── §11 · Race 5 · double addendum ───\n");
  // raceFb est PUBLISHED. Créons 2 addenda concurrents.
  async function createAddendum() {
    return db.$transaction(async (tx) => {
      // Lock sur (submissionId, authorId) · clé stable de la lignée.
      await tx.$executeRawUnsafe(
        `SELECT pg_advisory_xact_lock(hashtext($1)::bigint)`,
        `${subSample.id}:${teacherA.id}`,
      );
      const latest = await tx.assignmentFeedback.findFirst({
        where: { submissionId: subSample.id, authorTeacherId: teacherA.id },
        orderBy: { version: "desc" }, select: { id: true, version: true, status: true },
      });
      if (latest.status !== "PUBLISHED" && latest.status !== "ADDENDUM") {
        const err = new Error("feedback_addendum_required"); err.code = "feedback_addendum_required";
        throw err;
      }
      const created = await tx.assignmentFeedback.create({
        data: {
          id: `${PREFIX}race_addendum_${latest.version + 1}_${Date.now()}${Math.random().toString().slice(-4)}`,
          submission: { connect: { id: subSample.id } },
          authorTeacher: { connect: { id: teacherA.id } },
          status: "ADDENDUM", version: latest.version + 1,
          supersedesFeedback: { connect: { id: latest.id } },
          writtenContent: `addendum v${latest.version + 1}`,
          publishedAt: new Date(),
        },
        select: { id: true, version: true },
      });
      await tx.auditEvent.create({
        data: {
          actorUserId: teacherAUser.id, actorRole: "TEACHER",
          action: "FEEDBACK_ADDENDUM_CREATED",
          targetType: "AssignmentFeedback", targetId: created.id,
          scopeType: "AssignmentSubmission", scopeId: subSample.id,
          metadata: { teacherId: teacherA.id, version: created.version, supersedesFeedbackId: latest.id, routeAction: "createFeedbackAddendum" },
        },
      });
      return created;
    }, { isolationLevel: "Serializable" });
  }
  const [r5a, r5b] = await Promise.allSettled([
    withRetryInline(createAddendum, "concurrent_feedback_update"),
    withRetryInline(createAddendum, "concurrent_feedback_update"),
  ]);
  const r5s = [r5a, r5b].filter((r) => r.status === "fulfilled").length;
  const r5errs = [r5a, r5b].filter((r) => r.status === "rejected").map((r) => r.reason?.code ?? r.reason?.message?.slice(0, 50));
  const r5versions = await db.assignmentFeedback.findMany({
    where: { submissionId: subSample.id, authorTeacherId: teacherA.id },
    select: { version: true, status: true }, orderBy: { version: "asc" },
  });
  const r5audits = await db.auditEvent.count({
    where: { action: "FEEDBACK_ADDENDUM_CREATED", scopeId: subSample.id },
  });
  log("§11 · Race 5 · double addendum", {
    successes: r5s, errs: r5errs, versions: r5versions, audits: r5audits,
    exposedP2034: r5errs.some((e) => /P2034|TransactionWriteConflict/i.test(e ?? "")),
  });

  // ── Cleanup ──────────────────────────────────────────────────────────
  await purgeTestData();
  const [
    users, teachers, classrooms, enrollments, assignments,
    submissions, feedbacks, audits,
  ] = await Promise.all([
    db.user.count({ where: { email: { contains: PREFIX } } }),
    db.teacher.count({ where: { id: { startsWith: PREFIX } } }),
    db.classroom.count({ where: { id: { startsWith: PREFIX } } }),
    db.classroomEnrollment.count({ where: { classroomId: { startsWith: PREFIX } } }),
    db.assignment.count({ where: { id: { startsWith: PREFIX } } }),
    db.assignmentSubmission.count({ where: { id: { startsWith: PREFIX } } }),
    db.assignmentFeedback.count({ where: { id: { startsWith: PREFIX } } }),
    db.auditEvent.count({ where: { targetId: { startsWith: PREFIX } } }),
  ]);
  const total = users + teachers + classrooms + enrollments + assignments + submissions + feedbacks + audits;
  log("cleanup · residual fixtures (all expect 0)", {
    users, teachers, classrooms, enrollments, assignments,
    submissions, feedbacks, audits, total,
  });
  if (total === 0) process.stderr.write("\nBASELINE DATA CLEANED\n");
  else process.stderr.write("\nCLEANUP FAILED · residual fixtures detected\n");

  await db.$disconnect();

  const { writeFile, mkdir } = await import("node:fs/promises");
  await mkdir("/tmp/p4-5-b-captures", { recursive: true });
  await writeFile("/tmp/p4-5-b-captures/runtime.json", JSON.stringify(results, null, 2));
  process.stderr.write(`\nWritten /tmp/p4-5-b-captures/runtime.json\n`);
}

main().catch(async (e) => {
  console.error(e);
  try { await purgeTestData(); await db.$disconnect(); } catch {}
  process.exit(1);
});
