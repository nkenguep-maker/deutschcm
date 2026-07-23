// P4.3a · Fixtures Center · deux centres A + B (cross-tenant), enseignants,
// classes, étudiants, inscription en attente. Idempotent · P-1 uniquement.

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { assertNonProduction, getTestPassword } from "./_common.mjs";

const MODE = process.argv[2];
if (!["seed", "clean", "list"].includes(MODE)) {
  console.error("Usage · node scripts/test-baseline/p4-3a-fixtures.mjs <seed|clean|list>");
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

const CENTER_A = "test_p4_3a_center_a";
const CENTER_B = "test_p4_3a_center_b";
const EMAILS = {
  adminA:    "paul+p4_3a_admin_a@example.com",
  adminB:    "paul+p4_3a_admin_b@example.com",
  teacherA:  "paul+p4_3a_teacher_a@example.com",
  teacherB:  "paul+p4_3a_teacher_b@example.com",
  studentA1: "paul+p4_3a_student_a1@example.com",
  studentA2: "paul+p4_3a_student_a2@example.com",
  studentB1: "paul+p4_3a_student_b1@example.com",
  pendingA:  "paul+p4_3a_pending_a@example.com",
  // P4.3a hardening · rôle CENTER sans binding Teacher → attend 404.
  zeroBind:  "paul+p4_3a_zerobind@example.com",
  // P4.3a hardening · rôle CENTER + Teacher.centerId=A ET User.centerId=B
  // divergents → attend 409 ambigüité.
  ambig:     "paul+p4_3a_ambig@example.com",
  // P4.3a hardening · Teacher sans rôle CENTER → attend 403.
  teacherOnlyA: "paul+p4_3a_teacher_only_a@example.com",
  // P4.3a hardening · coach Racines · attend 403 sur endpoints Center.
  racinesCoach: "paul+p4_3a_racines_coach@example.com",
};

async function ensureAuth(email, fullName) {
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
  let a = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!a) {
    const { data } = await admin.auth.admin.createUser({
      email, password: PW, email_confirm: true,
      user_metadata: { fixture: "TEST_P4_3A", full_name: fullName },
    });
    a = data.user;
  }
  return a;
}

