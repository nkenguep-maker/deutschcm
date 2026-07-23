// P4.3a · Smoke test P-1 · cross-tenant + role isolation + injection.
// Prérequis · fixtures seedées + dev server avec YEMA_CENTER_REAL_DATA_ENABLED=true.

import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const PW = process.env.P1_TEST_PASSWORD;
if (!PW) { console.error("P1_TEST_PASSWORD required"); process.exit(1); }

const EMAILS = {
  adminA:    "paul+p4_3a_admin_a@example.com",
  adminB:    "paul+p4_3a_admin_b@example.com",
  teacherA:  "paul+p4_3a_teacher_a@example.com",
  studentA1: "paul+p4_3a_student_a1@example.com",
  zeroBind:  "paul+p4_3a_zerobind@example.com",
  ambig:     "paul+p4_3a_ambig@example.com",
  racinesCoach: "paul+p4_3a_racines_coach@example.com",
};
const CENTER_A = "test_p4_3a_center_a";
const CENTER_B = "test_p4_3a_center_b";
const CLASS_A1 = "test_p4_3a_class_a1";
const CLASS_B1 = "test_p4_3a_class_b1";

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
  // Attendre la pose des cookies sb-*-auth-token par le callback proxy.
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
  const cookie = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
  const authCookieCount = cookies.filter((c) => /^sb-.+-auth-token/.test(c.name)).length;
  process.stderr.write(`  · login ${email} · ${authCookieCount} auth cookie(s) set\n`);
  return { ctx, page, cookie };
}

