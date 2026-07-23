// P4.4 · Visual sweep 8 routes × 2 locales × 4 viewports = 64 renders.

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

const ROUTES = [
  "/fr/coach/racines", "/fr/coach/racines/circles",
  `/fr/coach/racines/circles/${CIRCLE_A}`,
  "/fr/coach/racines/profiles", `/fr/coach/racines/profiles/${CHILD_A_1}`,
  "/fr/coach/racines/activities", "/fr/coach/racines/messages", "/fr/coach/racines/sessions",
  "/en/coach/racines", "/en/coach/racines/circles",
  `/en/coach/racines/circles/${CIRCLE_A}`,
  "/en/coach/racines/profiles", `/en/coach/racines/profiles/${CHILD_A_1}`,
  "/en/coach/racines/activities", "/en/coach/racines/messages", "/en/coach/racines/sessions",
];
const VIEWPORTS = [
  { name: "360x800",  width: 360,  height: 800  },
  { name: "390x844",  width: 390,  height: 844  },
  { name: "768x1024", width: 768,  height: 1024 },
  { name: "1440x900", width: 1440, height: 900  },
];
const BANNED = ["Career Coach", "career-coach"];
const B_MARKERS = ["test_p4_4_circle_b", "test_p4_4_child_b_1", "TEST P4.4 coachB", "TEST P4.4 Parent B"];

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

async function auditRoute(page, route, viewport) {
  const errors = [];
  const failed = [];
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  page.on("requestfailed", r => failed.push(`${r.method()} ${r.url()}`));
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  const resp = await page.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: 30000 }).catch(() => null);
  const status = resp?.status() ?? 0;
  const html = await page.content();
  const overflow = await page.evaluate(vw => {
    const el = document.scrollingElement || document.body;
    return el.scrollWidth - vw;
  }, viewport.width);
  const banned = BANNED.filter(n => html.includes(n));
  const leaks = B_MARKERS.filter(m => html.includes(m));
  await page.screenshot({ path: join(OUT, `${route.replace(/\//g, "_")}_${viewport.name}.png`), fullPage: false });
  return {
    route, viewport: viewport.name, status,
    overflowPx: overflow,
    consoleErrors: errors.slice(0, 2),
    bannedStrings: banned,
    coachBLeaks: leaks,
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
      const flag = r.status !== 200 ? `❌HTTP${r.status}` :
        r.overflowPx > 2 ? `⚠OVERFLOW${r.overflowPx}` :
        r.bannedStrings.length > 0 ? `❌BANNED ${r.bannedStrings.join(",")}` :
        r.coachBLeaks.length > 0 ? `❌LEAK ${r.coachBLeaks.join(",")}` :
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

main().catch(e => { console.error(e); process.exit(1); });
