// P4.3a incident closure · Parcours clavier complet Center A session fraîche.
//
// Séquence · dashboard → teachers (search+pagination) → classes (filter)
// → students (tab) · avec Tab / Shift+Tab / Enter / Space / Escape et vérif
// focus visible + ordre logique + aucun piège de focus.
//
// Fresh browser context à chaque route · évite l'expiration session après
// navigations multiples (bug §5 rapport hardening précédent).

import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const BASE = "http://localhost:3000";
const PW = process.env.P1_TEST_PASSWORD;
if (!PW) { console.error("P1_TEST_PASSWORD required"); process.exit(1); }
const EMAIL_A = "paul+p4_3a_admin_a@example.com";
const OUT = "/tmp/p4-3a-captures";

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
      const style = getComputedStyle(el);
      const visible = rect.width > 0 && rect.height > 0 && style.visibility !== "hidden";
      const cs = getComputedStyle(el, ":focus-visible");
      const outline = cs.outlineStyle !== "none" && cs.outlineWidth !== "0px";
      return {
        tag: el.tagName,
        type: el.getAttribute("type"),
        role: el.getAttribute("role"),
        text: (el.textContent ?? el.value ?? el.placeholder ?? "").trim().slice(0, 60),
        href: el.getAttribute("href"),
        name: el.getAttribute("name"),
        visible,
        outline,
      };
    });
    chain.push(focus);
    process.stderr.write(`    Tab#${i + 1} ${focus.tag}${focus.type ? "[" + focus.type + "]" : ""} ${focus.name ? "@" + focus.name : ""} · ${focus.text || focus.href || ""}\n`);
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
  const results = { fr: {}, en: {} };

  // ═══ FR full journey · fresh session ═══
  process.stderr.write("\n═══ FR · Center A fresh session · full journey ═══\n");
  const ctxFr = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const pageFr = await ctxFr.newPage();
  await login(pageFr);

  process.stderr.write("  /fr/center · Tab sequence (10):\n");
  await pageFr.goto(`${BASE}/fr/center`, { waitUntil: "networkidle" });
  results.fr.dashboard = await focusChain(pageFr, 10, "/fr/center");

  process.stderr.write("  /fr/center/teachers · Tab sequence (12) + search Enter:\n");
  await pageFr.goto(`${BASE}/fr/center/teachers`, { waitUntil: "networkidle" });
  results.fr.teachers = await focusChain(pageFr, 12, "/fr/center/teachers");
  // Focus on search input then type + Enter.
  const searchLocator = pageFr.locator('input[name="query"]').first();
  await searchLocator.focus();
  await pageFr.keyboard.type("TEST");
  const searched = pageFr.waitForNavigation({ waitUntil: "networkidle", timeout: 15000 }).catch(() => null);
  await pageFr.keyboard.press("Enter");
  await searched;
  results.fr.teachersAfterSearch = {
    url: pageFr.url(),
    hasQueryParam: /query=TEST/.test(pageFr.url()),
  };
  process.stderr.write(`    search Enter → url query=${results.fr.teachersAfterSearch.hasQueryParam}\n`);

  process.stderr.write("  /fr/center/classes · Tab sequence (8):\n");
  await pageFr.goto(`${BASE}/fr/center/classes`, { waitUntil: "networkidle" });
  results.fr.classes = await focusChain(pageFr, 8, "/fr/center/classes");

  process.stderr.write("  /fr/center/students · Tab sequence (10) + Escape:\n");
  await pageFr.goto(`${BASE}/fr/center/students`, { waitUntil: "networkidle" });
  results.fr.students = await focusChain(pageFr, 10, "/fr/center/students");
  await pageFr.keyboard.press("Escape");
  const afterEsc = await pageFr.evaluate(() => document.activeElement?.tagName ?? null);
  results.fr.studentsAfterEsc = { focusTag: afterEsc };

  process.stderr.write("  /fr/center/students · Shift+Tab back (5):\n");
  await shiftBack(pageFr, 5);
  results.fr.studentsShiftBack = await pageFr.evaluate(() => document.activeElement?.tagName ?? null);
  process.stderr.write(`    shift-back landed on ${results.fr.studentsShiftBack}\n`);

  // Zoom 200 % interactivité
  process.stderr.write("  /fr/center · zoom 200 % interactif :\n");
  await pageFr.evaluate(() => { document.documentElement.style.zoom = "2"; });
  await pageFr.goto(`${BASE}/fr/center`, { waitUntil: "networkidle" });
  results.fr.zoom200Tab = await focusChain(pageFr, 6, "/fr/center@200%");
  await pageFr.evaluate(() => { document.documentElement.style.zoom = ""; });

  // ═══ EN minimal check · fresh context ═══
  process.stderr.write("\n═══ EN · minimal check · fresh context ═══\n");
  const ctxEn = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const pageEn = await ctxEn.newPage();
  await login(pageEn);
  await pageEn.goto(`${BASE}/en/center/teachers`, { waitUntil: "networkidle" });
  process.stderr.write("  /en/center/teachers · Tab sequence (8):\n");
  results.en.teachers = await focusChain(pageEn, 8, "/en/center/teachers");

  await ctxFr.close();
  await ctxEn.close();
  await browser.close();
  await writeFile(join(OUT, "keyboard.json"), JSON.stringify(results, null, 2));
  process.stderr.write(`\nWritten ${join(OUT, "keyboard.json")}\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
