// P4.3b · Fixtures Teacher · deux centres A + B, deux Teachers, classes
// disjointes, étudiants séparés, cas ambigüité et zéro binding.
// Idempotent · P-1 uniquement (garde `_common.mjs`).

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { assertNonProduction, getTestPassword } from "./_common.mjs";

const MODE = process.argv[2];
if (!["seed", "clean", "list"].includes(MODE)) {
  console.error("Usage · node scripts/test-baseline/p4-3b-fixtures.mjs <seed|clean|list>");
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

const CENTER_A = "test_p4_3b_center_a";
const CENTER_B = "test_p4_3b_center_b";
const CLASS_A1 = "test_p4_3b_class_a1";
const CLASS_A2 = "test_p4_3b_class_a2";
const CLASS_B1 = "test_p4_3b_class_b1";

const EMAILS = {
  teacherA:    "paul+p4_3b_teacher_a@example.com",
  teacherB:    "paul+p4_3b_teacher_b@example.com",
  teacherAmbig:"paul+p4_3b_teacher_ambig@example.com",
  teacherZero: "paul+p4_3b_teacher_zero@example.com",
  centerAdmin: "paul+p4_3b_center_admin@example.com",
  studentA1:   "paul+p4_3b_student_a1@example.com",
  studentA2:   "paul+p4_3b_student_a2@example.com",
  studentB1:   "paul+p4_3b_student_b1@example.com",
  studentRemoved: "paul+p4_3b_student_removed@example.com",
  racinesCoach:"paul+p4_3b_racines_coach@example.com",
};

async function ensureAuth(email, fullName) {
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 500 });
  let a = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!a) {
    const { data } = await admin.auth.admin.createUser({
      email, password: PW, email_confirm: true,
      user_metadata: { fixture: "TEST_P4_3B", full_name: fullName },
    });
    a = data.user;
  }
  return a;
}

async function ensureDbUser(supabaseId, email, fullName, role = "STUDENT") {
  return db.user.upsert({
    where: { email },
    update: { supabaseId, fullName, role, onboardingDone: true },
    create: { supabaseId, email, fullName, role, onboardingDone: true },
  });
}

async function ensureAppRole(userId, role) {
  await db.userAppRole.upsert({
    where: { userId_role: { userId, role } },
    update: {},
    create: { userId, role },
  });
}

async function syncMeta(supabaseId, role) {
  const { data } = await admin.auth.admin.getUserById(supabaseId);
  const existing = data?.user?.user_metadata ?? {};
  await admin.auth.admin.updateUserById(supabaseId, {
    user_metadata: {
      ...existing,
      roles: [role],
      onboarded_map: { [role]: true },
      active_space: role,
    },
  });
}

async function ensureCenter(id, name, city, code) {
  const ex = await db.languageCenter.findFirst({ where: { id } });
  if (ex) return db.languageCenter.update({ where: { id }, data: { name, city } });
  return db.languageCenter.create({
    data: { id, name, city, country: "CM", plan: "starter", isVerified: true, code },
  });
}

async function ensureTeacher(userId, centerId) {
  const ex = await db.teacher.findFirst({ where: { userId } });
  if (ex) return db.teacher.update({ where: { id: ex.id }, data: { centerId, isVerified: true } });
  return db.teacher.create({
    data: {
      userId, centerId, bio: "TEST P4.3b fixture", isVerified: true,
      speciality: ["Grammaire"], languages: ["DEUTSCH"], certifications: [],
      maxStudents: 20,
    },
  });
}

async function ensureClassroom(id, name, teacherId, centerId, level = "A1") {
  const ex = await db.classroom.findFirst({ where: { id } });
  if (ex) return db.classroom.update({
    where: { id }, data: { name, teacherId, centerId, level, isActive: true },
  });
  return db.classroom.create({
    data: {
      id, name, teacherId, centerId, level,
      maxStudents: 20, isActive: true, code: id.slice(-6).toUpperCase(),
    },
  });
}

async function ensureEnrollment(classroomId, userId, isActive = true) {
  const ex = await db.classroomEnrollment.findFirst({
    where: { classroomId, userId },
  });
  if (ex) return db.classroomEnrollment.update({
    where: { id: ex.id }, data: { isActive },
  });
  return db.classroomEnrollment.create({
    data: { classroomId, userId, isActive },
  });
}

