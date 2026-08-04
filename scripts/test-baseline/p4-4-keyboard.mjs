// P4.4 · Parcours clavier + zoom 200 % Coach A session fraîche.

import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const BASE = "http://localhost:3000";
const PW = process.env.P1_TEST_PASSWORD;
if (!PW) { console.error("P1_TEST_PASSWORD required"); process.exit(1); }
const EMAIL_A = "paul+p4_4_coach_a@example.com";
const CIRCLE_A = "test_p4_4_circle_a";
const CHILD_A_1 = "test_p4_4_child_a_1";
const OUT = "/tmp/p4-4-captures";

async function login(page) {
  await page.goto(`${BASE}/fr/login`, { waitUntil: "networkidle", timeout: 30000 });
  await page.fill('input[type="email"]', EMAIL_A);
  await page.fill('input[type="password"]', PW);
  const tokenResp = page.waitForResponse(r => /supabase\.co\/auth\/v1\/token/.test(r.url()), { timeout: 30000 }).catch(() => null);
  await page.click('button[type="submit"]');
  await tokenResp;
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    const cs = await page.context().cookies();
    if (cs.some(c => /^sb-.+-auth-token/.test(c.name))) return;
    await page.waitForTimeout(300);
  }
}

async function focusChain(page, steps) {
  const chain = [];
  for (let i = 0; i < steps; i++) {
    await page.keyboard.press("Tab");
    const focus = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return { tag: "BODY" };
      return {
        tag: el.tagName,
        text: (el.textContent ?? el.value ?? "").trim().slice(0, 50),
        href: el.getAttribute("href"),
      };
    });
    chain.push(focus);
    process.stderr.write(`    Tab#${i + 1} ${focus.tag} · ${focus.text || focus.href || ""}\n`);
  }
  return chain;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = { fr: {}, en: {}, zoom200: {} };

  process.stderr.write("\n═══ FR · Coach A fresh session ═══\n");
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await login(page);

  for (const [key, route] of [
    ["dashboard", "/fr/coach/racines"],
    ["circles", "/fr/coach/racines/circles"],
    ["circleDetail", `/fr/coach/racines/circles/${CIRCLE_A}`],
    ["profiles", "/fr/coach/racines/profiles"],
    ["profileDetail", `/fr/coach/racines/profiles/${CHILD_A_1}`],
    ["activities", "/fr/coach/racines/activities"],
    ["messages", "/fr/coach/racines/messages"],
    ["sessions", "/fr/coach/racines/sessions"],
  ]) {
    process.stderr.write(`  ${route} · Tab sequence (8):\n`);
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
    results.fr[key] = await focusChain(page, 8);
  }

  process.stderr.write("\n═══ Zoom 200 % · overflow check ═══\n");
  for (const route of [
    "/fr/coach/racines", "/fr/coach/racines/circles",
    `/fr/coach/racines/circles/${CIRCLE_A}`,
    "/fr/coach/racines/profiles", `/fr/coach/racines/profiles/${CHILD_A_1}`,
  ]) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
    await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
    const overflow = await page.evaluate(() => {
      const el = document.scrollingElement || document.body;
      return el.scrollWidth - window.innerWidth;
    });
    await page.screenshot({ path: join(OUT, `zoom200_${route.replace(/\//g, "_")}.png`), fullPage: false });
    results.zoom200[route] = { overflow };
    process.stderr.write(`  zoom200 ${route} · overflow=${overflow}px\n`);
    await page.evaluate(() => { document.documentElement.style.zoom = ""; });
  }

  await ctx.close();

  process.stderr.write("\n═══ EN spot-check ═══\n");
  const ctxEn = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const pageEn = await ctxEn.newPage();
  await login(pageEn);
  await pageEn.goto(`${BASE}/en/coach/racines/circles`, { waitUntil: "networkidle" });
  results.en.circles = await focusChain(pageEn, 8);

  await ctxEn.close();
  await browser.close();
  await writeFile(join(OUT, "keyboard.json"), JSON.stringify(results, null, 2));
  process.stderr.write(`\nWritten ${join(OUT, "keyboard.json")}\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
