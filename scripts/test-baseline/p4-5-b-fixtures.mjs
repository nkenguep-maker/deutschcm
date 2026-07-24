// P4.5-B2b1 · fixtures P-1 protégées `test_p4_5_b_` (§3 brief).
//
// Personas · Teacher A/B, Teacher sans binding, Student A/B, Student sans
// enrollment, Student enrollment REMOVED, Center admin, Racines Coach,
// YEMA_ADMIN sans binding Teacher, Anonymous (session absente, hors DB).
//
// Données strictement séparées A/B ·
//   Classroom A (Teacher A)      · Classroom B (Teacher B)
//   Assignment A DRAFT/PUBLISHED/CLOSED  · Assignment B PUBLISHED
//   Submission A DRAFT/SUBMITTED/SUPERSEDED + v2 (Student A)
//   Feedback A DRAFT/PUBLISHED/ADDENDUM (Teacher A → Submission A SUBMITTED)
//
// Idempotent · relance sans erreur (upsert everywhere).
// Refuse toute cible autre que P-1 via `assertNonProduction`.

import { assertNonProduction } from "./_common.mjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

assertNonProduction();
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
  log: ["error"],
});

const PREFIX = "test_p4_5_b_";

async function ensureUser(id, email, role = "STUDENT") {
  return db.user.upsert({
    where: { email },
    update: { id, supabaseId: id, role, fullName: `TEST P4.5-B ${email}`, onboardingDone: true },
    create: { id, email, supabaseId: id, role, fullName: `TEST P4.5-B ${email}`, onboardingDone: true },
  });
}
async function ensureTeacher(id, userId) {
  return db.teacher.upsert({
    where: { id }, update: {}, create: { id, userId },
  });
}
async function ensureAppRole(userId, role) {
  await db.userAppRole.upsert({
    where: { userId_role: { userId, role } },
    update: {}, create: { userId, role },
  });
}
async function ensureClassroom(id, teacherId, name) {
  return db.classroom.upsert({
    where: { id },
    update: {},
    create: { id, name, teacherId, level: "A1", code: `TP45B-${id.slice(-8)}` },
  });
}
async function ensureEnrollment(classroomId, userId, isActive = true) {
  return db.classroomEnrollment.upsert({
    where: { classroomId_userId: { classroomId, userId } },
    update: { isActive },
    create: { classroomId, userId, isActive },
  });
}
async function ensureAssignment(id, classroomId, teacherId, title, status, publishedAt = null, closedAt = null) {
  const existing = await db.assignment.findUnique({ where: { id } });
  if (existing) {
    return db.assignment.update({
      where: { id },
      data: { title, status, publishedAt, closedAt },
    });
  }
  return db.assignment.create({
    data: {
      id,
      classroom: { connect: { id: classroomId } },
      title, type: "WRITTEN", status, publishedAt, closedAt,
      createdByTeacher: { connect: { id: teacherId } },
    },
  });
}
async function ensureSubmission(id, assignmentId, userId, status, version, writtenContent, submittedAt = null) {
  const existing = await db.assignmentSubmission.findUnique({ where: { id } });
  if (existing) {
    // Attention · triggers d'immutabilité columnar (00004) refusent
    // toute mutation de assignmentId/userId/version. On upsert avec
    // exactement ces valeurs, ce qui est autorisé (NEW = OLD).
    return existing;
  }
  return db.assignmentSubmission.create({
    data: {
      id,
      assignment: { connect: { id: assignmentId } },
      user: { connect: { id: userId } },
      writtenContent, status, version,
      ...(submittedAt ? { submittedAt } : {}),
    },
  });
}
async function ensureFeedback(id, submissionId, authorTeacherId, status, version, writtenContent, supersedesFeedbackId = null, publishedAt = null) {
  const existing = await db.assignmentFeedback.findUnique({ where: { id } });
  if (existing) return existing;
  return db.assignmentFeedback.create({
    data: {
      id,
      submission: { connect: { id: submissionId } },
      authorTeacher: { connect: { id: authorTeacherId } },
      status, version, writtenContent,
      supersedesFeedback: supersedesFeedbackId ? { connect: { id: supersedesFeedbackId } } : undefined,
      publishedAt,
    },
  });
}

