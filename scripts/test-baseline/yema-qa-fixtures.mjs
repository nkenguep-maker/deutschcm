// P4.5-QA · fixtures P-1 protégées `test_yema_qa_`.
//
// Crée les 5 personas + les données minimales pour la console QA · 1 centre,
// 1 classroom Monde, 1 assignment PUBLISHED, 1 submission DRAFT, 1
// submission SUBMITTED, 1 feedback PUBLISHED, 1 enrollment actif.
//
// Idempotent · réutilise les upsert existants. Refuse toute cible non-P-1
// via `assertNonProduction`.

import { assertNonProduction, getTestPassword } from "./_common.mjs";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

assertNonProduction();
const PASSWORD = getTestPassword();

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
  log: ["error"],
});

const PREFIX = "test_yema_qa_";
// student_monde et student_racines · profils/parcours distincts (LP MONDE
// DEUTSCH vs LP RACINES WOLOF onboarded) · aucun mélange.
const PERSONAS = [
  { label: "super_admin",     email: `${PREFIX}super_admin@example.com`,     role: "ADMIN",   appRole: "YEMA_ADMIN" },
  { label: "teacher",         email: `${PREFIX}teacher@example.com`,         role: "TEACHER", appRole: null },
  { label: "coach",           email: `${PREFIX}coach@example.com`,           role: "STUDENT", appRole: "RACINES_COACH" },
  { label: "center_admin",    email: `${PREFIX}center_admin@example.com`,    role: "CENTER",  appRole: "CENTER_ADMIN" },
  { label: "student_monde",   email: `${PREFIX}student_monde@example.com`,   role: "STUDENT", appRole: "LEARNER" },
  { label: "student_racines", email: `${PREFIX}student_racines@example.com`, role: "STUDENT", appRole: "LEARNER" },
];

async function listAllAuthMatching(prefix) {
  const out = new Map();
  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ perPage: 200, page });
    if (error) throw new Error(`listUsers: ${error.message}`);
    for (const u of data.users) if (u.email?.includes(prefix)) out.set(u.email.toLowerCase(), u);
    if (!data.users.length || data.users.length < 200) break;
    page += 1;
  }
  return out;
}

async function ensureAuthUser(email, existingMap) {
  const existing = existingMap.get(email.toLowerCase());
  if (existing) return { user: existing, created: false };
  const { data, error } = await admin.auth.admin.createUser({
    email, password: PASSWORD, email_confirm: true,
    user_metadata: { fixture: "TEST_YEMA_QA", label: email.split("@")[0] },
  });
  if (error) throw new Error(`createUser ${email}: ${error.message}`);
  return { user: data.user, created: true };
}

async function syncMetadata(supabaseId, appRole) {
  // Le proxy filtre roles[] via SpaceRole ∈ {STUDENT, TEACHER, CENTER, ADMIN}.
  // On mappe appRole (LEARNER/RACINES_COACH/CENTER_ADMIN/YEMA_ADMIN) →
  // SpaceRole équivalent · sans ce mapping, les personas non-teacher se
  // retrouvaient tous sur /setup-role.
  const activeSpace = appRole === "CENTER_ADMIN" ? "CENTER"
    : appRole === "YEMA_ADMIN" ? "ADMIN"
    : appRole === "RACINES_COACH" ? "STUDENT"
    : appRole === "LEARNER" ? "STUDENT"
    : "TEACHER";
  const rolesList = [activeSpace];
  const onboardedMap = { [activeSpace]: true };
  const { data } = await admin.auth.admin.getUserById(supabaseId);
  const existing = data?.user?.user_metadata ?? {};
  await admin.auth.admin.updateUserById(supabaseId, {
    user_metadata: {
      ...existing, roles: rolesList,
      onboarded_map: onboardedMap, active_space: activeSpace, fixture: "TEST_YEMA_QA",
    },
  });
}

async function ensureDbUser(supabaseId, email, role) {
  return db.user.upsert({
    where: { email },
    update: { supabaseId, role, fullName: `TEST QA ${email.split("@")[0]}`, onboardingDone: true },
    create: {
      supabaseId, email, role,
      fullName: `TEST QA ${email.split("@")[0]}`, onboardingDone: true,
    },
  });
}

async function ensureAppRole(userId, appRole) {
  if (!appRole) return;
  await db.userAppRole.upsert({
    where: { userId_role: { userId, role: appRole } },
    update: {}, create: { userId, role: appRole },
  });
}

