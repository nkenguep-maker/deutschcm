// P4.3b · Smoke test P-1 · Teacher cross-tenant + injection + bindings.
// Prérequis · fixtures seedées + dev server avec les 2 flags Teacher on.

import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const PW = process.env.P1_TEST_PASSWORD;
if (!PW) { console.error("P1_TEST_PASSWORD required"); process.exit(1); }

const EMAILS = {
  teacherA:     "paul+p4_3b_teacher_a@example.com",
  teacherB:     "paul+p4_3b_teacher_b@example.com",
  teacherZero:  "paul+p4_3b_teacher_zero@example.com",
  teacherAmbig: "paul+p4_3b_teacher_ambig@example.com",
  centerAdmin:  "paul+p4_3b_center_admin@example.com",
  studentA1:    "paul+p4_3b_student_a1@example.com",
  racinesCoach: "paul+p4_3b_racines_coach@example.com",
  yemaAdminNoBind: "paul+p4_3b_yema_admin_no_bind@example.com",
  yemaAdminWithBind: "paul+p4_3b_yema_admin_with_bind@example.com",
};
const CLASS_A1 = "test_p4_3b_class_a1";
const CLASS_B1 = "test_p4_3b_class_b1";
const TEACHER_B_HINT = "test_p4_3b_teacher_b_id_placeholder"; // ignoré côté serveur
const CENTER_B = "test_p4_3b_center_b";

const events = [];
function log(label, obj) {
  events.push({ label, ...obj });
  process.stderr.write(`  ${label} · ${JSON.stringify(obj)}\n`);
}

async function login(page, email) {
  await page.goto(`${BASE}/fr/login`, { waitUntil: "networkidle", timeout: 30000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', PW);
  const tokenResp = page.waitForResponse(
    (r) => /supabase\.co\/auth\/v1\/token/.test(r.url()),
    { timeout: 30000 },
  ).catch(() => null);
  await page.click('button[type="submit"]');
  await tokenResp;
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    const cs = await page.context().cookies();
    if (cs.some((c) => /^sb-.+-auth-token/.test(c.name))) return;
    await page.waitForTimeout(300);
  }
}

async function ctxFor(browser, email) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await login(page, email);
  const cookies = await ctx.cookies();
  return { ctx, cookie: cookies.map((c) => `${c.name}=${c.value}`).join("; ") };
}