async function ensureDbUser(supabaseId, email, fullName, role = "STUDENT") {
  // Upsert by email · résiste à un stale supabaseId (auth recréé avec nouvel
  // id · row DB conservée) et évite la race Promise.all sur create+create.
  // `onboardingDone: true` évite la redirection systématique vers
  // `/{locale}/onboarding` (bloque le parcours clavier /center).
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

/**
 * Miroir Supabase auth · user_metadata.roles / .active_space. Sans ceci,
 * le proxy redirige vers /setup-role. Simplifié · on écrit directement
 * les rôles CENTER pour les admins et STUDENT/TEACHER pour les autres.
 * Utilisé uniquement par le seed test P4.3a (P-1).
 */
async function syncMeta(supabaseId, role) {
  const rolesList = [role];
  const onboardedMap = { [role]: true };
  const { data } = await admin.auth.admin.getUserById(supabaseId);
  const existing = data?.user?.user_metadata ?? {};
  await admin.auth.admin.updateUserById(supabaseId, {
    user_metadata: {
      ...existing,
      roles: rolesList,
      onboarded_map: onboardedMap,
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
      userId, centerId, bio: "TEST P4.3a fixture", isVerified: true,
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

async function ensureEnrollment(classroomId, userId) {
  const ex = await db.classroomEnrollment.findFirst({
    where: { classroomId, userId },
  });
  if (ex) return db.classroomEnrollment.update({ where: { id: ex.id }, data: { isActive: true } });
  return db.classroomEnrollment.create({
    data: { classroomId, userId, isActive: true },
  });
}

async function ensurePending(fromUserId, toClassroomId) {
  const ex = await db.classJoinRequest.findFirst({
    where: { fromUserId, toClassroomId, status: "pending" },
  });
  if (ex) return ex;
  return db.classJoinRequest.create({
    data: { fromUserId, toClassroomId, status: "pending", message: "TEST P4.3a" },
  });
}

async function seed() {
  console.log("═══ P4.3a · seed ═══");
  const [adminAAuth, adminBAuth, teacherAAuth, teacherBAuth, sA1Auth, sA2Auth, sB1Auth, pendingAAuth,
         zeroBindAuth, ambigAuth, teacherOnlyAAuth, racinesCoachAuth] = await Promise.all([
    ensureAuth(EMAILS.adminA, "TEST P4.3a Center A Admin"),
    ensureAuth(EMAILS.adminB, "TEST P4.3a Center B Admin"),
    ensureAuth(EMAILS.teacherA, "TEST P4.3a Teacher A"),
    ensureAuth(EMAILS.teacherB, "TEST P4.3a Teacher B"),
    ensureAuth(EMAILS.studentA1, "TEST P4.3a Student A1"),
    ensureAuth(EMAILS.studentA2, "TEST P4.3a Student A2"),
    ensureAuth(EMAILS.studentB1, "TEST P4.3a Student B1"),
    ensureAuth(EMAILS.pendingA, "TEST P4.3a Pending A"),
    ensureAuth(EMAILS.zeroBind, "TEST P4.3a Zero Bind"),
    ensureAuth(EMAILS.ambig, "TEST P4.3a Ambiguous"),
    ensureAuth(EMAILS.teacherOnlyA, "TEST P4.3a Teacher Only A"),
    ensureAuth(EMAILS.racinesCoach, "TEST P4.3a Racines Coach"),
  ]);
  const [adminA, adminB, teacherA, teacherB, sA1, sA2, sB1, pendingA,
         zeroBind, ambig, teacherOnlyA, racinesCoach] = await Promise.all([
    ensureDbUser(adminAAuth.id, EMAILS.adminA, "TEST P4.3a Center A Admin", "CENTER"),
    ensureDbUser(adminBAuth.id, EMAILS.adminB, "TEST P4.3a Center B Admin", "CENTER"),
    ensureDbUser(teacherAAuth.id, EMAILS.teacherA, "TEST P4.3a Teacher A", "TEACHER"),
    ensureDbUser(teacherBAuth.id, EMAILS.teacherB, "TEST P4.3a Teacher B", "TEACHER"),
    ensureDbUser(sA1Auth.id, EMAILS.studentA1, "TEST P4.3a Student A1", "STUDENT"),
    ensureDbUser(sA2Auth.id, EMAILS.studentA2, "TEST P4.3a Student A2", "STUDENT"),
    ensureDbUser(sB1Auth.id, EMAILS.studentB1, "TEST P4.3a Student B1", "STUDENT"),
    ensureDbUser(pendingAAuth.id, EMAILS.pendingA, "TEST P4.3a Pending A", "STUDENT"),
    // Rôle CENTER mais sans Teacher rattaché → attend 404 no membership.
    ensureDbUser(zeroBindAuth.id, EMAILS.zeroBind, "TEST P4.3a Zero Bind", "CENTER"),
    // Rôle CENTER · Teacher.centerId=A · User.centerId=B (divergent) → 409.
    ensureDbUser(ambigAuth.id, EMAILS.ambig, "TEST P4.3a Ambiguous", "CENTER"),
    // Teacher standard sans rôle CENTER → attend 403 sur endpoints Center.
    ensureDbUser(teacherOnlyAAuth.id, EMAILS.teacherOnlyA, "TEST P4.3a Teacher Only A", "TEACHER"),
    // Racines coach → aucun rôle CENTER, attend 403.
    ensureDbUser(racinesCoachAuth.id, EMAILS.racinesCoach, "TEST P4.3a Racines Coach", "STUDENT"),
  ]);
  await Promise.all([
    ensureAppRole(adminA.id, "CENTER_ADMIN"),
    ensureAppRole(adminB.id, "CENTER_ADMIN"),
    ensureAppRole(teacherA.id, "TEACHER"),
    ensureAppRole(teacherB.id, "TEACHER"),
    ensureAppRole(sA1.id, "LEARNER"),
    ensureAppRole(sA2.id, "LEARNER"),
    ensureAppRole(sB1.id, "LEARNER"),
    ensureAppRole(pendingA.id, "LEARNER"),
    ensureAppRole(zeroBind.id, "CENTER_ADMIN"), // rôle OK, binding manquant
    ensureAppRole(ambig.id, "CENTER_ADMIN"),
    ensureAppRole(teacherOnlyA.id, "TEACHER"),
    // Note · l'enum DB P-1 n'a pas encore RACINES_COACH (migration P4.1
    // non appliquée) · on utilise CAREER_COACH qui teste le même invariant ·
    // rôle non-CENTER → 403 sur endpoints Center. Le smoke rapporte
    // "racinesCoach" pour la lisibilité mais le rôle applicatif est
    // CAREER_COACH.
    ensureAppRole(racinesCoach.id, "CAREER_COACH"),
  ]);

  // Sync user_metadata Supabase auth · sans ceci, le proxy redirige vers
  // /setup-role car il lit `user_metadata.roles`. Nécessaire pour le
  // parcours clavier automatisé (§5 incident closure).
  await Promise.all([
    syncMeta(adminAAuth.id, "CENTER"),
    syncMeta(adminBAuth.id, "CENTER"),
    syncMeta(teacherAAuth.id, "TEACHER"),
    syncMeta(teacherBAuth.id, "TEACHER"),
    syncMeta(sA1Auth.id, "STUDENT"),
    syncMeta(sA2Auth.id, "STUDENT"),
    syncMeta(sB1Auth.id, "STUDENT"),
    syncMeta(pendingAAuth.id, "STUDENT"),
    syncMeta(zeroBindAuth.id, "CENTER"),
    syncMeta(ambigAuth.id, "CENTER"),
    syncMeta(teacherOnlyAAuth.id, "TEACHER"),
    syncMeta(racinesCoachAuth.id, "STUDENT"),
  ]);

  const cA = await ensureCenter(CENTER_A, "TEST_CENTER_A", "Yaoundé", "P43A_A");
  const cB = await ensureCenter(CENTER_B, "TEST_CENTER_B", "Douala", "P43A_B");

  // Teacher records rattachés aux centres. Le CENTER admin doit avoir un
  // Teacher pour que le resolver le trouve (contrat V1). On rattache les
  // admins aussi.
  const [teacherAT, teacherBT, adminAT, adminBT, teacherOnlyAT, ambigT] = await Promise.all([
    ensureTeacher(teacherA.id, cA.id),
    ensureTeacher(teacherB.id, cB.id),
    ensureTeacher(adminA.id, cA.id),
    ensureTeacher(adminB.id, cB.id),
    // Teacher standard rattaché à A (mais sans rôle CENTER · attend 403).
    ensureTeacher(teacherOnlyA.id, cA.id),
    // Ambigüité forcée · Teacher pointe A, mais legacy `User.centerId` = B.
    ensureTeacher(ambig.id, cA.id),
  ]);
  void adminAT; void adminBT; void teacherOnlyAT;
  await db.user.update({ where: { id: ambig.id }, data: { centerId: cB.id } });
  void ambigT;

  const classA1 = await ensureClassroom("test_p4_3a_class_a1", "TEST_CLASS_A_1", teacherAT.id, cA.id, "A1");
  const classB1 = await ensureClassroom("test_p4_3a_class_b1", "TEST_CLASS_B_1", teacherBT.id, cB.id, "B1");

  await Promise.all([
    ensureEnrollment(classA1.id, sA1.id),
    ensureEnrollment(classA1.id, sA2.id),
    ensureEnrollment(classB1.id, sB1.id),
  ]);
  await ensurePending(pendingA.id, classA1.id);

  console.log(`  centers · A=${cA.id} B=${cB.id}`);
  console.log(`  admins · adminA=${adminA.id} adminB=${adminB.id}`);
  console.log(`  classes · A1=${classA1.id} B1=${classB1.id}`);
  console.log(`  zeroBind=${zeroBind.id} ambig=${ambig.id} teacherOnlyA=${teacherOnlyA.id} racinesCoach=${racinesCoach.id}`);
  await db.$disconnect();
}

async function clean() {
  console.log("═══ P4.3a · clean ═══");
  const emails = Object.values(EMAILS);
  await db.classJoinRequest.deleteMany({ where: { message: "TEST P4.3a" } });
  await db.classroomEnrollment.deleteMany({
    where: { classroomId: { startsWith: "test_p4_3a_" } },
  });
  await db.classroom.deleteMany({ where: { id: { startsWith: "test_p4_3a_" } } });
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
  await db.languageCenter.deleteMany({ where: { id: { startsWith: "test_p4_3a_" } } });
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
  for (const email of emails) {
    const u = list.users.find((x) => x.email?.toLowerCase() === email.toLowerCase());
    if (u) await admin.auth.admin.deleteUser(u.id);
  }
  console.log(`  cleaned · ${ids.length} db users · ${emails.length} auth users · centers + classrooms`);
  await db.$disconnect();
}

async function list() {
  const centers = await db.languageCenter.findMany({
    where: { id: { startsWith: "test_p4_3a_" } },
    include: { teachers: true, classrooms: { include: { enrollments: true } } },
  });
  console.log(JSON.stringify(centers, null, 2));
  await db.$disconnect();
}

if (MODE === "seed") await seed();
else if (MODE === "clean") await clean();
else await list();
