// P2 hardening · E2E complet · 5 fixtures × routes clés + EN + reprise + ownership.

import { chromium } from "playwright";
import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const BASE = "http://localhost:3000";
const PW = process.env.P1_TEST_PASSWORD;
if (!PW) { console.error("P1_TEST_PASSWORD required"); process.exit(1); }

const EMAIL_MONDE = "paul+yema_test_monde@example.com";
const EMAIL_RACINES = "paul+yema_test_racines_solo@example.com";
const EMAIL_TEACHER = "paul+yema_test_teacher@example.com";

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

function setFixture(mode) {
  execSync(`node scripts/test-baseline/p2-access-fixtures.mjs ${mode}`, { stdio: "pipe" });
}

async function fetchDashboardState(browser, email) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await login(page, email, "fr");
  const cookies = await ctx.cookies();
  const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join("; ");
  const resp = await fetch(`${BASE}/api/me/monde-dashboard`, { headers: { cookie: cookieHeader } });
  const body = await resp.json();
  await ctx.close();
  return { status: resp.status, body };
}

// ══ Scenario 1-5 · dashboard + courses + progress state summary ══
async function scanState(browser, label, vw = 390) {
  process.stderr.write(`\n═══ ${label} @ ${vw} ═══\n`);
  const ctx = await browser.newContext({ viewport: { width: vw, height: 844 } });
  const page = await ctx.newPage();
  const cerr = [];
  page.on("console", m => { if (m.type() === "error") cerr.push(1); });
  await login(page, EMAIL_MONDE, "fr");
  const events = [];
  for (const route of ["/fr/dashboard", "/fr/courses", "/fr/progress"]) {
    const resp = await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(700);
    const m = await measure(page, vw);
    const text = await page.evaluate(() => document.body?.innerText ?? "");
    events.push({
      route, http: resp?.status() ?? 0,
      pageOverflow: m.pageOverflow, ovf: m.overflowCount,
      // Ces regex détectent les CTA (avec le séparateur · ou en début de bouton).
      hasHeroResume: /(Reprendre|Resume)\s+ta prochaine leçon|(Reprendre|Resume) your next lesson/.test(text) || /Reprendre · /.test(text) || /Resume · /.test(text),
      hasHeroStart: /Commencer ta première leçon|Start your first lesson/.test(text) || /Commencer · /.test(text) || /Start · /.test(text),
      hasHeroDone: /Niveau A1 terminé|A1 level completed|Revoir mon parcours|Review my journey/.test(text),
      hasOffers: /Voir les offres|See offers|Choisir un Passage|Choose a Passage/.test(text),
      hasLockedCard: /A2 · Bientôt|A2 · Coming/.test(text),
      hasFakeName: /Sophie Tanda|Marie N\.|Prof\. Sophie/i.test(text),
    });
  }
  await ctx.close();
  log(`${label} events`, { events, consoleErrors: cerr.length });
  return events;
}

async function accessDirectModule(browser, label) {
  // Vérifie qu'un utilisateur sans/avec accès expiré ne peut PAS lire un module.
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await login(page, EMAIL_MONDE, "fr");
  const url = `${BASE}/fr/courses/a1-beta-1/modules/a1-beta-1-lesen`;
  const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(800);
  const text = await page.evaluate(() => document.body?.innerText ?? "");
  const html = await page.content();
  await ctx.close();
  return {
    http: resp?.status() ?? 0,
    hasLockedStateBlock: html.includes("state-locked"),
    hasCTAActivation: /Voir les offres|See offers|activation-intent/.test(text),
    hasContent: /Willkommen|Guten Tag/.test(text),
  };
}

