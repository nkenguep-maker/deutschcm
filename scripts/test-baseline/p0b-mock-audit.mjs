// P0.B · Audit des données mock exposées dans les captures authentifiées.
// Cherche les noms des constantes STUDENTS/MOCK_TEACHERS dans le DOM rendu
// des routes concernées.

import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const BASE = "http://localhost:3000";
const PW = process.env.P1_TEST_PASSWORD;
if (!PW) { console.error("P1_TEST_PASSWORD required"); process.exit(1); }

const CENTER = "paul+yema_test_center@example.com";

const MOCK_NAMES = [
  "Marie Nguemo", "Paul Atangana", "Diane Biya", "Eric Fotso", "Sandrine Kamga",
  "Jean Mbarga", "Olivia Tchamba", "Marc Essono", "Brice Ondoua", "Fatiha Moussa",
  "Alain Nkomo", "Celine Fogue", "Samuel Manga",
  "Dr. Beatrice Momo", "Jean-Pierre Nkolo", "Sophie Tanda", "Arsène Biyong",
  "Claudine Ewane", "Dr. Samuel Kameni", "Alice Fouda",
];

async function login(browser, email) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/fr/login`, { waitUntil: "networkidle", timeout: 30000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', PW);
  await Promise.all([
    page.waitForResponse(r => /supabase\.co\/auth\/v1\/token/.test(r.url()), { timeout: 20000 }).catch(() => null),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForTimeout(2500);
  await page.waitForURL(u => !u.pathname.includes("/login"), { timeout: 15000 }).catch(() => {});
  const state = await ctx.storageState();
  await ctx.close();
  return state;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const state = await login(browser, CENTER);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, storageState: state });
  const page = await ctx.newPage();
  const routes = ["/fr/center/students", "/fr/center/teachers", "/fr/center/classes", "/fr/center/billing", "/fr/center/stats"];
  const hits = [];

  for (const r of routes) {
    await page.goto(BASE + r, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(500);
    const text = await page.evaluate(() => document.body?.innerText ?? "");
    const found = MOCK_NAMES.filter(n => text.includes(n));
    hits.push({ route: r, found });
    process.stderr.write(`${r.padEnd(30)} · mock names visible: ${found.length}\n`);
    if (found.length) process.stderr.write(`  ${found.join(", ")}\n`);
  }

  await browser.close();
  const { writeFile } = await import("node:fs/promises");
  await writeFile("/tmp/p0b-captures/mock-audit.json", JSON.stringify(hits, null, 2));
}
main().catch(e => { console.error(e); process.exit(1); });
