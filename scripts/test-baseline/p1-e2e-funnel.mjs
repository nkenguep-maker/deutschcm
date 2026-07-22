// P1 · E2E · parcours funnel complet, un rôle à la fois.

import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const PW = process.env.P1_TEST_PASSWORD;
if (!PW) { console.error("P1_TEST_PASSWORD required"); process.exit(1); }

const MONDE_EMAIL = "paul+yema_test_monde@example.com";

async function login(page, email) {
  await page.goto(`${BASE}/fr/login`, { waitUntil: "networkidle", timeout: 30000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', PW);
  await Promise.all([
    page.waitForResponse(r => /supabase\.co\/auth\/v1\/token/.test(r.url()), { timeout: 20000 }).catch(() => null),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForTimeout(2500);
  await page.waitForURL(u => !u.pathname.includes("/login"), { timeout: 15000 }).catch(() => {});
}

async function measureOverflow(page, vw) {
  return await page.evaluate((vw) => {
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

async function trace(page, label, url, viewport) {
  const cerr = [];
  page.removeAllListeners("console");
  page.on("console", m => { if (m.type() === "error") cerr.push(m.text().slice(0, 80)); });
  const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(800);
  const status = resp?.status() ?? 0;
  const finalPath = new URL(page.url()).pathname;
  const m = await measureOverflow(page, viewport);
  const h1 = await page.evaluate(() => document.querySelector("h1")?.textContent?.trim().slice(0, 60) ?? "");
  process.stderr.write(`  [${label}] ${url.replace(BASE, "")} → ${finalPath} (${status}) ovf=${m.overflowCount} pageOvf=${m.pageOverflow} h1="${h1}" cerr=${cerr.length}\n`);
  return { status, finalPath, ...m, h1, cerr: cerr.length };
}

async function runMondeFr() {
  const browser = await chromium.launch({ headless: true });

  for (const vp of [{ w: 390, h: 844, name: "390" }, { w: 1440, h: 900, name: "1440" }]) {
    process.stderr.write(`\n═══ Monde FR @ ${vp.name} ═══\n`);
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
    const page = await ctx.newPage();

    // Fresh login pour repartir d'un état propre à chaque viewport
    await login(page, MONDE_EMAIL);

    // Reset le LP pour un run "vierge" du funnel : on repointe le user
    // via /onboarding (au-delà du LP existant, il ré-évalue la state).
    await trace(page, "onboarding-router", `${BASE}/fr/onboarding`, vp.w);
    // /onboarding pour un user monde déjà onboardé peut sauter au funnel :
    // vérifions plusieurs étapes du funnel via URLs directes.
    await trace(page, "step decouverte/1", `${BASE}/fr/decouverte/1`, vp.w);
    await trace(page, "step decouverte/2", `${BASE}/fr/decouverte/2`, vp.w);
    await trace(page, "step decouverte/3", `${BASE}/fr/decouverte/3`, vp.w);
    await trace(page, "step decouverte/4", `${BASE}/fr/decouverte/4`, vp.w);
    await trace(page, "step bilan",        `${BASE}/fr/decouverte/bilan`, vp.w);
    await trace(page, "step activation",   `${BASE}/fr/activation-intent`, vp.w);

    await ctx.close();
  }

  await browser.close();
}

runMondeFr().catch(e => { console.error(e); process.exit(1); });