async function main() {
  process.stderr.write("═══ YEMA QA fixtures P-1 ═══\n\n");
  const existing = await listAllAuthMatching(PREFIX);
  const created = {};
  for (const p of PERSONAS) {
    const { user } = await ensureAuthUser(p.email, existing);
    await syncMetadata(user.id, p.appRole);
    const dbUser = await ensureDbUser(user.id, p.email, p.role);
    if (p.appRole) await ensureAppRole(dbUser.id, p.appRole);
    created[p.label] = { email: p.email, authUuid: user.id, dbId: dbUser.id, role: p.role };
  }

  // Teacher binding · une row Teacher.
  const teacherUser = created.teacher;
  const teacherRow = await db.teacher.upsert({
    where: { id: `${PREFIX}teacher_bind` },
    update: {},
    create: { id: `${PREFIX}teacher_bind`, userId: teacherUser.dbId },
  });

  // Classroom Monde QA + enrollment étudiant.
  const classroom = await db.classroom.upsert({
    where: { id: `${PREFIX}classroom` },
    update: {},
    create: {
      id: `${PREFIX}classroom`,
      name: "QA Klasse Monde",
      teacherId: teacherRow.id,
      level: "A1",
      code: "QA-KLASSE-01",
    },
  });
  await db.classroomEnrollment.upsert({
    where: { classroomId_userId: { classroomId: classroom.id, userId: created.student_monde.dbId } },
    update: { isActive: true },
    create: { classroomId: classroom.id, userId: created.student_monde.dbId, isActive: true },
  });

  // 1 assignment PUBLISHED.
  const now = new Date();
  const asm = await db.assignment.upsert({
    where: { id: `${PREFIX}assignment_pub` },
    update: {},
    create: {
      id: `${PREFIX}assignment_pub`,
      classroom: { connect: { id: classroom.id } },
      title: "QA · Devoir de test",
      type: "WRITTEN", status: "PUBLISHED", publishedAt: now,
      createdByTeacher: { connect: { id: teacherRow.id } },
    },
  });

  // 1 submission DRAFT + 1 SUBMITTED (par le Student).
  const subDraft = await db.assignmentSubmission.upsert({
    where: { id: `${PREFIX}submission_draft` },
    update: {},
    create: {
      id: `${PREFIX}submission_draft`,
      assignment: { connect: { id: asm.id } },
      user: { connect: { id: created.student_monde.dbId } },
      writtenContent: "QA · brouillon en cours",
      status: "DRAFT", version: 1,
    },
  });
  const subSubmitted = await db.assignmentSubmission.upsert({
    where: { id: `${PREFIX}submission_submitted` },
    update: {},
    create: {
      id: `${PREFIX}submission_submitted`,
      assignment: { connect: { id: asm.id } },
      user: { connect: { id: created.student_monde.dbId } },
      writtenContent: "QA · travail finalisé",
      status: "SUBMITTED", version: 2, submittedAt: now,
    },
  });

  // 1 feedback PUBLISHED sur la submission SUBMITTED.
  const fb = await db.assignmentFeedback.upsert({
    where: { id: `${PREFIX}feedback_pub` },
    update: {},
    create: {
      id: `${PREFIX}feedback_pub`,
      submission: { connect: { id: subSubmitted.id } },
      authorTeacher: { connect: { id: teacherRow.id } },
      status: "PUBLISHED", version: 1, writtenContent: "QA · bien !", publishedAt: now,
    },
  });

  // ─── Learning paths distincts Monde vs Racines ─────────────────────
  // student_monde · LP MONDE DEUTSCH A1 · rend <DashboardMonde />
  await db.learningPath.upsert({
    where: { id: `${PREFIX}lp_monde` },
    update: {},
    create: {
      id: `${PREFIX}lp_monde`,
      user: { connect: { id: created.student_monde.dbId } },
      universe: "MONDE", language: "DEUTSCH", currentLevel: "A1",
      status: "ACTIVE",
      onboardingAnswers: { why: "study", startPoint: "beginner",
        selfAssessmentAnswer: 2, declaredLevel: "A1", recommendedLevel: "A1" },
    },
  });
  // Marquer universe côté metadata pour cohérence proxy/pages.
  {
    const { data } = await admin.auth.admin.getUserById(created.student_monde.authUuid);
    const existing = data?.user?.user_metadata ?? {};
    await admin.auth.admin.updateUserById(created.student_monde.authUuid, {
      user_metadata: { ...existing, universe: "monde", activeLanguage: "deutsch" },
    });
  }

  // student_racines · LP RACINES WOLOF · rend <DashboardRacines />
  await db.learningPath.upsert({
    where: { id: `${PREFIX}lp_racines` },
    update: {},
    create: {
      id: `${PREFIX}lp_racines`,
      user: { connect: { id: created.student_racines.dbId } },
      universe: "RACINES", language: "WOLOF",
      status: "ACTIVE",
      onboardingAnswers: { link: "family_words", startPoint: "some_basics" },
    },
  });
  {
    const { data } = await admin.auth.admin.getUserById(created.student_racines.authUuid);
    const existing = data?.user?.user_metadata ?? {};
    await admin.auth.admin.updateUserById(created.student_racines.authUuid, {
      user_metadata: { ...existing, universe: "racines", activeLanguage: "wolof", plan: "racines-solo" },
    });
  }

  const summary = {
    personas: Object.fromEntries(
      Object.entries(created).map(([k, v]) => [k, { email: v.email, role: v.role }]),
    ),
    data: {
      classroom: classroom.id, assignment: asm.id,
      submissionDraft: subDraft.id, submissionSubmitted: subSubmitted.id,
      feedbackPublished: fb.id,
    },
  };
  process.stderr.write(`\n${JSON.stringify(summary, null, 2)}\n\nQA FIXTURES READY\n`);
  await db.$disconnect();
  return summary;
}

main().catch(async (e) => {
  console.error(e);
  try { await db.$disconnect(); } catch {}
  process.exit(1);
});