async function get(cookie, path) {
  const r = await fetch(`${BASE}${path}`, { headers: cookie ? { cookie } : {} });
  const body = await r.json().catch(() => null);
  return { status: r.status, body };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    const adminA = await ctxFor(browser, EMAILS.adminA);
    const adminB = await ctxFor(browser, EMAILS.adminB);
    const teacherA = await ctxFor(browser, EMAILS.teacherA);
    const studentA1 = await ctxFor(browser, EMAILS.studentA1);
    const zeroBind = await ctxFor(browser, EMAILS.zeroBind);
    const ambig = await ctxFor(browser, EMAILS.ambig);
    const racinesCoach = await ctxFor(browser, EMAILS.racinesCoach);

    // === /api/center/me ===
    process.stderr.write("\n═══ /api/center/me ═══\n");
    const meA = await get(adminA.cookie, "/api/center/me");
    log("adminA · me", { status: meA.status, centerId: meA.body?.center?.id, name: meA.body?.center?.name });
    const meB = await get(adminB.cookie, "/api/center/me");
    log("adminB · me", { status: meB.status, centerId: meB.body?.center?.id });
    const meT = await get(teacherA.cookie, "/api/center/me");
    log("teacherA · me (expect 403)", { status: meT.status, code: meT.body?.code });
    const meS = await get(studentA1.cookie, "/api/center/me");
    log("studentA1 · me (expect 403)", { status: meS.status, code: meS.body?.code });
    const meAnon = await get(null, "/api/center/me");
    log("anon · me (expect 401)", { status: meAnon.status });

    // === /api/center/dashboard ===
    process.stderr.write("\n═══ /api/center/dashboard ═══\n");
    const dA = await get(adminA.cookie, "/api/center/dashboard");
    log("adminA · dashboard stats", {
      status: dA.status,
      centerId: dA.body?.center?.id,
      stats: dA.body?.stats,
    });
    const dB = await get(adminB.cookie, "/api/center/dashboard");
    log("adminB · dashboard stats", {
      status: dB.status, centerId: dB.body?.center?.id, stats: dB.body?.stats,
    });

    // === /api/center/teachers cross-tenant ===
    process.stderr.write("\n═══ /api/center/teachers cross-tenant ═══\n");
    const tA = await get(adminA.cookie, "/api/center/teachers");
    log("adminA · teachers list", {
      status: tA.status,
      count: tA.body?.items?.length,
      names: tA.body?.items?.map((t) => t.fullName) ?? [],
    });
    const tB = await get(adminB.cookie, "/api/center/teachers");
    log("adminB · teachers list", {
      status: tB.status,
      count: tB.body?.items?.length,
      names: tB.body?.items?.map((t) => t.fullName) ?? [],
    });
    log("cross-tenant · adminA names ∩ adminB names", {
      overlap: (tA.body?.items ?? [])
        .map((t) => t.fullName)
        .filter((n) => (tB.body?.items ?? []).some((tb) => tb.fullName === n)),
      expect: [],
    });

    // === /api/center/classes ===
    const cA = await get(adminA.cookie, "/api/center/classes");
    log("adminA · classes list", {
      status: cA.status,
      count: cA.body?.items?.length,
      ids: cA.body?.items?.map((x) => x.id) ?? [],
    });
    const cB = await get(adminB.cookie, "/api/center/classes");
    log("adminB · classes list", {
      status: cB.status,
      count: cB.body?.items?.length,
      ids: cB.body?.items?.map((x) => x.id) ?? [],
    });
    log("cross-tenant · adminA sees Class B", {
      seesB: (cA.body?.items ?? []).some((c) => c.id === CLASS_B1),
      expect: false,
    });

    // === /api/center/students · classId B injected (must return empty) ===
    process.stderr.write("\n═══ /api/center/students · classId B injecté ═══\n");
    const sA = await get(adminA.cookie, "/api/center/students");
    log("adminA · students (own)", {
      status: sA.status,
      count: sA.body?.items?.length,
      names: sA.body?.items?.map((s) => s.fullName) ?? [],
    });
    const sInject = await get(adminA.cookie, `/api/center/students?classId=${CLASS_B1}`);
    log("adminA · students?classId=CLASS_B1 (foreign · expect empty)", {
      status: sInject.status,
      count: sInject.body?.items?.length,
      expect: 0,
    });

    // === /api/center/enrollments ===
    const eA = await get(adminA.cookie, "/api/center/enrollments");
    log("adminA · pending enrollments", {
      status: eA.status,
      count: eA.body?.items?.length,
    });
    const eB = await get(adminB.cookie, "/api/center/enrollments");
    log("adminB · pending enrollments (must not see A's)", {
      status: eB.status,
      count: eB.body?.items?.length,
    });

    // === body.centerId / query.centerId injection ignored ===
    process.stderr.write("\n═══ Injection centerId · body/query ignored ═══\n");
    const injQ = await get(adminA.cookie, `/api/center/teachers?centerId=${CENTER_B}`);
    log("adminA · teachers?centerId=B (query · must be ignored)", {
      status: injQ.status,
      count: injQ.body?.items?.length,
      // Doit rester sur les données du centre A
      firstTeacher: injQ.body?.items?.[0]?.fullName,
    });

    // === Header injection ===
    const injH = await fetch(`${BASE}/api/center/me`, {
      headers: { cookie: adminA.cookie, "x-center-id": CENTER_B },
    });
    log("adminA · me + x-center-id=B header (must be ignored)", {
      status: injH.status,
      centerId: (await injH.json()).center?.id,
    });

    // === ZERO_BINDING ===
    process.stderr.write("\n═══ Bindings edge cases ═══\n");
    const zbMe = await get(zeroBind.cookie, "/api/center/me");
    log("zeroBind · me (expect 404 no membership)", { status: zbMe.status, code: zbMe.body?.code });

    // === AMBIGUOUS_BINDING ===
    const amMe = await get(ambig.cookie, "/api/center/me");
    log("ambig · me (expect 409 center_scope_ambiguous)", { status: amMe.status, code: amMe.body?.code });

    // === Racines coach on Center APIs ===
    const rcMe = await get(racinesCoach.cookie, "/api/center/me");
    log("racinesCoach · me (expect 403)", { status: rcMe.status, code: rcMe.body?.code });

    // === Legacy endpoints must return 404 deprecated ===
    process.stderr.write("\n═══ Legacy endpoints · 404 deprecated ═══\n");
    for (const path of ["/api/center", "/api/center?action=students",
                        "/api/center?action=stats&centerId=" + CENTER_B]) {
      const r = await get(adminA.cookie, path);
      log(`adminA · GET ${path} (expect 404)`, { status: r.status, code: r.body?.code });
    }
    const joinR = await fetch(`${BASE}/api/center/join`, {
      method: "POST", headers: { cookie: studentA1.cookie, "content-type": "application/json" },
      body: JSON.stringify({ code: "P43A_A" }),
    });
    const joinBody = await joinR.json().catch(() => null);
    log("studentA1 · POST /api/center/join (expect 404 deprecated)", {
      status: joinR.status, code: joinBody?.code,
    });

    await Promise.all([adminA.ctx.close(), adminB.ctx.close(), teacherA.ctx.close(), studentA1.ctx.close(),
                       zeroBind.ctx.close(), ambig.ctx.close(), racinesCoach.ctx.close()]);
  } finally {
    await browser.close();
  }
  const { writeFile, mkdir } = await import("node:fs/promises");
  await mkdir("/tmp/p4-3a-captures", { recursive: true });
  await writeFile("/tmp/p4-3a-captures/smoke.json", JSON.stringify(events, null, 2));
  process.stderr.write(`\nWritten /tmp/p4-3a-captures/smoke.json (${events.length} events)\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
