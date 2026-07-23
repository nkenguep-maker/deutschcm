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
  const ex = await db.user.findFirst({ where: { supabaseId } });
  if (ex) return db.user.update({ where: { id: ex.id }, data: { role } });
  return db.user.create({
    data: { supabaseId, email, fullName, role },
  });
}

async function ensureAppRole(userId, role) {
  await db.userAppRole.upsert({
    where: { userId_role: { userId, role } },
    update: {},
    create: { userId, role },
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
  const [adminAAuth, adminBAuth, teacherAAuth, teacherBAuth, sA1Auth, sA2Auth, sB1Auth, pendingAAuth] = await Promise.all([
    ensureAuth(EMAILS.adminA, "TEST P4.3a Center A Admin"),
    ensureAuth(EMAILS.adminB, "TEST P4.3a Center B Admin"),
    ensureAuth(EMAILS.teacherA, "TEST P4.3a Teacher A"),
    ensureAuth(EMAILS.teacherB, "TEST P4.3a Teacher B"),
    ensureAuth(EMAILS.studentA1, "TEST P4.3a Student A1"),
    ensureAuth(EMAILS.studentA2, "TEST P4.3a Student A2"),
    ensureAuth(EMAILS.studentB1, "TEST P4.3a Student B1"),
    ensureAuth(EMAILS.pendingA, "TEST P4.3a Pending A"),
  ]);
  const [adminA, adminB, teacherA, teacherB, sA1, sA2, sB1, pendingA] = await Promise.all([
    ensureDbUser(adminAAuth.id, EMAILS.adminA, "TEST P4.3a Center A Admin", "CENTER"),
    ensureDbUser(adminBAuth.id, EMAILS.adminB, "TEST P4.3a Center B Admin", "CENTER"),
    ensureDbUser(teacherAAuth.id, EMAILS.teacherA, "TEST P4.3a Teacher A", "TEACHER"),
    ensureDbUser(teacherBAuth.id, EMAILS.teacherB, "TEST P4.3a Teacher B", "TEACHER"),
    ensureDbUser(sA1Auth.id, EMAILS.studentA1, "TEST P4.3a Student A1", "STUDENT"),
    ensureDbUser(sA2Auth.id, EMAILS.studentA2, "TEST P4.3a Student A2", "STUDENT"),
    ensureDbUser(sB1Auth.id, EMAILS.studentB1, "TEST P4.3a Student B1", "STUDENT"),
    ensureDbUser(pendingAAuth.id, EMAILS.pendingA, "TEST P4.3a Pending A", "STUDENT"),
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
  ]);

  const cA = await ensureCenter(CENTER_A, "TEST_CENTER_A", "Yaoundé", "P43A_A");
  const cB = await ensureCenter(CENTER_B, "TEST_CENTER_B", "Douala", "P43A_B");

  // Teacher records rattachés aux centres. Le CENTER admin doit avoir un
  // Teacher pour que le resolver le trouve (contrat V1). On rattache les
  // admins aussi.
  const [teacherAT, teacherBT, adminAT, adminBT] = await Promise.all([
    ensureTeacher(teacherA.id, cA.id),
    ensureTeacher(teacherB.id, cB.id),
    ensureTeacher(adminA.id, cA.id),
    ensureTeacher(adminB.id, cB.id),
  ]);
  void adminAT; void adminBT;

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
