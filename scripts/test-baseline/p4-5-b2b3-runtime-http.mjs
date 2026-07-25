// P4.5-B2b3a · runtime HTTP réel · fetch avec cookies Supabase SSR sur les
// 20 routes API Monde. Setup fixtures P-1 + signup Auth users + start dev
// server ASSIGNMENTS_ENABLED=true + Playwright ou fetch(cookies) puis
// cleanup complet.
//
// Sécurité · P-1 exclusivement via assertNonProduction.
//
// Structure ·
//   1. Setup fixtures Prisma + Supabase Auth users
//   2. Start Next dev server (port 3579, YEMA_ASSIGNMENTS_ENABLED=true)
//   3. Wait ready
//   4. Pour chaque persona · signIn programmatique via @supabase/ssr
//      avec custom cookie storage → capture cookies → utiliser dans fetch()
//   5. Tester les 20 routes + cross-tenant + rôles négatifs
//   6. Anti-injection · headers x-*, query params, body forbidden keys
//   7. 5 races HTTP via Promise.allSettled
//   8. Cleanup fixtures + Auth users + kill server
//   9. Sortie JSON pour rapport

import { assertNonProduction } from "./_common.mjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";
import { spawn } from "node:child_process";
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

const admin = createSupabaseAdmin(SUPABASE_URL, SUPABASE_SERVICE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PREFIX = "test_p4_5_b_http_";
const PASSWORD = crypto.randomBytes(16).toString("base64").replaceAll("/", "0").replaceAll("+", "1") + "Aa1!";
const PORT = process.env.HTTP_TEST_PORT || "3579";
const BASE = `http://127.0.0.1:${PORT}`;

const results = [];
function log(label, obj) {
  results.push({ label, ...obj });
  process.stderr.write(`  ${label} · ${JSON.stringify(obj).slice(0, 200)}\n`);
}

const authUserIds = [];
let serverProcess = null;

async function purgeDb() {
  await db.assignmentFeedback.deleteMany({ where: { id: { startsWith: PREFIX } } });
  await db.assignmentSubmission.deleteMany({ where: { id: { startsWith: PREFIX } } });
  await db.assignment.deleteMany({ where: { id: { startsWith: PREFIX } } });
  await db.classroomEnrollment.deleteMany({ where: { classroomId: { startsWith: PREFIX } } });
  await db.classroom.deleteMany({ where: { id: { startsWith: PREFIX } } });
  await db.teacher.deleteMany({ where: { id: { startsWith: PREFIX } } });
  await db.userAppRole.deleteMany({ where: { userId: { startsWith: PREFIX } } });
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
  try {
    const { data } = await admin.auth.admin.listUsers();
    for (const u of data?.users ?? []) {
      if (u.email?.includes(PREFIX)) await admin.auth.admin.deleteUser(u.id).catch(() => {});
    }
  } catch {}
}

async function createAuthUser(suffix) {
  const email = `${PREFIX}${suffix}_${Date.now()}${Math.random().toString().slice(2, 5)}@example.com`;
  const { data, error } = await admin.auth.admin.createUser({
    email, password: PASSWORD, email_confirm: true,
  });
  if (error) throw error;
  authUserIds.push(data.user.id);
  return { email, supabaseId: data.user.id };
}

// Sign-in programmatique via @supabase/ssr avec custom cookie storage.
// Retourne un objet avec `cookieHeader` string prêt à injecter dans fetch.
async function signInAndGetCookies(email) {
  const cookieStore = new Map();
  const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: {
      getAll: () => Array.from(cookieStore.entries()).map(([name, value]) => ({ name, value })),
      setAll: (list) => list.forEach(({ name, value }) => cookieStore.set(name, value)),
    },
    cookieOptions: { domain: "127.0.0.1", path: "/", secure: false, sameSite: "lax" },
  });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw error;
  const cookieHeader = Array.from(cookieStore.entries())
    .map(([n, v]) => `${n}=${v}`)
    .join("; ");
  return { session: data.session, cookieHeader, cookieStore };
}

