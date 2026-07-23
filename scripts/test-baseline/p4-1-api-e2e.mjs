// P4.1 · Test API `/api/circles*` avec CIRCLE_ENABLED=true (local uniquement).
//
// Prérequis · fixtures posées (`p4-1-fixtures.mjs seed`) · dev server lancé
// avec `YEMA_CIRCLE_ENABLED=true` en env `.env.p1-baseline`.
//
// Utilise Playwright pour se connecter via /fr/login (cookies SSR Supabase)
// puis appelle les endpoints avec ces cookies. Tests · owner, adult, coach
// assigné, coach non assigné, cross-tenant, membre retiré, anon,
// body.userId injecté (doit être ignoré), archive idempotent.

import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const PW = process.env.P1_TEST_PASSWORD;
if (!PW) { console.error("P1_TEST_PASSWORD required"); process.exit(1); }

const EMAILS = {
  ownerA:   "paul+p4_1_owner_a@example.com",
  adultA:   "paul+p4_1_adult_a@example.com",
  ownerB:   "paul+p4_1_owner_b@example.com",
  coachA:   "paul+p4_1_coach_a@example.com",
};
const CIRCLE_A = "test_p4_1_circle_a_lingala";
const CIRCLE_B = "test_p4_1_circle_b_wolof";
const HH_A = "test_p4_1_hh_a";
const HH_B = "test_p4_1_hh_b";

const events = [];
function log(label, obj) {
  events.push({ label, ...obj });
  process.stderr.write(`  ${label} · ${JSON.stringify(obj)}\n`);
}

