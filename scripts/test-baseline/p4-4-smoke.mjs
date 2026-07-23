// P4.4 · Smoke test P-1 · Roots Coach workspace.
// Prérequis · fixtures seedées + dev server avec flags ON.

import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const PW = process.env.P1_TEST_PASSWORD;
if (!PW) { console.error("P1_TEST_PASSWORD required"); process.exit(1); }

const EMAILS = {
  coachA:              "paul+p4_4_coach_a@example.com",
  coachB:              "paul+p4_4_coach_b@example.com",
  coachRemoved:        "paul+p4_4_coach_removed@example.com",
  careerCoach:         "paul+p4_4_career_coach@example.com",
  yemaAdminNoBinding:  "paul+p4_4_admin_no_bind@example.com",
  teacherHostile:      "paul+p4_4_teacher_hostile@example.com",
  centerAdminHostile:  "paul+p4_4_center_admin_hostile@example.com",
  studentHostile:      "paul+p4_4_student_hostile@example.com",
};
const CIRCLE_A = "test_p4_4_circle_a";
const CIRCLE_B = "test_p4_4_circle_b";
const CIRCLE_ARCH = "test_p4_4_circle_arch";
const CHILD_A_1 = "test_p4_4_child_a_1";
const CHILD_B_1 = "test_p4_4_child_b_1";

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
    const coachA = await ctxFor(browser, EMAILS.coachA);
    const coachB = await ctxFor(browser, EMAILS.coachB);
    const coachRemoved = await ctxFor(browser, EMAILS.coachRemoved);
    const careerCoach = await ctxFor(browser, EMAILS.careerCoach);
    const adminNoBind = await ctxFor(browser, EMAILS.yemaAdminNoBinding);
    const teacher = await ctxFor(browser, EMAILS.teacherHostile);
    const centerAdmin = await ctxFor(browser, EMAILS.centerAdminHostile);
    const student = await ctxFor(browser, EMAILS.studentHostile);

    // === /api/roots-coach/me ===
    process.stderr.write("\n═══ /api/roots-coach/me ═══\n");
    for (const [label, ctx, expectStatus] of [
      ["coachA (expect 200)", coachA, 200],
      ["coachB (expect 200)", coachB, 200],
      ["coachRemoved · rôle OK mais aucun membership actif · 200 (dashboard vide)", coachRemoved, 200],
      ["careerCoach (expect 403 · CAREER_COACH ≠ RACINES_COACH)", careerCoach, 403],
      ["adminNoBind (expect 403 · rôle global ne suffit pas)", adminNoBind, 403],
      ["teacher (expect 403)", teacher, 403],
      ["centerAdmin (expect 403)", centerAdmin, 403],
      ["student (expect 403)", student, 403],
    ]) {
      const r = await get(ctx.cookie, "/api/roots-coach/me");
      log(label, {
        status: r.status, expected: expectStatus, code: r.body?.code,
        activeCircleCount: r.body?.activeCircleCount,
      });
    }
    const anon = await get(null, "/api/roots-coach/me");
    log("anon (expect 401)", { status: anon.status });

    // === /api/roots-coach/dashboard ===
    process.stderr.write("\n═══ /api/roots-coach/dashboard ═══\n");
    const dashA = await get(coachA.cookie, "/api/roots-coach/dashboard");
    log("coachA dashboard", {
      status: dashA.status,
      stats: dashA.body?.stats,
    });
    const dashB = await get(coachB.cookie, "/api/roots-coach/dashboard");
    log("coachB dashboard", {
      status: dashB.status,
      stats: dashB.body?.stats,
    });

    // === /api/roots-coach/circles ===
    process.stderr.write("\n═══ /api/roots-coach/circles cross-coach ═══\n");
    const cA = await get(coachA.cookie, "/api/roots-coach/circles");
    log("coachA circles", {
      status: cA.status, count: cA.body?.items?.length,
      ids: cA.body?.items?.map((x) => x.id) ?? [],
    });
    const cB = await get(coachB.cookie, "/api/roots-coach/circles");
    log("coachB circles", {
      status: cB.status, count: cB.body?.items?.length,
      ids: cB.body?.items?.map((x) => x.id) ?? [],
    });
    log("cross-coach · A ∩ B circles", {
      overlap: (cA.body?.items ?? []).map((c) => c.id).filter((id) =>
        (cB.body?.items ?? []).some((cb) => cb.id === id)
      ),
      expected: [],
    });

    // === Coach A demande Circle B (étranger) ===
    const foreignCircle = await get(coachA.cookie, `/api/roots-coach/circles/${CIRCLE_B}`);
    log("coachA → circle B (expect 404)", { status: foreignCircle.status, code: foreignCircle.body?.code });

    // === Coach A demande Circle Archivé ===
    const archCircle = await get(coachA.cookie, `/api/roots-coach/circles/${CIRCLE_ARCH}`);
    log("coachA → circle archived (expect 404)", { status: archCircle.status, code: archCircle.body?.code });

    // === Coach A demande son Circle A (200) ===
    const ownCircle = await get(coachA.cookie, `/api/roots-coach/circles/${CIRCLE_A}`);
    log("coachA → circle A (expect 200)", {
      status: ownCircle.status,
      circleId: ownCircle.body?.circle?.id,
      childCount: ownCircle.body?.circle?.activeChildCount,
    });

    // === Coach Removed sur Circle A (Q10 · révocation immédiate) ===
    const removedAccess = await get(coachRemoved.cookie, `/api/roots-coach/circles/${CIRCLE_A}`);
    log("coachRemoved → circle A (expect 404 · assignment revoked)", {
      status: removedAccess.status, code: removedAccess.body?.code,
    });

    // === Profils · Coach A ne voit que ses enfants (A1, A2) ===
    process.stderr.write("\n═══ /api/roots-coach/profiles projection minimale ═══\n");
    const pA = await get(coachA.cookie, "/api/roots-coach/profiles");
    log("coachA profiles", {
      status: pA.status, count: pA.body?.items?.length,
      ids: pA.body?.items?.map((p) => p.id) ?? [],
      displayNames: pA.body?.items?.map((p) => p.displayName) ?? [],
      ageBands: pA.body?.items?.map((p) => p.ageBand) ?? [],
      // Vérifier qu'aucune colonne sensible ne fuite.
      firstItemKeys: Object.keys(pA.body?.items?.[0] ?? {}).sort(),
    });
    const pB = await get(coachB.cookie, "/api/roots-coach/profiles");
    log("coachB profiles", {
      status: pB.status, count: pB.body?.items?.length,
      ids: pB.body?.items?.map((p) => p.id) ?? [],
    });
    log("cross-coach · A ∩ B profiles", {
      overlap: (pA.body?.items ?? []).map((p) => p.id).filter((id) =>
        (pB.body?.items ?? []).some((pb) => pb.id === id)
      ),
      expected: [],
    });

    // === Coach A demande profil B (étranger) ===
    const foreignChild = await get(coachA.cookie, `/api/roots-coach/profiles/${CHILD_B_1}`);
    log("coachA → child B1 (expect 404)", { status: foreignChild.status, code: foreignChild.body?.code });

    // === Coach A demande profil A1 (200) ===
    const ownChild = await get(coachA.cookie, `/api/roots-coach/profiles/${CHILD_A_1}`);
    log("coachA → child A1 (expect 200)", {
      status: ownChild.status,
      profile: ownChild.body?.profile ? {
        displayName: ownChild.body.profile.displayName,
        ageBand: ownChild.body.profile.ageBand,
        keys: Object.keys(ownChild.body.profile).sort(),
      } : null,
    });

    // === Capacity ===
    const capA = await get(coachA.cookie, "/api/roots-coach/capacity");
    log("coachA capacity", { status: capA.status, capacity: capA.body?.capacity });

    // === Injections ===
    process.stderr.write("\n═══ Injections coachId/circleId/childProfileId ═══\n");
    const injQ = await get(coachA.cookie,
      `/api/roots-coach/circles?coachId=${EMAILS.coachB}&circleId=${CIRCLE_B}`);
    log("coachA circles?coachId=B&circleId=B (must be ignored)", {
      status: injQ.status,
      firstCircleId: injQ.body?.items?.[0]?.id,
      count: injQ.body?.items?.length,
    });
    const injH = await get(coachA.cookie, "/api/roots-coach/me", {
      "x-coach-id": EMAILS.coachB, "x-circle-id": CIRCLE_B,
    });
    log("coachA me + x-coach-id + x-circle-id headers", {
      status: injH.status, activeCircleCount: injH.body?.activeCircleCount,
    });

    await Promise.all([
      coachA.ctx.close(), coachB.ctx.close(), coachRemoved.ctx.close(),
      careerCoach.ctx.close(), adminNoBind.ctx.close(),
      teacher.ctx.close(), centerAdmin.ctx.close(), student.ctx.close(),
    ]);
  } finally {
    await browser.close();
  }
  const { writeFile, mkdir } = await import("node:fs/promises");
  await mkdir("/tmp/p4-4-captures", { recursive: true });
  await writeFile("/tmp/p4-4-captures/smoke.json", JSON.stringify(events, null, 2));
  process.stderr.write(`\nWritten /tmp/p4-4-captures/smoke.json (${events.length} events)\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
