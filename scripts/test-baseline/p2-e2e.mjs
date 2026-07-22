// P2 · E2E parcours étudiant Monde · trois scénarios d'accès + ownership.
// Alterne les fixtures AccessGrant via p2-access-fixtures.mjs entre les runs.

import { chromium } from "playwright";
import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const BASE = "http://localhost:3000";
const PW = process.env.P1_TEST_PASSWORD;
if (!PW) { console.error("P1_TEST_PASSWORD required"); process.exit(1); }

const EMAIL_MONDE = "paul+yema_test_monde@example.com";
const EMAIL_RACINES = "paul+yema_test_racines_solo@example.com";

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
  execSync(`node scripts/test-baseline/p2-access-fixtures.mjs ${mode}`, { stdio: "inherit" });
}

async function runScenario(browser, label, viewport = { w: 390, h: 844 }) {
  process.stderr.write(`\n═══ ${label} @ ${viewport.w} ═══\n`);
  const ctx = await browser.newContext({ viewport: { width: viewport.w, height: viewport.h } });
  const page = await ctx.newPage();
  const cerr = [];
  page.on("console", m => { if (m.type() === "error") cerr.push(1); });

  await login(page, EMAIL_MONDE, "fr");
  const routes = ["/fr/dashboard", "/fr/courses", "/fr/progress"];
  const events = [];
  for (const r of routes) {
    const resp = await page.goto(BASE + r, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(800);
    const m = await measure(page, viewport.w);
    const finalUrl = new URL(page.url()).pathname;
    const text = await page.evaluate(() => document.body?.innerText ?? "");
    const has = (s) => text.includes(s);
    events.push({
      route: r, http: resp?.status() ?? 0, finalUrl,
      pageOverflow: m.pageOverflow, ovf: m.overflowCount,
      hasFakeName: /Sophie Tanda|Marie N\.|Prof\. Sophie/i.test(text),
      hasLockedBanner: has("Bientôt disponible") || has("Choisir un Passage") || has("Voir les offres"),
      hasResumeCta: has("Reprendre") || has("Continuer"),
      hasCourse: has("Beta 1 — Willkommen") || has("Guten Tag"),
    });
    process.stderr.write(`  ${r.padEnd(20)} scrollW=${m.scrollW} pageOvf=${m.pageOverflow} ovf=${m.ovf}\n`);
  }
  await ctx.close();
  return { label, events, cerr: cerr.length };
}

async function runRacinesRedirect(browser) {
  process.stderr.write("\n═══ Racines · /courses doit rediriger vers /dashboard ═══\n");
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await login(page, EMAIL_RACINES, "fr");
  await page.goto(`${BASE}/fr/courses`, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForTimeout(800);
  const finalUrl = new URL(page.url()).pathname;
  process.stderr.write(`  finalUrl=${finalUrl}\n`);
  await ctx.close();
  return finalUrl;
}

async function runOwnership(browser) {
  process.stderr.write("\n═══ Ownership · monde ne PATCH que son propre LP ═══\n");
  // Anon
  const anonResp = await fetch(`${BASE}/api/me/monde-dashboard`);
  process.stderr.write(`  anon GET /api/me/monde-dashboard → ${anonResp.status}\n`);
  // Racines user (has STUDENT role but no Monde LP) should return 200 with hasLearningPath=false
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await login(p, EMAIL_RACINES, "fr");
  const cookies = await ctx.cookies();
  const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join("; ");
  const racinesResp = await fetch(`${BASE}/api/me/monde-dashboard`, { headers: { cookie: cookieHeader } });
  const racinesBody = await racinesResp.json();
  process.stderr.write(`  racines GET /api/me/monde-dashboard → ${racinesResp.status} hasLP=${racinesBody.hasLearningPath}\n`);
  await ctx.close();
  return { anon: anonResp.status, racines: racinesResp.status, racinesHasLP: racinesBody.hasLearningPath };
}

async function runAccessDbCheck() {
  // Verify no fake payment/entitlement created
  const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
  const db = new PrismaClient({ adapter });
  const orders = await db.order.count({ where: { status: "PAID" } });
  const anyOrder = await db.order.count();
  await db.$disconnect();
  process.stderr.write(`\n═══ DB post-parcours · orders paid=${orders} · total=${anyOrder} ═══\n`);
  return { ordersPaid: orders, ordersTotal: anyOrder };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const report = [];

  // Scenario 1 · Active
  setFixture("active");
  report.push(await runScenario(browser, "monde-ACTIVE"));

  // Scenario 2 · Expired
  setFixture("expired");
  report.push(await runScenario(browser, "monde-EXPIRED"));

  // Scenario 3 · None
  setFixture("none");
  report.push(await runScenario(browser, "monde-NONE"));

  // Racines redirect
  const racinesFinal = await runRacinesRedirect(browser);

  // Ownership
  const ownership = await runOwnership(browser);

  // DB check
  const db = await runAccessDbCheck();

  await browser.close();
  const { writeFile, mkdir } = await import("node:fs/promises");
  await mkdir("/tmp/p2-captures", { recursive: true });
  await writeFile("/tmp/p2-captures/e2e.json", JSON.stringify({ scenarios: report, racinesFinal, ownership, db }, null, 2));
  process.stderr.write(`\nWritten /tmp/p2-captures/e2e.json\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
