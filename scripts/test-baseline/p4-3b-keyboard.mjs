// P4.3b hardening · Parcours clavier complet Teacher session fraîche.
// Séquence · /fr/teacher → /fr/teacher/classes → /fr/teacher/classes/[id]
// → /fr/teacher/students (recherche + Enter) → /fr/teacher/schedule
// → /fr/teacher/assignments · fresh context per route pour éviter session
// expirée. Spot-check /en/teacher/classes.

import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const BASE = "http://localhost:3000";
const PW = process.env.P1_TEST_PASSWORD;
if (!PW) { console.error("P1_TEST_PASSWORD required"); process.exit(1); }
const EMAIL_A = "paul+p4_3b_teacher_a@example.com";
const OUT = "/tmp/p4-3b-captures";

async function login(page) {
  await page.goto(`${BASE}/fr/login`, { waitUntil: "networkidle", timeout: 30000 });
  await page.fill('input[type="email"]', EMAIL_A);
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

async function focusChain(page, steps, label) {
  const chain = [];
  for (let i = 0; i < steps; i++) {
    await page.keyboard.press("Tab");
    const focus = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return { tag: "BODY", visible: false };
      const rect = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        tag: el.tagName,
        type: el.getAttribute("type"),
        text: (el.textContent ?? el.value ?? "").trim().slice(0, 50),
        href: el.getAttribute("href"),
        visible: rect.width > 0 && rect.height > 0 && cs.visibility !== "hidden",
      };
    });
    chain.push(focus);
    process.stderr.write(`    Tab#${i + 1} ${focus.tag}${focus.type ? "[" + focus.type + "]" : ""} · ${focus.text || focus.href || ""}\n`);
  }
  return { label, chain };
}

async function shiftBack(page, n) {
  for (let i = 0; i < n; i++) {
    await page.keyboard.down("Shift");
    await page.keyboard.press("Tab");
    await page.keyboard.up("Shift");
  }
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = { fr: {}, en: {}, zoom200: {} };

  // ═══ FR full journey ═══
  process.stderr.write("\n═══ FR · Teacher A fresh session · full journey ═══\n");
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await login(page);

  process.stderr.write("  /fr/teacher · Tab sequence (10):\n");
  await page.goto(`${BASE}/fr/teacher`, { waitUntil: "networkidle" });
  results.fr.dashboard = await focusChain(page, 10, "/fr/teacher");

  process.stderr.write("  /fr/teacher/classes · Tab sequence (12) · récupérer classroomId:\n");
  await page.goto(`${BASE}/fr/teacher/classes`, { waitUntil: "networkidle" });
  results.fr.classes = await focusChain(page, 12, "/fr/teacher/classes");
  const firstClassLink = await page.evaluate(() => {
    const links = [...document.querySelectorAll('a[href*="/teacher/classes/"]')];
    const detail = links.find((a) => /\/teacher\/classes\/[^/]+$/.test(a.getAttribute("href") ?? ""));
    return detail?.getAttribute("href") ?? null;
  });
  process.stderr.write(`    class detail link = ${firstClassLink}\n`);

  if (firstClassLink) {
    process.stderr.write(`  ${firstClassLink} · Tab sequence (10):\n`);
    await page.goto(`${BASE}${firstClassLink}`, { waitUntil: "networkidle" });
    results.fr.classDetail = await focusChain(page, 10, firstClassLink);
  }

  process.stderr.write("  /fr/teacher/students · Tab (12) + search input:\n");
  await page.goto(`${BASE}/fr/teacher/students`, { waitUntil: "networkidle" });
  results.fr.students = await focusChain(page, 12, "/fr/teacher/students");
  const searchLoc = page.locator('input[name="query"]').first();
  const hasSearch = await searchLoc.count().catch(() => 0);
  if (hasSearch) {
    await searchLoc.focus();
    await page.keyboard.type("TEST");
    const searched = page.waitForNavigation({ waitUntil: "networkidle", timeout: 15000 }).catch(() => null);
    await page.keyboard.press("Enter");
    await searched;
    results.fr.studentsAfterSearch = {
      url: page.url(),
      hasQueryParam: /query=TEST/.test(page.url()),
    };
    process.stderr.write(`    search Enter → hasQueryParam=${results.fr.studentsAfterSearch.hasQueryParam}\n`);
  } else {
    results.fr.studentsAfterSearch = { skipped: "no search input in view (empty state?)" };
  }

  process.stderr.write("  /fr/teacher/schedule · Tab sequence (6) + Escape:\n");
  await page.goto(`${BASE}/fr/teacher/schedule`, { waitUntil: "networkidle" });
  results.fr.schedule = await focusChain(page, 6, "/fr/teacher/schedule");
  await page.keyboard.press("Escape");
  results.fr.scheduleAfterEsc = await page.evaluate(() => document.activeElement?.tagName ?? null);

  process.stderr.write("  /fr/teacher/assignments · Tab sequence (6):\n");
  await page.goto(`${BASE}/fr/teacher/assignments`, { waitUntil: "networkidle" });
  results.fr.assignments = await focusChain(page, 6, "/fr/teacher/assignments");

  process.stderr.write("  /fr/teacher/students · Shift+Tab back (5):\n");
  await page.goto(`${BASE}/fr/teacher/students`, { waitUntil: "networkidle" });
  await focusChain(page, 5, "prep for Shift+Tab");
  await shiftBack(page, 5);
  results.fr.shiftBack = await page.evaluate(() => document.activeElement?.tagName ?? null);
  process.stderr.write(`    shift-back landed on ${results.fr.shiftBack}\n`);

  // Zoom 200 % (4 routes clés)
  process.stderr.write("\n═══ Zoom 200 % · overflow check ═══\n");
  for (const route of ["/fr/teacher", "/fr/teacher/classes", "/fr/teacher/students",
                       firstClassLink ?? "/fr/teacher/classes"]) {
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

  // ═══ EN spot-check ═══
  process.stderr.write("\n═══ EN · minimal check · fresh context ═══\n");
  const ctxEn = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const pageEn = await ctxEn.newPage();
  await login(pageEn);
  await pageEn.goto(`${BASE}/en/teacher/classes`, { waitUntil: "networkidle" });
  results.en.classes = await focusChain(pageEn, 10, "/en/teacher/classes");

  await ctxEn.close();
  await browser.close();
  await writeFile(join(OUT, "keyboard.json"), JSON.stringify(results, null, 2));
  process.stderr.write(`\nWritten ${join(OUT, "keyboard.json")}\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
