// P4.5-B2b2a Gate 0 · tests JWT/PostgREST authenticated direct étendus.
//
// Couvre les 3 tables (assignments, assignment_submissions,
// assignment_feedbacks) sur toutes les colonnes de scope + DELETE +
// cross-tenant A/B + rôles négatifs (Anonymous, Center admin, Racines
// Coach, YEMA admin sans binding). Prouve que le seul chemin de mutation
// autorisé est le seam Prisma service_role.
//
// Sécurité · uniquement P-1 via assertNonProduction. Cleanup complet.

import { assertNonProduction } from "./_common.mjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

assertNonProduction();
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
  log: ["error"],
});

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE || !SUPABASE_ANON) {
  console.error("SUPABASE env vars missing");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PREFIX = "test_p4_5_b_jwt_";
const PASSWORD = crypto.randomBytes(16).toString("base64").replaceAll("/", "0").replaceAll("+", "1") + "Aa1!";
const authUserIds = []; // For Supabase Auth cleanup.

const results = [];
function log(label, obj) {
  results.push({ label, ...obj });
  process.stderr.write(`  ${label} · ${JSON.stringify(obj)}\n`);
}

async function purgeDb() {
  await db.assignmentFeedback.deleteMany({ where: { id: { startsWith: PREFIX } } });
  await db.assignmentSubmission.deleteMany({ where: { id: { startsWith: PREFIX } } });
  await db.assignment.deleteMany({ where: { id: { startsWith: PREFIX } } });
  await db.classroomEnrollment.deleteMany({ where: { classroomId: { startsWith: PREFIX } } });
  await db.classroom.deleteMany({ where: { id: { startsWith: PREFIX } } });
  await db.teacher.deleteMany({ where: { id: { startsWith: PREFIX } } });
  await db.userAppRole.deleteMany({ where: { userId: { startsWith: PREFIX } } });
  await db.storageObject.deleteMany({ where: { id: { startsWith: PREFIX } } });
  await db.auditEvent.deleteMany({
    where: {
      OR: [
        { targetId: { startsWith: PREFIX } },
        { scopeId: { startsWith: PREFIX } },
      ],
    },
  });
  await db.user.deleteMany({ where: { email: { contains: PREFIX } } });
}
async function purgeAuth() {
  for (const uid of authUserIds) {
    await admin.auth.admin.deleteUser(uid).catch(() => {});
  }
  authUserIds.length = 0;
  // Nettoyage défensif · tout Auth user avec PREFIX dans email.
  try {
    const { data } = await admin.auth.admin.listUsers();
    for (const u of data?.users ?? []) {
      if (u.email?.includes(PREFIX)) await admin.auth.admin.deleteUser(u.id).catch(() => {});
    }
  } catch {}
}

async function createSupabaseUser(emailSuffix) {
  const email = `${PREFIX}${emailSuffix}_${Date.now()}${Math.random().toString().slice(2, 6)}@example.com`;
  const { data, error } = await admin.auth.admin.createUser({
    email, password: PASSWORD, email_confirm: true,
  });
  if (error) throw error;
  authUserIds.push(data.user.id);
  return { email, supabaseId: data.user.id };
}

async function signInClient(email) {
  const anon = createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await anon.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw error;
  return createClient(SUPABASE_URL, SUPABASE_ANON, {
    global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function main() {
  process.stderr.write("═══ P4.5-B2b2a Gate 0 · JWT/PostgREST authenticated tests ═══\n\n");
  await purgeDb();
  await purgeAuth();

  // ── Setup fixtures A/B + rôles négatifs ─────────────────────────────
  const supabaseA = await createSupabaseUser("teacher_a");
  const supabaseB = await createSupabaseUser("teacher_b");
  const supabaseSA = await createSupabaseUser("student_a");
  const supabaseSB = await createSupabaseUser("student_b");
  const supabaseCenter = await createSupabaseUser("center_admin");
  const supabaseCoach = await createSupabaseUser("roots_coach");
  const supabaseYema = await createSupabaseUser("yema_admin_no_bind");

  const teacherAUser = await db.user.create({
    data: {
      id: `${PREFIX}teacher_a_user`, email: supabaseA.email,
      supabaseId: supabaseA.supabaseId, role: "TEACHER",
      fullName: "T", onboardingDone: true,
    },
  });
  const teacherBUser = await db.user.create({
    data: {
      id: `${PREFIX}teacher_b_user`, email: supabaseB.email,
      supabaseId: supabaseB.supabaseId, role: "TEACHER",
      fullName: "T", onboardingDone: true,
    },
  });
  const studentAUser = await db.user.create({
    data: {
      id: `${PREFIX}student_a_user`, email: supabaseSA.email,
      supabaseId: supabaseSA.supabaseId, role: "STUDENT",
      fullName: "S", onboardingDone: true,
    },
  });
  const studentBUser = await db.user.create({
    data: {
      id: `${PREFIX}student_b_user`, email: supabaseSB.email,
      supabaseId: supabaseSB.supabaseId, role: "STUDENT",
      fullName: "S", onboardingDone: true,
    },
  });
  await db.user.create({
    data: {
      id: `${PREFIX}center_admin_user`, email: supabaseCenter.email,
      supabaseId: supabaseCenter.supabaseId, role: "ADMIN",
      fullName: "CA", onboardingDone: true,
    },
  });
  const rootsCoachUser = await db.user.create({
    data: {
      id: `${PREFIX}roots_coach_user`, email: supabaseCoach.email,
      supabaseId: supabaseCoach.supabaseId, role: "STUDENT",
      fullName: "RC", onboardingDone: true,
    },
  });
  await db.userAppRole.create({ data: { userId: rootsCoachUser.id, role: "RACINES_COACH" } });
  const yemaAdminUser = await db.user.create({
    data: {
      id: `${PREFIX}yema_no_bind_user`, email: supabaseYema.email,
      supabaseId: supabaseYema.supabaseId, role: "STUDENT",
      fullName: "Y", onboardingDone: true,
    },
  });
  await db.userAppRole.create({ data: { userId: yemaAdminUser.id, role: "YEMA_ADMIN" } });

  const teacherA = await db.teacher.create({ data: { id: `${PREFIX}teacher_a`, userId: teacherAUser.id } });
  const teacherB = await db.teacher.create({ data: { id: `${PREFIX}teacher_b`, userId: teacherBUser.id } });
  const classroomA = await db.classroom.create({
    data: { id: `${PREFIX}classroom_a`, name: "A", teacherId: teacherA.id, level: "A1", code: `A${Date.now()}` },
  });
  const classroomB = await db.classroom.create({
    data: { id: `${PREFIX}classroom_b`, name: "B", teacherId: teacherB.id, level: "A1", code: `B${Date.now()}` },
  });
  await db.classroomEnrollment.create({ data: { classroomId: classroomA.id, userId: studentAUser.id, isActive: true } });
  await db.classroomEnrollment.create({ data: { classroomId: classroomB.id, userId: studentBUser.id, isActive: true } });

  const asmDraftA = await db.assignment.create({
    data: {
      id: `${PREFIX}asm_a_draft`,
      classroom: { connect: { id: classroomA.id } },
      title: "Draft A", type: "WRITTEN", status: "DRAFT",
      createdByTeacher: { connect: { id: teacherA.id } },
    },
  });
  const asmPubA = await db.assignment.create({
    data: {
      id: `${PREFIX}asm_a_pub`,
      classroom: { connect: { id: classroomA.id } },
      title: "Pub A", type: "WRITTEN", status: "PUBLISHED", publishedAt: new Date(),
      createdByTeacher: { connect: { id: teacherA.id } },
    },
  });
  // Sub A DRAFT sur un assignment différent (asmDraftA reste DRAFT côté
  // teacher · student peut avoir un DRAFT sur asmPubA). Mais pour tester
  // §2 UPDATE storageObjectId, on utilise un subDraftA sur asmDraftA
  // (l'assignment DRAFT). Nope, submission ne peut pas exister sur DRAFT
  // assignment · le service refuse. Solution · on prépare subDraftA
  // séparément après la race §7.
  const subSubmittedA = await db.assignmentSubmission.create({
    data: {
      id: `${PREFIX}sub_a_submitted`,
      assignment: { connect: { id: asmPubA.id } },
      user: { connect: { id: studentAUser.id } },
      writtenContent: "final A", status: "SUBMITTED", version: 1,
      submittedAt: new Date(),
    },
  });
  // Pour §2 UPDATE tests · créer un DRAFT sur un autre assignment.
  const asmPubA2 = await db.assignment.create({
    data: {
      id: `${PREFIX}asm_a_pub2`,
      classroom: { connect: { id: classroomA.id } },
      title: "Pub A2", type: "WRITTEN", status: "PUBLISHED", publishedAt: new Date(),
      createdByTeacher: { connect: { id: teacherA.id } },
    },
  });
  const subDraftA = await db.assignmentSubmission.create({
    data: {
      id: `${PREFIX}sub_a_draft`,
      assignment: { connect: { id: asmPubA2.id } },
      user: { connect: { id: studentAUser.id } },
      writtenContent: "brouillon A", status: "DRAFT", version: 1,
    },
  });
  const fbDraftA = await db.assignmentFeedback.create({
    data: {
      id: `${PREFIX}fb_a_draft`,
      submission: { connect: { id: subSubmittedA.id } },
      authorTeacher: { connect: { id: teacherA.id } },
      status: "DRAFT", version: 1, writtenContent: "brouillon fb A",
    },
  });
  const storageObj = await db.storageObject.create({
    data: {
      id: `${PREFIX}so_1`, bucket: "submission-audio",
      path: `${PREFIX}path_1`, purpose: "SUBMISSION_AUDIO",
      mimeType: "audio/webm", sizeBytes: 1000,
    },
  });

  const teacherAClient = await signInClient(supabaseA.email);
  const teacherBClient = await signInClient(supabaseB.email);
  const studentAClient = await signInClient(supabaseSA.email);
  const studentBClient = await signInClient(supabaseSB.email);
  const centerClient = await signInClient(supabaseCenter.email);
  const coachClient = await signInClient(supabaseCoach.email);
  const yemaClient = await signInClient(supabaseYema.email);
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  async function tryUpdate(client, table, patch, id, checkField, expectedValue) {
    const { data, error, status } = await client
      .from(table).update(patch).eq("id", id).select();
    const row = await db.$queryRawUnsafe(
      `SELECT "${checkField}" AS f FROM public.${table} WHERE id = $1`, id,
    );
    const currentValue = row[0]?.f;
    return {
      httpStatus: status,
      hadError: !!error,
      rowsAffected: data?.length ?? 0,
      currentValue,
      unchanged: currentValue === expectedValue || (currentValue == null && expectedValue == null),
      errorHint: error?.message?.slice(0, 60),
    };
  }
  async function tryDelete(client, table, id) {
    const { data, error, status } = await client.from(table).delete().eq("id", id).select();
    const row = await db.$queryRawUnsafe(
      `SELECT id FROM public.${table} WHERE id = $1`, id,
    );
    return {
      httpStatus: status, hadError: !!error, rowsAffected: data?.length ?? 0,
      stillExists: row.length === 1,
      errorHint: error?.message?.slice(0, 60),
    };
  }

  // ── §1 · Assignment (Teacher A own row) ─────────────────────────────
  process.stderr.write("\n─── §1 · Assignment (Teacher A own) ───\n");
  log("§1 · UPDATE assignments.status DRAFT → PUBLISHED",
    await tryUpdate(teacherAClient, "assignments", { status: "PUBLISHED" }, asmDraftA.id, "status", "DRAFT"));
  log("§1 · UPDATE assignments.classroomId",
    await tryUpdate(teacherAClient, "assignments", { classroomId: classroomB.id }, asmDraftA.id, "classroomId", classroomA.id));
  log("§1 · UPDATE assignments.createdByTeacherId",
    await tryUpdate(teacherAClient, "assignments", { createdByTeacherId: teacherB.id }, asmDraftA.id, "createdByTeacherId", teacherA.id));
  log("§1 · DELETE assignments",
    await tryDelete(teacherAClient, "assignments", asmDraftA.id));

  // ── §2 · AssignmentSubmission (Student A own row) ───────────────────
  process.stderr.write("\n─── §2 · AssignmentSubmission (Student A own) ───\n");
  log("§2 · UPDATE assignment_submissions.status DRAFT → SUBMITTED",
    await tryUpdate(studentAClient, "assignment_submissions", { status: "SUBMITTED" }, subDraftA.id, "status", "DRAFT"));
  log("§2 · UPDATE assignment_submissions.assignmentId",
    await tryUpdate(studentAClient, "assignment_submissions", { assignmentId: asmDraftA.id }, subDraftA.id, "assignmentId", asmPubA.id));
  log("§2 · UPDATE assignment_submissions.userId",
    await tryUpdate(studentAClient, "assignment_submissions", { userId: studentBUser.id }, subDraftA.id, "userId", studentAUser.id));
  log("§2 · UPDATE assignment_submissions.version",
    await tryUpdate(studentAClient, "assignment_submissions", { version: 999 }, subDraftA.id, "version", 1));
  log("§2 · UPDATE assignment_submissions.storageObjectId (NULL → valeur)",
    await tryUpdate(studentAClient, "assignment_submissions", { storageObjectId: storageObj.id }, subDraftA.id, "storageObjectId", null));
  log("§2 · DELETE assignment_submissions",
    await tryDelete(studentAClient, "assignment_submissions", subDraftA.id));

  // ── §3 · AssignmentFeedback (Teacher A own row) ─────────────────────
  process.stderr.write("\n─── §3 · AssignmentFeedback (Teacher A own) ───\n");
  log("§3 · UPDATE assignment_feedbacks.status DRAFT → PUBLISHED",
    await tryUpdate(teacherAClient, "assignment_feedbacks", { status: "PUBLISHED" }, fbDraftA.id, "status", "DRAFT"));
  log("§3 · UPDATE assignment_feedbacks.submissionId",
    await tryUpdate(teacherAClient, "assignment_feedbacks", { submissionId: subDraftA.id }, fbDraftA.id, "submissionId", subSubmittedA.id));
  log("§3 · UPDATE assignment_feedbacks.authorTeacherId",
    await tryUpdate(teacherAClient, "assignment_feedbacks", { authorTeacherId: teacherB.id }, fbDraftA.id, "authorTeacherId", teacherA.id));
  log("§3 · UPDATE assignment_feedbacks.version",
    await tryUpdate(teacherAClient, "assignment_feedbacks", { version: 999 }, fbDraftA.id, "version", 1));
  log("§3 · UPDATE assignment_feedbacks.supersedesFeedbackId",
    await tryUpdate(teacherAClient, "assignment_feedbacks", { supersedesFeedbackId: fbDraftA.id }, fbDraftA.id, "supersedesFeedbackId", null));
  log("§3 · UPDATE assignment_feedbacks.storageObjectId (NULL → valeur)",
    await tryUpdate(teacherAClient, "assignment_feedbacks", { storageObjectId: storageObj.id }, fbDraftA.id, "storageObjectId", null));
  log("§3 · DELETE assignment_feedbacks",
    await tryDelete(teacherAClient, "assignment_feedbacks", fbDraftA.id));

  // ── §4 · Cross-tenant Teacher B on A ────────────────────────────────
  process.stderr.write("\n─── §4 · cross-tenant Teacher B on A ───\n");
  {
    const { data, error } = await teacherBClient.from("assignments").select().eq("id", asmDraftA.id);
    log("§4 · Teacher B SELECT Assignment A", { rows: data?.length ?? 0, hadError: !!error });
  }
  log("§4 · Teacher B UPDATE Assignment A (title)",
    await tryUpdate(teacherBClient, "assignments", { title: "TAMPERED" }, asmDraftA.id, "title", "Draft A"));
  log("§4 · Teacher B UPDATE Submission A",
    await tryUpdate(teacherBClient, "assignment_submissions", { writtenContent: "TAMPERED" }, subDraftA.id, "writtenContent", "brouillon A"));

  // ── §5 · Cross-tenant Student B on A ────────────────────────────────
  process.stderr.write("\n─── §5 · cross-tenant Student B on A ───\n");
  {
    const { data, error } = await studentBClient.from("assignment_submissions").select().eq("id", subDraftA.id);
    log("§5 · Student B SELECT Submission A", { rows: data?.length ?? 0, hadError: !!error });
  }
  log("§5 · Student B UPDATE Submission A content",
    await tryUpdate(studentBClient, "assignment_submissions", { writtenContent: "TAMPERED" }, subDraftA.id, "writtenContent", "brouillon A"));

  // ── §6 · Rôles négatifs ─────────────────────────────────────────────
  process.stderr.write("\n─── §6 · rôles négatifs ───\n");
  for (const [label, client] of [
    ["Center admin", centerClient], ["Racines Coach", coachClient],
    ["YEMA_ADMIN sans binding", yemaClient], ["Anonymous", anonClient],
  ]) {
    const { data, error } = await client.from("assignments").select().eq("id", asmPubA.id);
    log(`§6 · ${label} SELECT assignments`, {
      rows: data?.length ?? 0, hadError: !!error, errorHint: error?.message?.slice(0, 40),
    });
    log(`§6 · ${label} UPDATE assignments`,
      await tryUpdate(client, "assignments", { title: "TAMPERED" }, asmPubA.id, "title", "Pub A"));
  }

  // ── §7 · New version workflow · exactement 1 SUBMISSION_CREATED ────
  //
  // Doctrine · une nouvelle version passe par SUBMITTED→SUPERSEDED puis
  // INSERT v+1 DRAFT + SUBMISSION_CREATED audit in-tx. La contrainte
  // UNIQUE(assignmentId, userId, version) garantit qu'aucun doublon de
  // numéro de version ne peut coexister. La race concurrente aboutit à
  // "au plus 1 nouvelle version, 0 audit fantôme".
  //
  // Notes · en race pure, un P2002 (unique violation) est possible
  // AUSSI côté winner apparent car les 2 tx snapshot au même moment
  // Serializable (voir doctrine Postgres). Le contrat vraiment testé
  // ici est · 0 doublon + audit strictement lié à la ligne committée.

  process.stderr.write("\n─── §7a · new version sequential · 1 SUBMISSION_CREATED ───\n");
  const startCount = await db.auditEvent.count({
    where: { action: "SUBMISSION_CREATED", targetId: { startsWith: PREFIX } },
  });
  async function nextVersion(vid) {
    return db.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `SELECT pg_advisory_xact_lock(hashtext($1)::bigint)`,
        `${asmPubA.id}:${studentAUser.id}`,
      );
      const latest = await tx.assignmentSubmission.findFirst({
        where: { assignmentId: asmPubA.id, userId: studentAUser.id },
        orderBy: { version: "desc" }, select: { id: true, status: true, version: true },
      });
      if (latest.status !== "SUBMITTED") {
        const err = new Error("invalid_submission_transition");
        err.code = "invalid_submission_transition"; throw err;
      }
      await tx.assignmentSubmission.update({
        where: { id: latest.id, status: "SUBMITTED" },
        data: { status: "SUPERSEDED" },
      });
      const created = await tx.assignmentSubmission.create({
        data: {
          id: `${PREFIX}sub_v${latest.version + 1}_${vid}`,
          assignment: { connect: { id: asmPubA.id } },
          user: { connect: { id: studentAUser.id } },
          writtenContent: `nouvelle version v${latest.version + 1}`,
          status: "DRAFT", version: latest.version + 1,
        },
        select: { id: true, version: true },
      });
      await tx.auditEvent.create({
        data: {
          actorUserId: studentAUser.id, actorRole: "STUDENT",
          action: "SUBMISSION_CREATED",
          targetType: "AssignmentSubmission", targetId: created.id,
          scopeType: "Assignment", scopeId: asmPubA.id,
          metadata: { classroomId: classroomA.id, version: created.version, routeAction: "createSubmissionVersion" },
        },
      });
      return created;
    }, { isolationLevel: "Serializable" });
  }

  // §7a · un seul appel · doit produire exactement 1 SUBMISSION_CREATED.
  const v3 = await nextVersion("seq");
  const afterSeq = await db.auditEvent.count({
    where: { action: "SUBMISSION_CREATED", targetId: { startsWith: PREFIX } },
  });
  log("§7a · sequential · exactement 1 SUBMISSION_CREATED", {
    startCount, afterSeq, delta: afterSeq - startCount, createdVersion: v3.version,
    expectedExactlyOne: (afterSeq - startCount) === 1,
  });

  // §7b · race concurrente · 0 doublon version, 0 audit fantôme.
  process.stderr.write("\n─── §7b · race concurrente · 0 doublon / 0 audit fantôme ───\n");
  // Setup · repasser v3 à SUBMITTED pour permettre une nouvelle race.
  await db.assignmentSubmission.update({
    where: { id: v3.id }, data: { status: "SUBMITTED", submittedAt: new Date() },
  });
  const beforeRace = await db.auditEvent.count({
    where: { action: "SUBMISSION_CREATED", targetId: { startsWith: PREFIX } },
  });
  const [rv1, rv2] = await Promise.allSettled([nextVersion("race1"), nextVersion("race2")]);
  const successes = [rv1, rv2].filter((r) => r.status === "fulfilled").length;
  const rejectedCodes = [rv1, rv2]
    .filter((r) => r.status === "rejected")
    .map((r) => r.reason?.code ?? r.reason?.message?.slice(0, 40));
  const afterRace = await db.auditEvent.count({
    where: { action: "SUBMISSION_CREATED", targetId: { startsWith: PREFIX } },
  });
  const versions = await db.assignmentSubmission.findMany({
    where: { assignmentId: asmPubA.id, userId: studentAUser.id },
    select: { version: true, status: true }, orderBy: { version: "asc" },
  });
  const noDoubleVersion = new Set(versions.map((v) => v.version)).size === versions.length;
  const noPhantomAudit = (afterRace - beforeRace) === successes;
  log("§7b · race · aucun doublon + audit strictement lié aux commits", {
    beforeRace, afterRace, delta: afterRace - beforeRace, successes,
    rejectedCodes, versions, noDoubleVersion, noPhantomAudit,
  });

  // ── §8 · service_role seam DRAFT → PUBLISHED (contrôle positif) ────
  process.stderr.write("\n─── §8 · service_role seam autorisé ───\n");
  await db.$transaction(async (tx) => {
    await tx.assignment.update({
      where: { id: asmDraftA.id, status: "DRAFT" },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    });
    await tx.auditEvent.create({
      data: {
        actorUserId: teacherAUser.id, actorRole: "TEACHER",
        action: "ASSIGNMENT_PUBLISHED",
        targetType: "Assignment", targetId: asmDraftA.id,
        scopeType: "Classroom", scopeId: classroomA.id,
        metadata: { teacherId: teacherA.id, routeAction: "publishAssignment" },
      },
    });
  }, { isolationLevel: "Serializable" });
  const finalStatus = (await db.assignment.findUnique({
    where: { id: asmDraftA.id }, select: { status: true },
  })).status;
  log("§8 · service_role · DRAFT → PUBLISHED via seam Prisma+tx+audit", {
    finalStatus, expectedPUBLISHED: finalStatus === "PUBLISHED",
  });

  // ── Cleanup ─────────────────────────────────────────────────────────
  await purgeDb();
  await purgeAuth();
  const [users, classrooms, assignments, submissions, feedbacks, storage, audits] = await Promise.all([
    db.user.count({ where: { email: { contains: PREFIX } } }),
    db.classroom.count({ where: { id: { startsWith: PREFIX } } }),
    db.assignment.count({ where: { id: { startsWith: PREFIX } } }),
    db.assignmentSubmission.count({ where: { id: { startsWith: PREFIX } } }),
    db.assignmentFeedback.count({ where: { id: { startsWith: PREFIX } } }),
    db.storageObject.count({ where: { id: { startsWith: PREFIX } } }),
    db.auditEvent.count({ where: { targetId: { startsWith: PREFIX } } }),
  ]);
  const total = users + classrooms + assignments + submissions + feedbacks + storage + audits;
  log("cleanup · residual fixtures (all expect 0)", {
    users, classrooms, assignments, submissions, feedbacks, storage, audits, total,
  });
  if (total === 0) process.stderr.write("\nBASELINE DATA CLEANED\n");
  else process.stderr.write("\nCLEANUP FAILED · residual fixtures detected\n");

  await db.$disconnect();

  const { writeFile, mkdir } = await import("node:fs/promises");
  await mkdir("/tmp/p4-5-b-captures", { recursive: true });
  await writeFile("/tmp/p4-5-b-captures/jwt-rls.json", JSON.stringify(results, null, 2));
  process.stderr.write(`\nWritten /tmp/p4-5-b-captures/jwt-rls.json\n`);
}

main().catch(async (e) => {
  console.error(e);
  try { await purgeAuth(); await db.$disconnect(); } catch {}
  process.exit(1);
});