async function get(cookie, path, extraHeaders = {}) {
  const r = await fetch(`${BASE}${path}`, {
    headers: { ...(cookie ? { cookie } : {}), ...extraHeaders },
  });
  const body = await r.json().catch(() => null);
  return { status: r.status, body };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    const teacherA = await ctxFor(browser, EMAILS.teacherA);
    const teacherB = await ctxFor(browser, EMAILS.teacherB);
    const teacherZero = await ctxFor(browser, EMAILS.teacherZero);
    const teacherAmbig = await ctxFor(browser, EMAILS.teacherAmbig);
    const centerAdmin = await ctxFor(browser, EMAILS.centerAdmin);
    const studentA1 = await ctxFor(browser, EMAILS.studentA1);
    const racinesCoach = await ctxFor(browser, EMAILS.racinesCoach);
    const yemaAdminNoBind = await ctxFor(browser, EMAILS.yemaAdminNoBind);
    const yemaAdminWithBind = await ctxFor(browser, EMAILS.yemaAdminWithBind);

    // === /api/teacher/me ===
    process.stderr.write("\n═══ /api/teacher/me ═══\n");
    for (const [label, ctx, expectStatus] of [
      ["teacherA", teacherA, 200],
      ["teacherB", teacherB, 200],
      ["teacherZero (expect 404)", teacherZero, 404],
      ["teacherAmbig (expect ONE_BINDING · 200 unique Teacher row)", teacherAmbig, 200],
      ["centerAdmin (expect 403)", centerAdmin, 403],
      ["studentA1 (expect 403)", studentA1, 403],
      ["racinesCoach (expect 403)", racinesCoach, 403],
      // P4.3b hardening §7 · YEMA_ADMIN sans Teacher row · rôle global
      // ne suffit pas · attend 404 (ZERO_BINDING via TEACHER_ACCESS_DENIED path
      // ou NOT_FOUND · résultat contractuel = 404 sans row Teacher).
      ["yemaAdminNoBind (expect 404 zero binding)", yemaAdminNoBind, 404],
      // P4.3b hardening §7 · YEMA_ADMIN AVEC Teacher row · l'accès provient
      // du binding · attend 200 même si le rôle global est identique au précédent.
      ["yemaAdminWithBind (expect 200 via binding)", yemaAdminWithBind, 200],
    ]) {
      const r = await get(ctx.cookie, "/api/teacher/me");
      log(label, { status: r.status, expected: expectStatus, code: r.body?.code, teacherId: r.body?.teacher?.id });
    }
    const anon = await get(null, "/api/teacher/me");
    log("anon (expect 401)", { status: anon.status });

    // === /api/teacher/dashboard ===
    process.stderr.write("\n═══ /api/teacher/dashboard ═══\n");
    const dA = await get(teacherA.cookie, "/api/teacher/dashboard");
    log("teacherA dashboard", { status: dA.status, stats: dA.body?.stats });
    const dB = await get(teacherB.cookie, "/api/teacher/dashboard");
    log("teacherB dashboard", { status: dB.status, stats: dB.body?.stats });

    // === /api/teacher/classes ===
    process.stderr.write("\n═══ /api/teacher/classes cross-teacher ═══\n");
    const cA = await get(teacherA.cookie, "/api/teacher/classes");
    log("teacherA classes", {
      status: cA.status,
      count: cA.body?.items?.length,
      ids: cA.body?.items?.map((c) => c.id) ?? [],
    });
    const cB = await get(teacherB.cookie, "/api/teacher/classes");
    log("teacherB classes", {
      status: cB.status,
      count: cB.body?.items?.length,
      ids: cB.body?.items?.map((c) => c.id) ?? [],
    });
    log("cross-teacher · A ∩ B classes", {
      overlap: (cA.body?.items ?? []).map((c) => c.id).filter((id) =>
        (cB.body?.items ?? []).some((cb) => cb.id === id)
      ),
      expected: [],
    });

    // === /api/teacher/classes/[id] foreign ===
    process.stderr.write("\n═══ classes/[id] cross-teacher ═══\n");
    const foreignDetail = await get(teacherA.cookie, `/api/teacher/classes/${CLASS_B1}`);
    log("teacherA GET class B1 (expect 404 class_not_found)", {
      status: foreignDetail.status, code: foreignDetail.body?.code,
    });
    const ownDetail = await get(teacherA.cookie, `/api/teacher/classes/${CLASS_A1}`);
    log("teacherA GET class A1 (expect 200)", {
      status: ownDetail.status, name: ownDetail.body?.classroom?.name,
    });

    // === /api/teacher/classes/[id]/students foreign ===
    const foreignStudents = await get(teacherA.cookie, `/api/teacher/classes/${CLASS_B1}/students`);
    log("teacherA students of class B1 (expect 404)", {
      status: foreignStudents.status, code: foreignStudents.body?.code,
    });
    const ownStudents = await get(teacherA.cookie, `/api/teacher/classes/${CLASS_A1}/students`);
    log("teacherA students of class A1 (expect 200 · 2 active, retired excluded)", {
      status: ownStudents.status,
      count: ownStudents.body?.items?.length,
      names: ownStudents.body?.items?.map((s) => s.fullName) ?? [],
    });

    // === Aggregated /api/teacher/students ===
    process.stderr.write("\n═══ /api/teacher/students agrégés ═══\n");
    const sA = await get(teacherA.cookie, "/api/teacher/students");
    log("teacherA all students", {
      status: sA.status, count: sA.body?.items?.length,
      names: sA.body?.items?.map((s) => s.fullName) ?? [],
    });
    const sB = await get(teacherB.cookie, "/api/teacher/students");
    log("teacherB all students", {
      status: sB.status, count: sB.body?.items?.length,
      names: sB.body?.items?.map((s) => s.fullName) ?? [],
    });
    log("cross-teacher · A ∩ B students", {
      overlap: (sA.body?.items ?? []).map((s) => s.id).filter((id) =>
        (sB.body?.items ?? []).some((sb) => sb.id === id)
      ),
      expected: [],
    });

    // === Injections ===
    process.stderr.write("\n═══ Injections centerId/teacherId/classroomId ═══\n");
    const injQ = await get(teacherA.cookie, `/api/teacher/classes?teacherId=${TEACHER_B_HINT}&centerId=${CENTER_B}`);
    log("teacherA classes?teacherId=B&centerId=B (must be ignored)", {
      status: injQ.status, count: injQ.body?.items?.length,
      firstClassId: injQ.body?.items?.[0]?.id,
    });
    const injH = await get(teacherA.cookie, "/api/teacher/me", {
      "x-teacher-id": TEACHER_B_HINT, "x-center-id": CENTER_B,
    });
    log("teacherA me + x-teacher-id + x-center-id headers", {
      status: injH.status, teacherId: injH.body?.teacher?.id,
    });

    // === /api/teacher/schedule (LOCK_HONESTLY) ===
    const sched = await get(teacherA.cookie, "/api/teacher/schedule");
    log("teacherA schedule (LOCK_HONESTLY)", {
      status: sched.status, available: sched.body?.schedule?.available,
    });

    // === Legacy endpoint ===
    process.stderr.write("\n═══ Legacy /api/teacher · 404 deprecated ═══\n");
    for (const path of ["/api/teacher", "/api/teacher?action=classrooms", "/api/teacher?action=students"]) {
      const r = await get(teacherA.cookie, path);
      log(`teacherA GET ${path}`, { status: r.status, code: r.body?.code });
    }

    await Promise.all([
      teacherA.ctx.close(), teacherB.ctx.close(),
      teacherZero.ctx.close(), teacherAmbig.ctx.close(),
      centerAdmin.ctx.close(), studentA1.ctx.close(), racinesCoach.ctx.close(),
      yemaAdminNoBind.ctx.close(), yemaAdminWithBind.ctx.close(),
    ]);
  } finally {
    await browser.close();
  }
  const { writeFile, mkdir } = await import("node:fs/promises");
  await mkdir("/tmp/p4-3b-captures", { recursive: true });
  await writeFile("/tmp/p4-3b-captures/smoke.json", JSON.stringify(events, null, 2));
  process.stderr.write(`\nWritten /tmp/p4-3b-captures/smoke.json (${events.length} events)\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