async function login(page, email) {
  await page.goto(`${BASE}/fr/login`, { waitUntil: "networkidle", timeout: 30000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', PW);
  await Promise.all([
    page.waitForResponse((r) => /supabase\.co\/auth\/v1\/token/.test(r.url()), { timeout: 20000 }).catch(() => null),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForTimeout(1500);
}

async function cookieHeader(ctx) {
  const cookies = await ctx.cookies();
  return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
}

async function ctxFor(browser, email) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await login(page, email);
  const cookie = await cookieHeader(ctx);
  return { ctx, page, cookie };
}

async function get(cookie, path) {
  const r = await fetch(`${BASE}${path}`, { headers: cookie ? { cookie } : {} });
  const body = await r.json().catch(() => null);
  return { status: r.status, body };
}
async function post(cookie, path, payload) {
  const r = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(payload ?? {}),
  });
  const body = await r.json().catch(() => null);
  return { status: r.status, body };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    // === Sessions ===
    const owner = await ctxFor(browser, EMAILS.ownerA);
    const adult = await ctxFor(browser, EMAILS.adultA);
    const coach = await ctxFor(browser, EMAILS.coachA);
    const ownerB = await ctxFor(browser, EMAILS.ownerB);

    // === GET /api/circles/[circleId] ===
    process.stderr.write("\n═══ GET /api/circles/[circleId] ═══\n");
    log("owner A · GET own circle", await get(owner.cookie, `/api/circles/${CIRCLE_A}`));
    log("adult A · GET own circle", await get(adult.cookie, `/api/circles/${CIRCLE_A}`));
    log("coach A · GET assigned circle", await get(coach.cookie, `/api/circles/${CIRCLE_A}`));
    log("owner B · GET circle A (cross-tenant · expect 403)", await get(ownerB.cookie, `/api/circles/${CIRCLE_A}`));
    log("coach A · GET circle B (not assigned · expect 403)", await get(coach.cookie, `/api/circles/${CIRCLE_B}`));
    log("anon · GET circle A (expect 401)", await get(null, `/api/circles/${CIRCLE_A}`));

    // === POST /api/circles ===
    process.stderr.write("\n═══ POST /api/circles ═══\n");
    // Owner tente de créer un nouveau Circle langue non utilisée
    log("owner A · POST /api/circles DOUALA (fresh · expect 200)", await post(owner.cookie, `/api/circles`, { householdId: HH_A, language: "DOUALA" }));
    // Duplicate ACTIVE LINGALA → 409
    log("owner A · POST /api/circles LINGALA dup (expect 409)", await post(owner.cookie, `/api/circles`, { householdId: HH_A, language: "LINGALA" }));
    // Adulte non-owner tente création · rejeté
    log("adult A · POST /api/circles (expect 403)", await post(adult.cookie, `/api/circles`, { householdId: HH_A, language: "YORUBA" }));
    // Cross-tenant · owner B tente sur foyer A · rejeté
    log("owner B · POST /api/circles foreign household (expect 403)", await post(ownerB.cookie, `/api/circles`, { householdId: HH_A, language: "YORUBA" }));
    // Anon → 401
    log("anon · POST /api/circles (expect 401)", await post(null, `/api/circles`, { householdId: HH_A, language: "YORUBA" }));
    // body.userId injecté doit être ignoré (rejeté par validation ou silencieusement dropped)
    log("owner A · POST with body.userId injected (must be ignored)", await post(owner.cookie, `/api/circles`, {
      householdId: HH_A, language: "BAMBARA", userId: "fake-user-id",
    }));

    // Récupérer id du DOUALA créé pour archive test
    const doualaResp = await get(owner.cookie, `/api/circles`); // no list endpoint · skip
    // Fetch via Prisma via smoke? Use SQL admin instead
    const { default: pg } = await import("pg");
    const c = new pg.Client({ connectionString: process.env.DIRECT_URL });
    await c.connect();
    const doualaRow = await c.query("SELECT id FROM circles WHERE \"householdId\" = $1 AND language = 'DOUALA' AND \"archivedAt\" IS NULL", [HH_A]);
    const bambaraRow = await c.query("SELECT id FROM circles WHERE \"householdId\" = $1 AND language = 'BAMBARA' AND \"archivedAt\" IS NULL", [HH_A]);
    log("doula / bambara created in DB", {
      doualaId: doualaRow.rows[0]?.id, bambaraId: bambaraRow.rows[0]?.id,
    });

    // === POST /api/circles/[id]/archive ===
    if (doualaRow.rows[0]) {
      const doualaId = doualaRow.rows[0].id;
      process.stderr.write("\n═══ POST /api/circles/[id]/archive ═══\n");
      log("owner A · archive DOUALA (expect 200)", await post(owner.cookie, `/api/circles/${doualaId}/archive`));
      log("owner A · archive DOUALA again (idempotent · expect 200)", await post(owner.cookie, `/api/circles/${doualaId}/archive`));
      log("adult A · archive DOUALA (expect 403)", await post(adult.cookie, `/api/circles/${doualaId}/archive`));
      log("coach A · archive DOUALA (expect 403)", await post(coach.cookie, `/api/circles/${doualaId}/archive`));
      log("owner B · archive DOUALA (expect 403)", await post(ownerB.cookie, `/api/circles/${doualaId}/archive`));

      // After archive, recreate same language on same household → doit passer
      log("owner A · POST DOUALA after archive (expect 200)", await post(owner.cookie, `/api/circles`, { householdId: HH_A, language: "DOUALA" }));

      // Vérifier archivedAt + AuditEvent
      const archived = await c.query("SELECT \"archivedAt\", status FROM circles WHERE id = $1", [doualaId]);
      log("DB state after archive", {
        archivedAt: !!archived.rows[0]?.archivedAt,
        status: archived.rows[0]?.status,
      });
      const auditRows = await c.query(
        "SELECT action FROM audit_events WHERE \"targetId\" = $1 ORDER BY \"createdAt\"",
        [doualaId],
      );
      log("AuditEvents for DOUALA", { actions: auditRows.rows.map((r) => r.action) });

      // Cleanup les circles créés
      const cleanup = await c.query(
        "DELETE FROM circles WHERE \"householdId\" = $1 AND language IN ('DOUALA', 'BAMBARA', 'YORUBA') RETURNING id",
        [HH_A],
      );
      log("cleanup created circles", { removed: cleanup.rows.length });
    }
    await c.end();

    // === Test membre REMOVED ===
    process.stderr.write("\n═══ Membre REMOVED ═══\n");
    const c2 = new pg.Client({ connectionString: process.env.DIRECT_URL });
    await c2.connect();
    const adultUser = await c2.query("SELECT id FROM users WHERE email = $1", [EMAILS.adultA]);
    await c2.query(
      "UPDATE circle_memberships SET status = 'REMOVED', \"removedAt\" = NOW() WHERE \"circleId\" = $1 AND \"userId\" = $2",
      [CIRCLE_A, adultUser.rows[0].id],
    );
    log("adult A membership set REMOVED · GET expect 403", await get(adult.cookie, `/api/circles/${CIRCLE_A}`));
    // Restore
    await c2.query(
      "UPDATE circle_memberships SET status = 'ACTIVE', \"removedAt\" = NULL WHERE \"circleId\" = $1 AND \"userId\" = $2",
      [CIRCLE_A, adultUser.rows[0].id],
    );
    await c2.end();

    await Promise.all([owner.ctx.close(), adult.ctx.close(), coach.ctx.close(), ownerB.ctx.close()]);
  } finally {
    await browser.close();
  }
  const { writeFile, mkdir } = await import("node:fs/promises");
  await mkdir("/tmp/p4-1-captures", { recursive: true });
  await writeFile("/tmp/p4-1-captures/api-e2e.json", JSON.stringify(events, null, 2));
  process.stderr.write(`\nWritten /tmp/p4-1-captures/api-e2e.json (${events.length} events)\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
