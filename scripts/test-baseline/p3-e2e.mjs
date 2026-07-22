// P3 · E2E parcours Racines · Solo, Family, cross-household, no-content, mobile.
// P-1 baseline uniquement · kzzagbojjkivdzzcrmxn.

import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const BASE = "http://localhost:3000";
const PW = process.env.P1_TEST_PASSWORD;
if (!PW) { console.error("P1_TEST_PASSWORD required"); process.exit(1); }

const EMAILS = {
  solo:    "paul+yema_test_racines_solo@example.com",
  family:  "paul+yema_test_racines_family@example.com",
  monde:   "paul+yema_test_monde@example.com",
  teacher: "paul+yema_test_teacher@example.com",
};

const results = [];
function log(label, obj) { results.push({ label, ...obj }); process.stderr.write(`  ${label}: ${JSON.stringify(obj)}\n`); }

async function login(page, email, prefix = "fr") {
  await page.goto(`${BASE}/${prefix}/login`, { waitUntil: "networkidle", timeout: 30000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', PW);
  await Promise.all([
    page.waitForResponse(r => /supabase\.co\/auth\/v1\/token/.test(r.url()), { timeout: 20000 }).catch(() => null),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForTimeout(2500);
}

async function measure(page, vw) {
  return page.evaluate((vw) => {
    const scrollW = document.documentElement.scrollWidth;
    const clientW = document.documentElement.clientWidth;
    let ovf = 0;
    for (const el of Array.from(document.querySelectorAll("body *"))) {
      const r = el.getBoundingClientRect();
      if (r.right > vw + 1 && r.width < vw * 2 && r.width > 0) ovf++;
    }
    return { scrollW, clientW, pageOverflow: scrollW - clientW, overflowCount: ovf };
  }, vw);
}

async function scanRoutes(browser, email, label, routes, viewports = [{ w: 390, h: 844, n: "390" }, { w: 1440, h: 900, n: "1440" }]) {
  process.stderr.write(`\n═══ ${label} ═══\n`);
  for (const vp of viewports) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
    const page = await ctx.newPage();
    await login(page, email, "fr");
    for (const route of routes) {
      const resp = await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 20000 });
      await page.waitForTimeout(700);
      const finalPath = new URL(page.url()).pathname;
      const m = await measure(page, vp.w);
      const text = await page.evaluate(() => document.body?.innerText ?? "");
      log(`${label} @${vp.n} ${route}`, {
        http: resp?.status() ?? 0,
        final: finalPath,
        pageOverflow: m.pageOverflow, ovf: m.overflowCount,
        hasBientot: /Bientôt|Coming soon|arrive bientôt/i.test(text),
        hasFakeName: /Sophie Tanda|Marie N\.|Prof\. Sophie/i.test(text),
        hasCECR: /\bA1\b|\bA2\b|\bB1\b|\bB2\b|\bC1\b/.test(text),
        hasStepE: /É[1-5]|E[1-5] /.test(text),
      });
    }
    await ctx.close();
  }
}

async function fetchState(browser, email) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await login(page, email, "fr");
  const cookies = await ctx.cookies();
  const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join("; ");
  const resp = await fetch(`${BASE}/api/me/racines-dashboard`, { headers: { cookie: cookieHeader } });
  const body = await resp.json().catch(() => null);
  await ctx.close();
  return { status: resp.status, body };
}