async function seed() {
  console.log("═══ P4.3b · seed ═══");
  const [teacherAAuth, teacherBAuth, teacherAmbigAuth, teacherZeroAuth,
         centerAdminAuth, sA1Auth, sA2Auth, sB1Auth, sRemAuth, coachAuth] =
    await Promise.all([
      ensureAuth(EMAILS.teacherA, "TEST P4.3b Teacher A"),
      ensureAuth(EMAILS.teacherB, "TEST P4.3b Teacher B"),
      ensureAuth(EMAILS.teacherAmbig, "TEST P4.3b Teacher Ambig"),
      ensureAuth(EMAILS.teacherZero, "TEST P4.3b Teacher Zero"),
      ensureAuth(EMAILS.centerAdmin, "TEST P4.3b Center Admin Only"),
      ensureAuth(EMAILS.studentA1, "TEST P4.3b Student A1"),
      ensureAuth(EMAILS.studentA2, "TEST P4.3b Student A2"),
      ensureAuth(EMAILS.studentB1, "TEST P4.3b Student B1"),
      ensureAuth(EMAILS.studentRemoved, "TEST P4.3b Student Removed"),
      ensureAuth(EMAILS.racinesCoach, "TEST P4.3b Racines Coach"),
    ]);

  const [teacherA, teacherB, teacherAmbig, teacherZero, centerAdmin,
         sA1, sA2, sB1, sRem, coach] = await Promise.all([
    ensureDbUser(teacherAAuth.id, EMAILS.teacherA, "TEST P4.3b Teacher A", "TEACHER"),
    ensureDbUser(teacherBAuth.id, EMAILS.teacherB, "TEST P4.3b Teacher B", "TEACHER"),
    ensureDbUser(teacherAmbigAuth.id, EMAILS.teacherAmbig, "TEST P4.3b Teacher Ambig", "TEACHER"),
    // Teacher zero-binding · rôle TEACHER mais AUCUN Teacher row.
    ensureDbUser(teacherZeroAuth.id, EMAILS.teacherZero, "TEST P4.3b Teacher Zero", "TEACHER"),
    // Center admin sans rôle TEACHER · attend 403 sur endpoints Teacher.
    ensureDbUser(centerAdminAuth.id, EMAILS.centerAdmin, "TEST P4.3b Center Admin Only", "CENTER"),
    ensureDbUser(sA1Auth.id, EMAILS.studentA1, "TEST P4.3b Student A1", "STUDENT"),
    ensureDbUser(sA2Auth.id, EMAILS.studentA2, "TEST P4.3b Student A2", "STUDENT"),
    ensureDbUser(sB1Auth.id, EMAILS.studentB1, "TEST P4.3b Student B1", "STUDENT"),
    ensureDbUser(sRemAuth.id, EMAILS.studentRemoved, "TEST P4.3b Student Removed", "STUDENT"),
    ensureDbUser(coachAuth.id, EMAILS.racinesCoach, "TEST P4.3b Racines Coach", "STUDENT"),
  ]);

  await Promise.all([
    ensureAppRole(teacherA.id, "TEACHER"),
    ensureAppRole(teacherB.id, "TEACHER"),
    ensureAppRole(teacherAmbig.id, "TEACHER"),
    ensureAppRole(teacherZero.id, "TEACHER"),
    ensureAppRole(centerAdmin.id, "CENTER_ADMIN"),
    ensureAppRole(sA1.id, "LEARNER"),
    ensureAppRole(sA2.id, "LEARNER"),
    ensureAppRole(sB1.id, "LEARNER"),
    ensureAppRole(sRem.id, "LEARNER"),
    // L'enum P-1 n'a pas RACINES_COACH (migration P4.1 non appliquée) ·
    // on utilise CAREER_COACH · même invariant (non-Teacher).
    ensureAppRole(coach.id, "CAREER_COACH"),
  ]);

  // Sync user_metadata pour que le proxy ne redirige pas vers /setup-role.
  await Promise.all([
    syncMeta(teacherAAuth.id, "TEACHER"),
    syncMeta(teacherBAuth.id, "TEACHER"),
    syncMeta(teacherAmbigAuth.id, "TEACHER"),
    syncMeta(teacherZeroAuth.id, "TEACHER"),
    syncMeta(centerAdminAuth.id, "CENTER"),
    syncMeta(sA1Auth.id, "STUDENT"),
    syncMeta(sA2Auth.id, "STUDENT"),
    syncMeta(sB1Auth.id, "STUDENT"),
    syncMeta(sRemAuth.id, "STUDENT"),
    syncMeta(coachAuth.id, "STUDENT"),
  ]);

  const cA = await ensureCenter(CENTER_A, "TEST_CENTER_A_P43B", "Yaoundé", "P43B_A");
  const cB = await ensureCenter(CENTER_B, "TEST_CENTER_B_P43B", "Douala", "P43B_B");

  const [teacherAT, teacherBT] = await Promise.all([
    ensureTeacher(teacherA.id, cA.id),
    ensureTeacher(teacherB.id, cB.id),
  ]);

  // Ambigüité forcée · un premier Teacher row sur Center A + un second row
  // arbitraire sur Center B ne peut pas exister (contrainte @unique userId).
  // À la place on garde un Teacher row unique et divergent · Teacher.centerId=A
  // ET un `User.centerId=B` (colonne legacy Student sur User) · le resolver
  // Teacher ne lit pas User.centerId, mais on prépare une ambigüité côté
  // Center (pour compat cross-scope). Aucune classe ambigüe.
  await ensureTeacher(teacherAmbig.id, cA.id);
  await db.user.update({ where: { id: teacherAmbig.id }, data: { centerId: cB.id } });

  const classA1 = await ensureClassroom(CLASS_A1, "TEST_CLASS_A_1_P43B", teacherAT.id, cA.id, "A1");
  const classA2 = await ensureClassroom(CLASS_A2, "TEST_CLASS_A_2_P43B", teacherAT.id, cA.id, "A2");
  const classB1 = await ensureClassroom(CLASS_B1, "TEST_CLASS_B_1_P43B", teacherBT.id, cB.id, "B1");

  await Promise.all([
    ensureEnrollment(classA1.id, sA1.id, true),
    ensureEnrollment(classA1.id, sA2.id, true),
    ensureEnrollment(classB1.id, sB1.id, true),
    // Enrollment retiré (isActive: false) · ne doit pas apparaître dans
    // la liste des étudiants actifs de la classe A1.
    ensureEnrollment(classA1.id, sRem.id, false),
  ]);

  console.log(`  centers · A=${cA.id} B=${cB.id}`);
  console.log(`  teachers · A=${teacherAT.id} B=${teacherBT.id}`);
  console.log(`  classes · A1=${classA1.id} A2=${classA2.id} B1=${classB1.id}`);
  console.log(`  zeroBind=${teacherZero.id} ambig=${teacherAmbig.id} centerAdmin=${centerAdmin.id} coach=${coach.id}`);
  await db.$disconnect();
}