async function fetchWith(cookieHeader, method, path, body, extraHeaders = {}) {
  const headers = { "content-type": "application/json", ...extraHeaders };
  if (cookieHeader) headers["cookie"] = cookieHeader;
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    return { status: res.status, ok: res.ok, body: json, raw: text.slice(0, 200) };
  } catch (e) {
    return { status: 0, ok: false, error: e.message };
  }
}

async function startServer() {
  process.stderr.write(`\n─── Starting Next dev server on port ${PORT} (ASSIGNMENTS_ENABLED=true) ───\n`);
  serverProcess = spawn("npx", ["next", "dev", "-p", PORT], {
    env: {
      ...process.env,
      YEMA_ASSIGNMENTS_ENABLED: "true",
      YEMA_AUDIO_FEEDBACK_ENABLED: "false",
    },
    stdio: ["ignore", "pipe", "pipe"],
    detached: false,
  });
  // Wait for ready · probe root URL until 200.
  const deadline = Date.now() + 120000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/fr/login`, { signal: AbortSignal.timeout(3000) });
      if (res.status === 200 || res.status === 302) {
        process.stderr.write(`  ✓ server ready (HTTP ${res.status})\n`);
        return;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("server did not become ready in 120s");
}

async function stopServer() {
  if (!serverProcess) return;
  try { serverProcess.kill("SIGTERM"); } catch {}
  await new Promise((r) => setTimeout(r, 2000));
  try { serverProcess.kill("SIGKILL"); } catch {}
  serverProcess = null;
}

async function main() {
  process.stderr.write("═══ P4.5-B2b3a · runtime HTTP réel ═══\n\n");
  await purgeDb();
  await purgeAuth();

  // ── Fixtures P-1 ────────────────────────────────────────────────────
  process.stderr.write("─── Setup fixtures P-1 ───\n");
  const sTeacherA = await createAuthUser("teacher_a");
  const sTeacherB = await createAuthUser("teacher_b");
  const sStudentA = await createAuthUser("student_a");
  const sStudentB = await createAuthUser("student_b");
  const sCenter = await createAuthUser("center_admin");
  const sCoach = await createAuthUser("roots_coach");
  const sYema = await createAuthUser("yema_no_bind");
  process.stderr.write(`  ✓ 7 Auth users created\n`);

  const teacherAUser = await db.user.create({
    data: { id: `${PREFIX}teacher_a_user`, email: sTeacherA.email, supabaseId: sTeacherA.supabaseId, role: "TEACHER", fullName: "TA", onboardingDone: true },
  });
  const teacherBUser = await db.user.create({
    data: { id: `${PREFIX}teacher_b_user`, email: sTeacherB.email, supabaseId: sTeacherB.supabaseId, role: "TEACHER", fullName: "TB", onboardingDone: true },
  });
  const studentAUser = await db.user.create({
    data: { id: `${PREFIX}student_a_user`, email: sStudentA.email, supabaseId: sStudentA.supabaseId, role: "STUDENT", fullName: "SA", onboardingDone: true },
  });
  const studentBUser = await db.user.create({
    data: { id: `${PREFIX}student_b_user`, email: sStudentB.email, supabaseId: sStudentB.supabaseId, role: "STUDENT", fullName: "SB", onboardingDone: true },
  });
  await db.user.create({ data: { id: `${PREFIX}center_user`, email: sCenter.email, supabaseId: sCenter.supabaseId, role: "ADMIN", fullName: "CA", onboardingDone: true } });
  const coachUser = await db.user.create({ data: { id: `${PREFIX}coach_user`, email: sCoach.email, supabaseId: sCoach.supabaseId, role: "STUDENT", fullName: "RC", onboardingDone: true } });
  await db.userAppRole.create({ data: { userId: coachUser.id, role: "RACINES_COACH" } });
  const yemaUser = await db.user.create({ data: { id: `${PREFIX}yema_user`, email: sYema.email, supabaseId: sYema.supabaseId, role: "STUDENT", fullName: "Y", onboardingDone: true } });
  await db.userAppRole.create({ data: { userId: yemaUser.id, role: "YEMA_ADMIN" } });

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

  const asmPubA = await db.assignment.create({
    data: {
      id: `${PREFIX}asm_a_pub`,
      classroom: { connect: { id: classroomA.id } },
      title: "Pub A", type: "WRITTEN", status: "PUBLISHED", publishedAt: new Date(),
      createdByTeacher: { connect: { id: teacherA.id } },
    },
  });
  process.stderr.write(`  ✓ Fixtures Prisma seeded\n`);

  // ── Start server ────────────────────────────────────────────────────
  await startServer();

  // ── Cookies pour chaque persona ─────────────────────────────────────
  const cookiesTeacherA = await signInAndGetCookies(sTeacherA.email);
  const cookiesTeacherB = await signInAndGetCookies(sTeacherB.email);
  const cookiesStudentA = await signInAndGetCookies(sStudentA.email);
  const cookiesStudentB = await signInAndGetCookies(sStudentB.email);
  const cookiesCenter = await signInAndGetCookies(sCenter.email);
  const cookiesCoach = await signInAndGetCookies(sCoach.email);
  const cookiesYema = await signInAndGetCookies(sYema.email);
  process.stderr.write(`  ✓ 7 personas signed in\n`);

  // ── §6.1 · Teacher A · 12 routes ────────────────────────────────────
  process.stderr.write("\n─── §6.1 · Teacher A · 12 routes ───\n");
  log("§6.1a · GET /api/teacher/classes/[cid]/assignments (own)",
    await fetchWith(cookiesTeacherA.cookieHeader, "GET", `/api/teacher/classes/${classroomA.id}/assignments`));
  log("§6.1b · POST /api/teacher/classes/[cid]/assignments (create draft)",
    await fetchWith(cookiesTeacherA.cookieHeader, "POST", `/api/teacher/classes/${classroomA.id}/assignments`,
      { title: "Draft test", instructions: "instr" }));
  log("§6.1c · GET /api/teacher/assignments/[aid] (own PUBLISHED)",
    await fetchWith(cookiesTeacherA.cookieHeader, "GET", `/api/teacher/assignments/${asmPubA.id}`));

  // Create fresh draft to exercise mutations.
  const createRes = await fetchWith(cookiesTeacherA.cookieHeader, "POST",
    `/api/teacher/classes/${classroomA.id}/assignments`, { title: "For mutations" });
  const asmMutId = createRes.body?.assignment?.id;

  if (asmMutId) {
    log("§6.1d · PATCH /api/teacher/assignments/[aid] (own DRAFT)",
      await fetchWith(cookiesTeacherA.cookieHeader, "PATCH", `/api/teacher/assignments/${asmMutId}`,
        { title: "Updated" }));
    log("§6.1e · POST /api/teacher/assignments/[aid]/publish",
      await fetchWith(cookiesTeacherA.cookieHeader, "POST", `/api/teacher/assignments/${asmMutId}/publish`));
    log("§6.1f · POST /api/teacher/assignments/[aid]/close",
      await fetchWith(cookiesTeacherA.cookieHeader, "POST", `/api/teacher/assignments/${asmMutId}/close`));
  }

  log("§6.1g · GET /api/teacher/assignments/[aid]/submissions",
    await fetchWith(cookiesTeacherA.cookieHeader, "GET", `/api/teacher/assignments/${asmPubA.id}/submissions`));

  // ── §6.2 · Student A · 8 routes ─────────────────────────────────────
  process.stderr.write("\n─── §6.2 · Student A · 8 routes ───\n");
  log("§6.2a · GET /api/student/assignments (enrolled)",
    await fetchWith(cookiesStudentA.cookieHeader, "GET", `/api/student/assignments`));
  log("§6.2b · GET /api/student/assignments/[aid]",
    await fetchWith(cookiesStudentA.cookieHeader, "GET", `/api/student/assignments/${asmPubA.id}`));
  log("§6.2c · GET /api/student/assignments/[aid]/submissions",
    await fetchWith(cookiesStudentA.cookieHeader, "GET", `/api/student/assignments/${asmPubA.id}/submissions`));

  const createSubRes = await fetchWith(cookiesStudentA.cookieHeader, "POST",
    `/api/student/assignments/${asmPubA.id}/submissions`, { writtenContent: "Ma réponse texte" });
  const subId = createSubRes.body?.submission?.id;
  log("§6.2d · POST /api/student/assignments/[aid]/submissions (create draft)",
    { status: createSubRes.status, ok: createSubRes.ok, submissionId: subId });

  if (subId) {
    log("§6.2e · PATCH /api/student/submissions/[sid]",
      await fetchWith(cookiesStudentA.cookieHeader, "PATCH", `/api/student/submissions/${subId}`,
        { writtenContent: "Réponse mise à jour" }));
    log("§6.2f · POST /api/student/submissions/[sid]/submit",
      await fetchWith(cookiesStudentA.cookieHeader, "POST", `/api/student/submissions/${subId}/submit`));
    log("§6.2g · GET /api/student/submissions/[sid]/feedback",
      await fetchWith(cookiesStudentA.cookieHeader, "GET", `/api/student/submissions/${subId}/feedback`));
  }

  // ── §7.1 · Cross-tenant Teacher B on A ─────────────────────────────
  process.stderr.write("\n─── §7.1 · Cross-tenant Teacher B on A ───\n");
  log("§7.1a · Teacher B GET Assignment A",
    await fetchWith(cookiesTeacherB.cookieHeader, "GET", `/api/teacher/assignments/${asmPubA.id}`));
  log("§7.1b · Teacher B PATCH Assignment A",
    await fetchWith(cookiesTeacherB.cookieHeader, "PATCH", `/api/teacher/assignments/${asmPubA.id}`, { title: "TAMPERED" }));
  log("§7.1c · Teacher B POST publish Assignment A",
    await fetchWith(cookiesTeacherB.cookieHeader, "POST", `/api/teacher/assignments/${asmPubA.id}/publish`));

  // ── §7.2 · Cross-tenant Student B on A ─────────────────────────────
  process.stderr.write("\n─── §7.2 · Cross-tenant Student B on A ───\n");
  log("§7.2a · Student B GET Assignment A",
    await fetchWith(cookiesStudentB.cookieHeader, "GET", `/api/student/assignments/${asmPubA.id}`));
  if (subId) {
    log("§7.2b · Student B PATCH Submission A",
      await fetchWith(cookiesStudentB.cookieHeader, "PATCH", `/api/student/submissions/${subId}`, { writtenContent: "TAMPERED" }));
  }

  // ── §7.3 · Rôles négatifs ──────────────────────────────────────────
  process.stderr.write("\n─── §7.3 · Rôles négatifs ───\n");
  for (const [label, cookies] of [
    ["Anonymous", null],
    ["Center admin", cookiesCenter.cookieHeader],
    ["Racines Coach", cookiesCoach.cookieHeader],
    ["YEMA_ADMIN sans binding", cookiesYema.cookieHeader],
    ["Teacher A on /student/*", cookiesTeacherA.cookieHeader],
    ["Student A on /teacher/*", cookiesStudentA.cookieHeader],
  ]) {
    const path = label.includes("Student A on") ? `/api/teacher/classes/${classroomA.id}/assignments` :
                 label.includes("Teacher A on") ? `/api/student/assignments` :
                 `/api/teacher/assignments/${asmPubA.id}`;
    log(`§7.3 · ${label}`, await fetchWith(cookies, "GET", path));
  }

  // ── §8 · Anti-injection ────────────────────────────────────────────
  process.stderr.write("\n─── §8 · Anti-injection ───\n");
  log("§8a · Teacher A · body forbidden `status`",
    await fetchWith(cookiesTeacherA.cookieHeader, "POST", `/api/teacher/classes/${classroomA.id}/assignments`,
      { title: "T", status: "PUBLISHED" }));
  log("§8b · Teacher A · body forbidden `classroomId`",
    await fetchWith(cookiesTeacherA.cookieHeader, "POST", `/api/teacher/classes/${classroomA.id}/assignments`,
      { title: "T", classroomId: classroomB.id }));
  log("§8c · Teacher A · body forbidden `teacherId`",
    await fetchWith(cookiesTeacherA.cookieHeader, "POST", `/api/teacher/classes/${classroomA.id}/assignments`,
      { title: "T", teacherId: teacherB.id }));
  log("§8d · Teacher A · body unknown key",
    await fetchWith(cookiesTeacherA.cookieHeader, "POST", `/api/teacher/classes/${classroomA.id}/assignments`,
      { title: "T", nefarious: 1 }));
  log("§8e · Teacher A · header x-classroom-id ignored (auth wins)",
    await fetchWith(cookiesTeacherA.cookieHeader, "GET", `/api/teacher/assignments/${asmPubA.id}`,
      null, { "x-classroom-id": classroomB.id, "x-teacher-id": teacherB.id }));
  log("§8f · Student A · body forbidden `assignmentId`",
    await fetchWith(cookiesStudentA.cookieHeader, "POST", `/api/student/assignments/${asmPubA.id}/submissions`,
      { writtenContent: "x", assignmentId: `${PREFIX}nefarious` }));
  log("§8g · Student A · body forbidden `userId`",
    await fetchWith(cookiesStudentA.cookieHeader, "POST", `/api/student/assignments/${asmPubA.id}/submissions`,
      { writtenContent: "x", userId: studentBUser.id }));

  // ── §9 · Races HTTP ─────────────────────────────────────────────────
  process.stderr.write("\n─── §9 · Races HTTP ───\n");
  // Reset assignment DRAFT for race 1.
  const raceDraft = await db.assignment.create({
    data: {
      id: `${PREFIX}race_draft`,
      classroom: { connect: { id: classroomA.id } },
      title: "Race", type: "WRITTEN", status: "DRAFT",
      createdByTeacher: { connect: { id: teacherA.id } },
    },
  });
  const [r1a, r1b] = await Promise.allSettled([
    fetchWith(cookiesTeacherA.cookieHeader, "POST", `/api/teacher/assignments/${raceDraft.id}/publish`),
    fetchWith(cookiesTeacherA.cookieHeader, "POST", `/api/teacher/assignments/${raceDraft.id}/publish`),
  ]);
  const r1Statuses = [r1a, r1b].map((r) => r.value?.status);
  const r1Bodies = [r1a, r1b].map((r) => r.value?.body?.code ?? null);
  const p2034InR1 = [r1a, r1b].some((r) => JSON.stringify(r.value?.body ?? {}).includes("P2034") || JSON.stringify(r.value?.body ?? {}).includes("TransactionWriteConflict"));
  const r1AsmFinal = await db.assignment.findUnique({ where: { id: raceDraft.id }, select: { status: true } });
  const r1Audits = await db.auditEvent.count({
    where: { action: "ASSIGNMENT_PUBLISHED", targetId: raceDraft.id },
  });
  log("§9.1 · double publish assignment", {
    statuses: r1Statuses, codes: r1Bodies, finalStatus: r1AsmFinal.status,
    audits: r1Audits, p2034Exposed: p2034InR1,
  });

  // Race 2 · double submit.
  // Étape · student crée un draft puis 2 requêtes submit concurrentes.
  const raceStudentDraft = await fetchWith(cookiesStudentA.cookieHeader, "POST",
    `/api/student/assignments/${asmPubA.id}/submissions`, { writtenContent: "Race submit" });
  const raceSubId = raceStudentDraft.body?.submission?.id;
  if (raceSubId) {
    const [r2a, r2b] = await Promise.allSettled([
      fetchWith(cookiesStudentA.cookieHeader, "POST", `/api/student/submissions/${raceSubId}/submit`),
      fetchWith(cookiesStudentA.cookieHeader, "POST", `/api/student/submissions/${raceSubId}/submit`),
    ]);
    const r2Statuses = [r2a, r2b].map((r) => r.value?.status);
    const r2Bodies = [r2a, r2b].map((r) => r.value?.body?.code ?? null);
    const p2034InR2 = [r2a, r2b].some((r) => JSON.stringify(r.value?.body ?? {}).includes("P2034") || JSON.stringify(r.value?.body ?? {}).includes("TransactionWriteConflict"));
    const r2SubFinal = await db.assignmentSubmission.findUnique({ where: { id: raceSubId }, select: { status: true } });
    const r2Audits = await db.auditEvent.count({
      where: { action: "SUBMISSION_SUBMITTED", targetId: raceSubId },
    });
    log("§9.2 · double submit", {
      statuses: r2Statuses, codes: r2Bodies, finalStatus: r2SubFinal.status,
      audits: r2Audits, p2034Exposed: p2034InR2,
    });
  }

  // ── §14.2 · Flag-off · restart server ASSIGNMENTS_ENABLED=false ────
  process.stderr.write("\n─── §14.2 · Flag-off · restart server ASSIGNMENTS_ENABLED=false ───\n");
  await stopServer();
  serverProcess = spawn("npx", ["next", "dev", "-p", PORT], {
    env: { ...process.env, YEMA_ASSIGNMENTS_ENABLED: "false", YEMA_AUDIO_FEEDBACK_ENABLED: "false" },
    stdio: ["ignore", "pipe", "pipe"],
    detached: false,
  });
  const deadline2 = Date.now() + 120000;
  while (Date.now() < deadline2) {
    try {
      const res = await fetch(`${BASE}/fr/login`, { signal: AbortSignal.timeout(3000) });
      if (res.status === 200 || res.status === 302) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 2000));
  }
  // Test 5 routes échantillon avec Anonymous et Teacher A · attendu 404.
  const flagOffSamples = [
    ["GET /api/teacher/classes/[cid]/assignments", "GET", `/api/teacher/classes/${classroomA.id}/assignments`],
    ["GET /api/teacher/assignments/[aid]", "GET", `/api/teacher/assignments/${asmPubA.id}`],
    ["GET /api/student/assignments", "GET", `/api/student/assignments`],
    ["POST /api/teacher/classes/[cid]/assignments", "POST", `/api/teacher/classes/${classroomA.id}/assignments`],
    ["POST /api/student/assignments/[aid]/submissions", "POST", `/api/student/assignments/${asmPubA.id}/submissions`],
  ];
  for (const [label, method, path] of flagOffSamples) {
    const r = await fetchWith(cookiesTeacherA.cookieHeader, method, path, method === "POST" ? { title: "T", writtenContent: "x" } : null);
    log(`§14.2 · flag-off · ${label}`, { status: r.status, body: r.body });
  }

  // ── §15 · Landing regression ────────────────────────────────────────
  process.stderr.write("\n─── §15 · Landing regression ───\n");
  for (const locale of ["fr", "en"]) {
    const r = await fetchWith(null, "GET", `/${locale}`);
    log(`§15 · Landing /${locale}`, { status: r.status });
  }

  await stopServer();

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
  await writeFile("/tmp/p4-5-b-captures/runtime-http.json", JSON.stringify(results, null, 2));
  process.stderr.write(`\nWritten /tmp/p4-5-b-captures/runtime-http.json (${results.length} entries)\n`);
}

main().catch(async (e) => {
  console.error(e);
  try { await stopServer(); await purgeAuth(); await db.$disconnect(); } catch {}
  process.exit(1);
});