async function crossHouseholdCheck(browser) {
  process.stderr.write("\n═══ Cross-household ownership ═══\n");
  // Récupère l'ID d'un enfant du parent family via ORM
  const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
  const db = new PrismaClient({ adapter });
  const familyUser = await db.user.findFirst({ where: { email: EMAILS.family }, select: { id: true } });
  const kid = familyUser
    ? await db.childProfile.findFirst({ where: { parentUserId: familyUser.id }, select: { id: true } })
    : null;
  await db.$disconnect();

  if (!kid) {
    log("cross-household setup", { ok: false, reason: "no child in family" });
    return;
  }

  // Parent solo · tente d'accéder à l'enfant du parent family
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await login(page, EMAILS.solo, "fr");
  const cookies = await ctx.cookies();
  const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join("; ");
  // API PATCH tentative (child mgmt endpoint)
  const patch = await fetch(`${BASE}/api/family/children/${kid.id}`, {
    method: "PATCH", headers: { "Content-Type": "application/json", cookie: cookieHeader },
    body: JSON.stringify({ prenom: "HACKED" }),
  });
  const del = await fetch(`${BASE}/api/family/children/${kid.id}`, {
    method: "DELETE", headers: { cookie: cookieHeader },
  });
  // Page directe
  const pageResp = await page.goto(`${BASE}/fr/famille/enfant/${kid.id}`, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForTimeout(700);
  const text = await page.evaluate(() => document.body?.innerText ?? "");
  const finalUrl = new URL(page.url()).pathname;
  log("cross-household · solo tries family kid", {
    apiPatch: patch.status, apiDelete: del.status,
    pageHttp: pageResp?.status() ?? 0,
    pageFinal: finalUrl,
    hasChildName: /TEST_Ade|TEST_Yara/.test(text),
  });
  await ctx.close();
}

async function anonAndRoleChecks(browser) {
  process.stderr.write("\n═══ Anonymous + role checks ═══\n");
  const anonResp = await fetch(`${BASE}/api/me/racines-dashboard`);
  log("anon api racines-dashboard", { status: anonResp.status });
  const monde = await fetchState(browser, EMAILS.monde);
  log("monde user api racines-dashboard", { status: monde.status, hasLP: monde.body?.hasLearningPath });
  const teacher = await fetchState(browser, EMAILS.teacher);
  log("teacher api racines-dashboard", { status: teacher.status, code: teacher.body?.code });
}

async function dbCheck() {
  const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
  const db = new PrismaClient({ adapter });
  const orders = await db.order.count();
  const ordersPaid = await db.order.count({ where: { status: "PAID" } });
  const nonTestGrants = await db.accessGrant.count({
    where: { NOT: { sourceId: { startsWith: "test-p" } }, status: "ACTIVE" },
  });
  const kids = await db.childProfile.count();
  const kidsTestPrefix = await db.childProfile.count({ where: { prenom: { startsWith: "TEST_" } } });
  await db.$disconnect();
  log("db post-parcours", { orders, ordersPaid, nonTestActiveGrants: nonTestGrants, kids, kidsTestPrefix });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    // Solo · dashboard + famille + enfant (should be empty)
    await scanRoutes(browser, EMAILS.solo, "SOLO", [
      "/fr/dashboard", "/fr/famille", "/fr/progress", "/fr/classroom", "/fr/notifications",
    ], [{ w: 390, h: 844, n: "390" }]);

    // Family · dashboard + famille + enfant
    await scanRoutes(browser, EMAILS.family, "FAMILY", [
      "/fr/dashboard", "/fr/famille", "/fr/progress", "/fr/classroom", "/fr/notifications",
    ], [{ w: 390, h: 844, n: "390" }]);

    // Family EN + resume path
    await scanRoutes(browser, EMAILS.family, "FAMILY_EN", [
      "/en/dashboard", "/en/famille",
    ], [{ w: 390, h: 844, n: "390" }]);

    // Sweep 4 viewports · dashboard family
    await scanRoutes(browser, EMAILS.family, "FAMILY_SWEEP", [
      "/fr/dashboard",
    ], [
      { w: 360, h: 800, n: "360" },
      { w: 390, h: 844, n: "390" },
      { w: 768, h: 1024, n: "768" },
      { w: 1440, h: 900, n: "1440" },
    ]);

    await crossHouseholdCheck(browser);
    await anonAndRoleChecks(browser);
    await dbCheck();
  } finally {
    await browser.close();
  }
  const { writeFile, mkdir } = await import("node:fs/promises");
  await mkdir("/tmp/p3-captures", { recursive: true });
  await writeFile("/tmp/p3-captures/e2e.json", JSON.stringify(results, null, 2));
  process.stderr.write(`\nWritten /tmp/p3-captures/e2e.json (${results.length} events)\n`);
}
main().catch(e => { console.error(e); process.exit(1); });
