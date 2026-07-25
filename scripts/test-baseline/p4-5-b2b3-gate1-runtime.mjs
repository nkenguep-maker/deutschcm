// P4.5-B2b3a Gate 1 · runtime HTTP étendu · 3 races manquantes +
// 20 routes flag-off complètes + personas sans binding + injections
// query + tous headers d'autorité + cardinalité audits access-denied.
//
// Sécurité · P-1 exclusivement via assertNonProduction. Cleanup complet.

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

const PREFIX = "test_p4_5_b_g1_";
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
        { actorUserId: { startsWith: PREFIX } },
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
  return Array.from(cookieStore.entries()).map(([n, v]) => `${n}=${v}`).join("; ");
}

async function fetchWith(cookieHeader, method, path, body, extraHeaders = {}) {
  const headers = { "content-type": "application/json", ...extraHeaders };
  if (cookieHeader) headers["cookie"] = cookieHeader;
  try {
    const res = await fetch(`${BASE}${path}`, {
      method, headers, body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    return { status: res.status, ok: res.ok, body: json, raw: text.slice(0, 200) };
  } catch (e) { return { status: 0, ok: false, error: e.message }; }
}

async function startServer(flagsEnabled) {
  await stopServer();
  process.stderr.write(`\n─── Starting Next dev · ASSIGNMENTS_ENABLED=${flagsEnabled} ───\n`);
  serverProcess = spawn("npx", ["next", "dev", "-p", PORT], {
    env: {
      ...process.env,
      YEMA_ASSIGNMENTS_ENABLED: flagsEnabled ? "true" : "false",
      YEMA_AUDIO_FEEDBACK_ENABLED: "false",
    },
    stdio: ["ignore", "pipe", "pipe"],
    detached: false,
  });
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
  throw new Error("server not ready in 120s");
}

async function stopServer() {
  if (!serverProcess) return;
  try { serverProcess.kill("SIGTERM"); } catch {}
  await new Promise((r) => setTimeout(r, 3000));
  try { serverProcess.kill("SIGKILL"); } catch {}
  serverProcess = null;
}

async function main() {
  process.stderr.write("═══ P4.5-B2b3a Gate 1 · runtime HTTP étendu ═══\n\n");
  await purgeDb();
  await purgeAuth();

  // ── Setup fixtures P-1 · 8 personas ────────────────────────────────
  process.stderr.write("─── Setup fixtures P-1 ───\n");
  const sTeacherA = await createAuthUser("t_a");
  const sTeacherB = await createAuthUser("t_b");
  const sTeacherNoBind = await createAuthUser("t_no_bind"); // Teacher role, no Teacher row
  const sStudentA = await createAuthUser("s_a");
  const sStudentB = await createAuthUser("s_b");
  const sStudentNoEnroll = await createAuthUser("s_no_enroll"); // Student role, no enrollment
  const sStudentRemoved = await createAuthUser("s_removed"); // enrollment isActive=false

  const teacherAUser = await db.user.create({
    data: { id: `${PREFIX}t_a_user`, email: sTeacherA.email, supabaseId: sTeacherA.supabaseId, role: "TEACHER", fullName: "TA", onboardingDone: true },
  });
  const teacherBUser = await db.user.create({
    data: { id: `${PREFIX}t_b_user`, email: sTeacherB.email, supabaseId: sTeacherB.supabaseId, role: "TEACHER", fullName: "TB", onboardingDone: true },
  });
  await db.user.create({
    data: { id: `${PREFIX}t_no_bind_user`, email: sTeacherNoBind.email, supabaseId: sTeacherNoBind.supabaseId, role: "TEACHER", fullName: "TNB", onboardingDone: true },
  });
  const studentAUser = await db.user.create({
    data: { id: `${PREFIX}s_a_user`, email: sStudentA.email, supabaseId: sStudentA.supabaseId, role: "STUDENT", fullName: "SA", onboardingDone: true },
  });
  const studentBUser = await db.user.create({
    data: { id: `${PREFIX}s_b_user`, email: sStudentB.email, supabaseId: sStudentB.supabaseId, role: "STUDENT", fullName: "SB", onboardingDone: true },
  });
  const studentNoEnrollUser = await db.user.create({
    data: { id: `${PREFIX}s_no_enroll_user`, email: sStudentNoEnroll.email, supabaseId: sStudentNoEnroll.supabaseId, role: "STUDENT", fullName: "SNE", onboardingDone: true },
  });
  const studentRemovedUser = await db.user.create({
    data: { id: `${PREFIX}s_removed_user`, email: sStudentRemoved.email, supabaseId: sStudentRemoved.supabaseId, role: "STUDENT", fullName: "SR", onboardingDone: true },
  });

  const teacherA = await db.teacher.create({ data: { id: `${PREFIX}teacher_a`, userId: teacherAUser.id } });
  const teacherB = await db.teacher.create({ data: { id: `${PREFIX}teacher_b`, userId: teacherBUser.id } });
  const classroomA = await db.classroom.create({
    data: { id: `${PREFIX}classroom_a`, name: "A", teacherId: teacherA.id, level: "A1", code: `GA${Date.now()}` },
  });
  const classroomB = await db.classroom.create({
    data: { id: `${PREFIX}classroom_b`, name: "B", teacherId: teacherB.id, level: "A1", code: `GB${Date.now()}` },
  });
  await db.classroomEnrollment.create({ data: { classroomId: classroomA.id, userId: studentAUser.id, isActive: true } });
  await db.classroomEnrollment.create({ data: { classroomId: classroomB.id, userId: studentBUser.id, isActive: true } });
  // Student REMOVED · enrollment sur classroom A mais isActive=false.
  await db.classroomEnrollment.create({ data: { classroomId: classroomA.id, userId: studentRemovedUser.id, isActive: false } });

  const asmPubA = await db.assignment.create({
    data: {
      id: `${PREFIX}asm_a_pub`,
      classroom: { connect: { id: classroomA.id } },
      title: "Pub A", type: "WRITTEN", status: "PUBLISHED", publishedAt: new Date(),
      createdByTeacher: { connect: { id: teacherA.id } },
    },
  });
  process.stderr.write(`  ✓ 7 Auth users + Prisma rows seeded\n`);

  // ── §7 · Flag-on · 20 routes flag-on smoke ────────────────────────
  await startServer(true);

  const cookiesTA = await signInAndGetCookies(sTeacherA.email);
  const cookiesTB = await signInAndGetCookies(sTeacherB.email);
  const cookiesTNB = await signInAndGetCookies(sTeacherNoBind.email);
  const cookiesSA = await signInAndGetCookies(sStudentA.email);
  const cookiesSB = await signInAndGetCookies(sStudentB.email);
  const cookiesSNE = await signInAndGetCookies(sStudentNoEnroll.email);
  const cookiesSR = await signInAndGetCookies(sStudentRemoved.email);
  process.stderr.write(`  ✓ 7 personas signed in\n`);

  // ── §5 Gate 1 · Teacher sans binding + Student sans enrollment + Student REMOVED ──
  process.stderr.write("\n─── §5 · Personas sans binding/enrollment/REMOVED ───\n");
  log("§5a · Teacher sans binding · GET /api/teacher/classes/[cid]/assignments",
    await fetchWith(cookiesTNB, "GET", `/api/teacher/classes/${classroomA.id}/assignments`));
  log("§5b · Teacher sans binding · POST /api/teacher/classes/[cid]/assignments",
    await fetchWith(cookiesTNB, "POST", `/api/teacher/classes/${classroomA.id}/assignments`, { title: "Test" }));
  log("§5c · Student sans enrollment · GET /api/student/assignments",
    await fetchWith(cookiesSNE, "GET", `/api/student/assignments`));
  log("§5d · Student sans enrollment · GET /api/student/assignments/[aid]",
    await fetchWith(cookiesSNE, "GET", `/api/student/assignments/${asmPubA.id}`));
  log("§5e · Student REMOVED · GET /api/student/assignments (must be empty)",
    await fetchWith(cookiesSR, "GET", `/api/student/assignments`));
  log("§5f · Student REMOVED · GET /api/student/assignments/[aid] (must 404)",
    await fetchWith(cookiesSR, "GET", `/api/student/assignments/${asmPubA.id}`));
  log("§5g · Student REMOVED · POST /api/student/assignments/[aid]/submissions",
    await fetchWith(cookiesSR, "POST", `/api/student/assignments/${asmPubA.id}/submissions`, { writtenContent: "x" }));

  // ── §6 Gate 1 · Injections query + headers exhaustifs ──────────────
  process.stderr.write("\n─── §6 · Injections query + tous headers ───\n");
  log("§6a · Query · ?classroomId=B",
    await fetchWith(cookiesTA, "GET", `/api/teacher/assignments/${asmPubA.id}?classroomId=${classroomB.id}`));
  log("§6b · Query · ?assignmentId=other",
    await fetchWith(cookiesSA, "GET", `/api/student/assignments/${asmPubA.id}?assignmentId=nefarious`));

  const evilHeaders = {
    "x-user-id": studentBUser.id,
    "x-student-id": studentBUser.id,
    "x-teacher-id": teacherB.id,
    "x-classroom-id": classroomB.id,
    "x-assignment-id": `${PREFIX}nefarious`,
    "x-submission-id": `${PREFIX}nefarious_sub`,
    "x-feedback-id": `${PREFIX}nefarious_fb`,
  };
  log("§6c · Teacher A · all x-* headers evilBId · GET assignment A",
    await fetchWith(cookiesTA, "GET", `/api/teacher/assignments/${asmPubA.id}`, null, evilHeaders));
  log("§6d · Student A · all x-* headers evilBId · GET student assignments",
    await fetchWith(cookiesSA, "GET", `/api/student/assignments`, null, evilHeaders));

  // ── §9.3 · Race nouvelle version via HTTP ────────────────────────
  process.stderr.write("\n─── §9.3 · Race new version HTTP ───\n");
  // Setup · student a une submission SUBMITTED v1 pour permettre nextVersion.
  const subForVersion = await db.assignmentSubmission.create({
    data: {
      id: `${PREFIX}sub_v_race`,
      assignment: { connect: { id: asmPubA.id } },
      user: { connect: { id: studentAUser.id } },
      writtenContent: "v1 SUBMITTED", status: "SUBMITTED", version: 1,
      submittedAt: new Date(),
    },
  });
  const beforeV = await db.auditEvent.count({
    where: { action: "SUBMISSION_CREATED", scopeId: asmPubA.id },
  });
  const [rv1, rv2] = await Promise.allSettled([
    fetchWith(cookiesSA, "POST", `/api/student/submissions/${subForVersion.id}/versions`, { writtenContent: "v2 draft race 1" }),
    fetchWith(cookiesSA, "POST", `/api/student/submissions/${subForVersion.id}/versions`, { writtenContent: "v2 draft race 2" }),
  ]);
  const afterV = await db.auditEvent.count({
    where: { action: "SUBMISSION_CREATED", scopeId: asmPubA.id },
  });
  const rvVersions = await db.assignmentSubmission.findMany({
    where: { assignmentId: asmPubA.id, userId: studentAUser.id },
    select: { version: true, status: true }, orderBy: { version: "asc" },
  });
  const rvStatuses = [rv1, rv2].map((r) => r.value?.status);
  const rvCodes = [rv1, rv2].map((r) => r.value?.body?.code ?? null);
  const rvNoP2034 = ![rv1, rv2].some((r) => JSON.stringify(r.value?.body ?? {}).match(/P2034|TransactionWriteConflict/));
  log("§9.3 · double new version HTTP", {
    statuses: rvStatuses, codes: rvCodes, versions: rvVersions,
    auditDelta: afterV - beforeV, exposedP2034: !rvNoP2034,
  });

  // ── §9.4 · Race double publish feedback via HTTP ─────────────────
  process.stderr.write("\n─── §9.4 · Race double publish feedback HTTP ───\n");
  // Fresh submission SUBMITTED distincte de subForVersion (qui est
  // SUPERSEDED après §9.3 · le service refuse feedback sur non-SUBMITTED).
  // On seed directement une submission SUBMITTED pour Student A sur asmPubA
  // avec version=10 pour éviter tout conflit unique avec §9.3.
  const subForFb = await db.assignmentSubmission.create({
    data: {
      id: `${PREFIX}sub_for_fb`,
      assignment: { connect: { id: asmPubA.id } },
      user: { connect: { id: studentAUser.id } },
      writtenContent: "final pour feedback race", status: "SUBMITTED", version: 10,
      submittedAt: new Date(),
    },
  });
  const draftFbResp = await fetchWith(cookiesTA, "POST",
    `/api/teacher/submissions/${subForFb.id}/feedback`,
    { writtenContent: "brouillon feedback race" });
  const fbRaceId = draftFbResp.body?.feedback?.id;
  log("§9.4 setup · Teacher A create feedback DRAFT",
    { status: draftFbResp.status, feedbackId: fbRaceId });

  if (fbRaceId) {
    const beforeFbPub = await db.auditEvent.count({
      where: { action: "FEEDBACK_PUBLISHED", targetId: fbRaceId },
    });
    const [rfp1, rfp2] = await Promise.allSettled([
      fetchWith(cookiesTA, "POST", `/api/teacher/feedback/${fbRaceId}/publish`),
      fetchWith(cookiesTA, "POST", `/api/teacher/feedback/${fbRaceId}/publish`),
    ]);
    const afterFbPub = await db.auditEvent.count({
      where: { action: "FEEDBACK_PUBLISHED", targetId: fbRaceId },
    });
    const fbFinal = await db.assignmentFeedback.findUnique({
      where: { id: fbRaceId }, select: { status: true },
    });
    const rfpNoP2034 = ![rfp1, rfp2].some((r) => JSON.stringify(r.value?.body ?? {}).match(/P2034|TransactionWriteConflict/));
    log("§9.4 · double publish feedback HTTP", {
      statuses: [rfp1, rfp2].map((r) => r.value?.status),
      codes: [rfp1, rfp2].map((r) => r.value?.body?.code ?? null),
      finalStatus: fbFinal?.status, auditDelta: afterFbPub - beforeFbPub,
      exposedP2034: !rfpNoP2034,
    });

    // ── §9.5 · Race double addendum via HTTP ────────────────────────
    process.stderr.write("\n─── §9.5 · Race double addendum HTTP ───\n");
    const beforeAdd = await db.auditEvent.count({
      where: { action: "FEEDBACK_ADDENDUM_CREATED", scopeId: subForFb.id },
    });
    const [ra1, ra2] = await Promise.allSettled([
      fetchWith(cookiesTA, "POST", `/api/teacher/feedback/${fbRaceId}/addendum`, { writtenContent: "addendum race 1" }),
      fetchWith(cookiesTA, "POST", `/api/teacher/feedback/${fbRaceId}/addendum`, { writtenContent: "addendum race 2" }),
    ]);
    const afterAdd = await db.auditEvent.count({
      where: { action: "FEEDBACK_ADDENDUM_CREATED", scopeId: subForFb.id },
    });
    const addVersions = await db.assignmentFeedback.findMany({
      where: { submissionId: subForFb.id },
      select: { version: true, status: true }, orderBy: { version: "asc" },
    });
    const raNoP2034 = ![ra1, ra2].some((r) => JSON.stringify(r.value?.body ?? {}).match(/P2034|TransactionWriteConflict/));
    log("§9.5 · double addendum HTTP", {
      statuses: [ra1, ra2].map((r) => r.value?.status),
      codes: [ra1, ra2].map((r) => r.value?.body?.code ?? null),
      versions: addVersions, auditDelta: afterAdd - beforeAdd,
      exposedP2034: !raNoP2034,
    });
  }

  // ── §10 · Cardinalité audits access-denied en base ────────────────
  process.stderr.write("\n─── §10 · Cardinalité audits access-denied ───\n");
  const auditsBefore = await db.auditEvent.count({
    where: { action: { in: ["ASSIGNMENT_ACCESS_DENIED", "SUBMISSION_ACCESS_DENIED", "FEEDBACK_ACCESS_DENIED"] } },
  });
  await fetchWith(cookiesTB, "GET", `/api/teacher/assignments/${asmPubA.id}`);
  const auditsAfter = await db.auditEvent.count({
    where: { action: { in: ["ASSIGNMENT_ACCESS_DENIED", "SUBMISSION_ACCESS_DENIED", "FEEDBACK_ACCESS_DENIED"] } },
  });
  log("§10 · cardinal access-denied · Teacher B on Assignment A", {
    before: auditsBefore, after: auditsAfter, delta: auditsAfter - auditsBefore,
    invariantMaxOne: (auditsAfter - auditsBefore) <= 1,
  });

  // ── §11 · Absence PII dans les audits (avant cleanup) ─────────────
  const auditsSample = await db.auditEvent.findMany({
    where: {
      OR: [
        { targetId: { startsWith: PREFIX } },
        { scopeId: { startsWith: PREFIX } },
      ],
    },
    select: { metadata: true, action: true }, take: 50,
  });
  const forbiddenKeys = ["writtenContent", "instructions", "email", "phone", "fullName", "cookie", "authorization", "token", "body"];
  let leakedKeys = 0;
  for (const s of auditsSample) {
    const md = s.metadata ?? {};
    for (const k of forbiddenKeys) if (k in md) leakedKeys++;
  }
  log("§11 · PII leak check on P-1 audits", { sampleSize: auditsSample.length, leakedKeys });

  // ── §14.2 Gate 1 · Flag-off · TOUTES les 20 routes ────────────────
  process.stderr.write("\n─── §14.2 · Flag-off · 20 routes complètes ───\n");
  await startServer(false);
  const cookiesTAoff = await signInAndGetCookies(sTeacherA.email);

  const routes20 = [
    ["GET", `/api/teacher/classes/${classroomA.id}/assignments`],
    ["POST", `/api/teacher/classes/${classroomA.id}/assignments`, { title: "T" }],
    ["GET", `/api/teacher/assignments/${asmPubA.id}`],
    ["PATCH", `/api/teacher/assignments/${asmPubA.id}`, { title: "T" }],
    ["POST", `/api/teacher/assignments/${asmPubA.id}/publish`],
    ["POST", `/api/teacher/assignments/${asmPubA.id}/close`],
    ["GET", `/api/teacher/assignments/${asmPubA.id}/submissions`],
    ["GET", `/api/teacher/submissions/${subForVersion.id}`],
    ["POST", `/api/teacher/submissions/${subForVersion.id}/feedback`, { writtenContent: "x" }],
    ["PATCH", `/api/teacher/feedback/${fbRaceId ?? "null"}`, { writtenContent: "x" }],
    ["POST", `/api/teacher/feedback/${fbRaceId ?? "null"}/publish`],
    ["POST", `/api/teacher/feedback/${fbRaceId ?? "null"}/addendum`, { writtenContent: "x" }],
    ["GET", `/api/student/assignments`],
    ["GET", `/api/student/assignments/${asmPubA.id}`],
    ["GET", `/api/student/assignments/${asmPubA.id}/submissions`],
    ["POST", `/api/student/assignments/${asmPubA.id}/submissions`, { writtenContent: "x" }],
    ["PATCH", `/api/student/submissions/${subForVersion.id}`, { writtenContent: "x" }],
    ["POST", `/api/student/submissions/${subForVersion.id}/submit`],
    ["POST", `/api/student/submissions/${subForVersion.id}/versions`, { writtenContent: "x" }],
    ["GET", `/api/student/submissions/${subForVersion.id}/feedback`],
  ];
  let all404 = true;
  let any200 = false;
  for (const [method, path, body] of routes20) {
    const r = await fetchWith(cookiesTAoff, method, path, body);
    if (r.status !== 404) all404 = false;
    if (r.status === 200) any200 = true;
  }
  log("§14.2 · flag-off · 20 routes complètes", {
    total: routes20.length, all404, any200,
    verdict: all404 && !any200 ? "PASS (all 404)" : "FAIL",
  });

  await stopServer();

  // ── Cleanup ─────────────────────────────────────────────────────────
  await purgeDb();
  await purgeAuth();
  const [users, classrooms, assignments, submissions, feedbacks, audits] = await Promise.all([
    db.user.count({ where: { email: { contains: PREFIX } } }),
    db.classroom.count({ where: { id: { startsWith: PREFIX } } }),
    db.assignment.count({ where: { id: { startsWith: PREFIX } } }),
    db.assignmentSubmission.count({ where: { id: { startsWith: PREFIX } } }),
    db.assignmentFeedback.count({ where: { id: { startsWith: PREFIX } } }),
    db.auditEvent.count({ where: { targetId: { startsWith: PREFIX } } }),
  ]);
  const total = users + classrooms + assignments + submissions + feedbacks + audits;
  log("cleanup · residual fixtures (all expect 0)", {
    users, classrooms, assignments, submissions, feedbacks, audits, total,
  });
  if (total === 0) process.stderr.write("\nBASELINE DATA CLEANED\n");
  else process.stderr.write("\nCLEANUP FAILED · residual fixtures detected\n");

  await db.$disconnect();

  const { writeFile, mkdir } = await import("node:fs/promises");
  await mkdir("/tmp/p4-5-b-captures", { recursive: true });
  await writeFile("/tmp/p4-5-b-captures/gate1-runtime.json", JSON.stringify(results, null, 2));
  process.stderr.write(`\nWritten /tmp/p4-5-b-captures/gate1-runtime.json (${results.length} entries)\n`);
}

main().catch(async (e) => {
  console.error(e);
  try { await stopServer(); await purgeAuth(); await db.$disconnect(); } catch {}
  process.exit(1);
});