async function main() {
  process.stderr.write("═══ P4.5-B fixtures P-1 ═══\n\n");

  // ── Personas ──────────────────────────────────────────────────────
  const teacherAUser = await ensureUser(`${PREFIX}teacher_a_user`, `${PREFIX}teacher_a@example.com`, "TEACHER");
  const teacherBUser = await ensureUser(`${PREFIX}teacher_b_user`, `${PREFIX}teacher_b@example.com`, "TEACHER");
  const teacherNoBindingUser = await ensureUser(`${PREFIX}teacher_no_bind_user`, `${PREFIX}teacher_no_bind@example.com`, "TEACHER");
  const studentAUser = await ensureUser(`${PREFIX}student_a_user`, `${PREFIX}student_a@example.com`, "STUDENT");
  const studentBUser = await ensureUser(`${PREFIX}student_b_user`, `${PREFIX}student_b@example.com`, "STUDENT");
  const studentNoEnrollUser = await ensureUser(`${PREFIX}student_no_enroll_user`, `${PREFIX}student_no_enroll@example.com`, "STUDENT");
  const studentRemovedUser = await ensureUser(`${PREFIX}student_removed_user`, `${PREFIX}student_removed@example.com`, "STUDENT");
  const centerAdminUser = await ensureUser(`${PREFIX}center_admin_user`, `${PREFIX}center_admin@example.com`, "ADMIN");
  const rootsCoachUser = await ensureUser(`${PREFIX}roots_coach_user`, `${PREFIX}roots_coach@example.com`, "STUDENT");
  const yemaAdminNoBindUser = await ensureUser(`${PREFIX}yema_admin_no_bind_user`, `${PREFIX}yema_admin_no_bind@example.com`, "STUDENT");

  await ensureAppRole(centerAdminUser.id, "CENTER_ADMIN");
  await ensureAppRole(rootsCoachUser.id, "RACINES_COACH");
  await ensureAppRole(yemaAdminNoBindUser.id, "YEMA_ADMIN");

  const teacherA = await ensureTeacher(`${PREFIX}teacher_a`, teacherAUser.id);
  const teacherB = await ensureTeacher(`${PREFIX}teacher_b`, teacherBUser.id);
  // Teacher sans binding · le userId a role TEACHER mais aucun Teacher row · testé côté resolver.

  const classroomA = await ensureClassroom(`${PREFIX}classroom_a`, teacherA.id, "Klasse A");
  const classroomB = await ensureClassroom(`${PREFIX}classroom_b`, teacherB.id, "Klasse B");

  await ensureEnrollment(classroomA.id, studentAUser.id, true);
  await ensureEnrollment(classroomB.id, studentBUser.id, true);
  await ensureEnrollment(classroomA.id, studentRemovedUser.id, false); // enrollment REMOVED

  // ── Assignments A ─────────────────────────────────────────────────
  const now = new Date();
  const asmDraftA = await ensureAssignment(
    `${PREFIX}assignment_a_draft`, classroomA.id, teacherA.id,
    "Devoir A · brouillon", "DRAFT",
  );
  const asmPubA = await ensureAssignment(
    `${PREFIX}assignment_a_published`, classroomA.id, teacherA.id,
    "Devoir A · publié", "PUBLISHED", now,
  );
  const asmClosedA = await ensureAssignment(
    `${PREFIX}assignment_a_closed`, classroomA.id, teacherA.id,
    "Devoir A · fermé", "CLOSED", now, now,
  );

  // Assignment B PUBLISHED
  const asmPubB = await ensureAssignment(
    `${PREFIX}assignment_b_published`, classroomB.id, teacherB.id,
    "Devoir B · publié", "PUBLISHED", now,
  );

  // ── Submissions A (Student A) · les 4 statuts illustrés ──────────
  //   - Sur asm_a_published · v1 SUPERSEDED (historique) + v2 DRAFT (courant)
  //   - Sur asm_a_closed    · v1 SUBMITTED (indépendant, pré-close)
  const subSupersededA = await ensureSubmission(
    `${PREFIX}submission_a_superseded`, asmPubA.id, studentAUser.id,
    "SUPERSEDED", 1, "Réponse A · v1 supersedée", now,
  );
  const subDraftA = await ensureSubmission(
    `${PREFIX}submission_a_v2_draft`, asmPubA.id, studentAUser.id,
    "DRAFT", 2, "Brouillon A · v2 (nouvelle version courante)",
  );
  const subSubmittedA = await ensureSubmission(
    `${PREFIX}submission_a_submitted`, asmClosedA.id, studentAUser.id,
    "SUBMITTED", 1, "Réponse A · v1 finalisée", now,
  );
  const subNextA = subDraftA; // alias · exposé comme "version suivante"

  // ── Feedbacks A (Teacher A → Submission A SUBMITTED) ─────────────
  const fbDraftA = await ensureFeedback(
    `${PREFIX}feedback_a_draft`, subSubmittedA.id, teacherA.id,
    "DRAFT", 1, "Brouillon de retour A",
  );
  const fbPublishedA = await ensureFeedback(
    `${PREFIX}feedback_a_published`, subSubmittedA.id, teacherA.id,
    "PUBLISHED", 1, "Bien !", null, now,
  );
  const fbAddendumA = await ensureFeedback(
    `${PREFIX}feedback_a_addendum`, subSubmittedA.id, teacherA.id,
    "ADDENDUM", 2, "Précision : travaille les articles.", fbPublishedA.id, now,
  );

  const summary = {
    personas: {
      teacherAUser: teacherAUser.email,
      teacherBUser: teacherBUser.email,
      teacherNoBindingUser: teacherNoBindingUser.email,
      studentAUser: studentAUser.email,
      studentBUser: studentBUser.email,
      studentNoEnrollUser: studentNoEnrollUser.email,
      studentRemovedUser: studentRemovedUser.email,
      centerAdminUser: centerAdminUser.email,
      rootsCoachUser: rootsCoachUser.email,
      yemaAdminNoBindUser: yemaAdminNoBindUser.email,
    },
    data: {
      classroomA: classroomA.id, classroomB: classroomB.id,
      asmDraftA: asmDraftA.id, asmPubA: asmPubA.id, asmClosedA: asmClosedA.id, asmPubB: asmPubB.id,
      subDraftA: subDraftA.id, subSubmittedA: subSubmittedA.id,
      subSupersededA: subSupersededA.id, subNextA: subNextA.id,
      fbDraftA: fbDraftA.id, fbPublishedA: fbPublishedA.id, fbAddendumA: fbAddendumA.id,
    },
  };
  process.stderr.write(`\n${JSON.stringify(summary, null, 2)}\n\nFIXTURES READY\n`);
  await db.$disconnect();
  return summary;
}

main().catch(async (e) => {
  console.error(e);
  try { await db.$disconnect(); } catch {}
  process.exit(1);
});
