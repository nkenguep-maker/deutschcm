// P4.3b · Visual sweep · 6 routes Teacher × 2 locales × 4 viewports.
// Détecte overflow, mocks résiduels, console errors, cross-teacher leak.

import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const BASE = "http://localhost:3000";
const PW = process.env.P1_TEST_PASSWORD;
if (!PW) { console.error("P1_TEST_PASSWORD required"); process.exit(1); }
const EMAIL_A = "paul+p4_3b_teacher_a@example.com";
const OUT = "/tmp/p4-3b-captures";

const ROUTES = [
  "/fr/teacher", "/fr/teacher/classes", "/fr/teacher/students",
  "/fr/teacher/schedule", "/fr/teacher/assignments", "/fr/teacher/activities",
  "/en/teacher", "/en/teacher/classes", "/en/teacher/students",
  "/en/teacher/schedule", "/en/teacher/assignments", "/en/teacher/activities",
];
const VIEWPORTS = [
  { name: "360x800",  width: 360,  height: 800  },
  { name: "390x844",  width: 390,  height: 844  },
  { name: "768x1024", width: 768,  height: 1024 },
  { name: "1440x900", width: 1440, height: 900  },
];
const BANNED = [
  "Marie Nguemo", "Sophie Tanda", "Dr. Beatrice", "Marie Tchamba", "Alain Nkolo",
  "Jean Mbarga", "Esther Fouda", "Olivia Tchamba", "Diane Biya",
];
const CENTER_B_MARKERS = [
  "TEST_CENTER_B_P43B", "TEST_CLASS_B_1_P43B", "TEST P4.3b Teacher B",
  "TEST P4.3b Student B1", "test_p4_3b_class_b1",
];

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

async function auditRoute(page, route, viewport) {
  const errors = [];
  const failed = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("requestfailed", (r) => failed.push(`${r.method()} ${r.url()}`));
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  const resp = await page.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: 30000 }).catch(() => null);
  const status = resp?.status() ?? 0;
  const html = await page.content();
  const overflow = await page.evaluate((vw) => {
    const el = document.scrollingElement || document.body;
    return el.scrollWidth - vw;
  }, viewport.width);
  const banned = BANNED.filter((n) => html.includes(n));
  const leaks = CENTER_B_MARKERS.filter((m) => html.includes(m));
  await page.screenshot({ path: join(OUT, `${route.replace(/\//g, "_")}_${viewport.name}.png`), fullPage: false });
  return {
    route, viewport: viewport.name, status,
    overflowPx: overflow,
    consoleErrors: errors.slice(0, 3),
    failedRequests: failed.slice(0, 3),
    bannedNames: banned,
    centerBLeaks: leaks,
  };
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await login(page);
  const results = [];
  for (const viewport of VIEWPORTS) {
    for (const route of ROUTES) {
      const r = await auditRoute(page, route, viewport);
      results.push(r);
      const flag =
        r.status !== 200 ? "❌HTTP" :
        r.overflowPx > 2 ? `⚠OVERFLOW${r.overflowPx}` :
        r.bannedNames.length > 0 ? `❌MOCK ${r.bannedNames.join(",")}` :
        r.centerBLeaks.length > 0 ? `❌CENTER_B_LEAK ${r.centerBLeaks.join(",")}` :
        r.consoleErrors.length > 0 ? `⚠console(${r.consoleErrors.length})` :
        "OK";
      process.stderr.write(`  ${r.viewport} ${r.route} · ${flag}\n`);
    }
  }
  await ctx.close();
  await browser.close();
  await writeFile(join(OUT, "visual.json"), JSON.stringify(results, null, 2));
  process.stderr.write(`\nWritten ${join(OUT, "visual.json")}\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