async function runResume(browser) {
  process.stderr.write("\n═══ Reprise nouvelle session ═══\n");
  // Setup · active + partial progress via seed (fixture "new" + one manual PATCH not available)
  setFixture("new");
  // Simuler qu'un module a été terminé · POST directement sur ModuleProgress via un
  // helper Prisma "seed one". Pour rester minimal, on utilise l'ORM directement.
  const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
  const db = new PrismaClient({ adapter });
  const dbUser = await db.user.findFirst({ where: { email: EMAIL_MONDE }, select: { id: true } });
  await db.moduleProgress.upsert({
    where: { userId_moduleId: { userId: dbUser.id, moduleId: "a1-beta-1-lesen" } },
    update: { status: "COMPLETED", completedAt: new Date() },
    create: { userId: dbUser.id, moduleId: "a1-beta-1-lesen", status: "COMPLETED", completedAt: new Date() },
  });
  await db.$disconnect();

  // Fresh browser context
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await login(page, EMAIL_MONDE, "fr");
  await page.goto(`${BASE}/fr/dashboard`, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(800);
  const text = await page.evaluate(() => document.body?.innerText ?? "");
  // Vérifie le CTA next lesson · a1-beta-1-hoeren (2ème module de la 1ère leçon)
  const hasNextHoeren = text.includes("Meine Familie") || text.includes("Beta 1 — Willkommen") || text.includes("Beta 2");
  log("resume · dashboard shows next", { hasNextHoeren, snippet: text.slice(0, 200).replace(/\n/g, " ") });
  await ctx.close();
}

async function runEnParcours(browser) {
  process.stderr.write("\n═══ E2E EN · monde actif ═══\n");
  setFixture("active");
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await login(page, EMAIL_MONDE, "en");
  for (const r of ["/en/dashboard", "/en/courses", "/en/progress"]) {
    await page.goto(BASE + r, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(700);
    const text = await page.evaluate(() => document.body?.innerText ?? "");
    log(`en ${r}`, {
      hasEn: /(Resume|My journey|Coming soon|Modules completed|German|Level|Overall progress)/.test(text),
      hasFrOnly: /(Reprendre|Ma progression|Bientôt disponible|Modules terminés)/.test(text),
    });
  }
  await ctx.close();
}

async function runOwnership(browser) {
  process.stderr.write("\n═══ Ownership + accès directs ═══\n");
  // Anonymous API
  const anon = await fetch(`${BASE}/api/me/monde-dashboard`);
  log("anon api", { status: anon.status });
  // Racines API
  const racines = await fetchDashboardState(browser, EMAIL_RACINES);
  log("racines api", { status: racines.status, hasLP: racines.body.hasLearningPath });
  // Teacher API
  const teacher = await fetchDashboardState(browser, EMAIL_TEACHER);
  log("teacher api", { status: teacher.status, code: teacher.body.code });
  // Racines tries module page
  const rctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const rp = await rctx.newPage();
  await login(rp, EMAIL_RACINES, "fr");
  const rresp = await rp.goto(`${BASE}/fr/courses/a1-beta-1/modules/a1-beta-1-lesen`, { waitUntil: "domcontentloaded" });
  await rp.waitForTimeout(700);
  const rtext = await rp.evaluate(() => document.body?.innerText ?? "");
  log("racines module page", {
    http: rresp?.status() ?? 0,
    hasContent: /Willkommen|Guten Tag/.test(rtext),
    hasLockedOrRedirect: /Voir les offres|Choisir un Passage|Bientôt disponible/.test(rtext),
  });
  await rctx.close();
}

async function dbCheck() {
  const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
  const db = new PrismaClient({ adapter });
  const orders = await db.order.count();
  const ordersPaid = await db.order.count({ where: { status: "PAID" } });
  // AccessGrants non-test
  const nonTestGrants = await db.accessGrant.count({
    where: { NOT: { sourceId: { startsWith: "test-p2-" } }, status: "ACTIVE" },
  });
  await db.$disconnect();
  log("db post-parcours", { orders, ordersPaid, nonTestActiveGrants: nonTestGrants });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    // 5 states scan
    for (const mode of ["new", "active", "completed", "expired", "none"]) {
      setFixture(mode);
      await scanState(browser, `state=${mode}`);
    }
    // Access direct dans les 2 états sans accès
    setFixture("expired");
    log("access direct EXPIRED", await accessDirectModule(browser));
    setFixture("none");
    log("access direct NONE", await accessDirectModule(browser));

    // Reprise fresh browser
    await runResume(browser);
    // EN parcours
    await runEnParcours(browser);
    // Ownership + cross role
    await runOwnership(browser);
    // DB check
    await dbCheck();
  } finally {
    await browser.close();
  }
  const { writeFile, mkdir } = await import("node:fs/promises");
  await mkdir("/tmp/p2h-captures", { recursive: true });
  await writeFile("/tmp/p2h-captures/e2e.json", JSON.stringify(results, null, 2));
  process.stderr.write(`\nWritten /tmp/p2h-captures/e2e.json (${results.length} events)\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