async function clean() {
  console.log("═══ P4.3b · clean ═══");
  const emails = Object.values(EMAILS);
  await db.classroomEnrollment.deleteMany({
    where: { classroomId: { startsWith: "test_p4_3b_" } },
  });
  await db.classroom.deleteMany({ where: { id: { startsWith: "test_p4_3b_" } } });
  await db.teacher.deleteMany({
    where: { user: { email: { in: emails } } },
  });
  const dbUsers = await db.user.findMany({ where: { email: { in: emails } }, select: { id: true } });
  const ids = dbUsers.map((u) => u.id);
  if (ids.length) {
    await db.userAppRole.deleteMany({ where: { userId: { in: ids } } });
    await db.userRole.deleteMany({ where: { userId: { in: ids } } });
    await db.user.deleteMany({ where: { id: { in: ids } } });
  }
  await db.languageCenter.deleteMany({ where: { id: { startsWith: "test_p4_3b_" } } });
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 500 });
  for (const email of emails) {
    const u = list.users.find((x) => x.email?.toLowerCase() === email.toLowerCase());
    if (u) await admin.auth.admin.deleteUser(u.id);
  }
  console.log(`  cleaned · ${ids.length} db users · ${emails.length} auth users · centers + classrooms`);
  await db.$disconnect();
}

async function list() {
  const centers = await db.languageCenter.findMany({
    where: { id: { startsWith: "test_p4_3b_" } },
    include: { teachers: true, classrooms: { include: { enrollments: true } } },
  });
  console.log(JSON.stringify(centers, null, 2));
  await db.$disconnect();
}

if (MODE === "seed") await seed();
else if (MODE === "clean") await clean();
else await list();
