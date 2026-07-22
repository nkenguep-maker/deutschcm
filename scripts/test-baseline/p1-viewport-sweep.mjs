// P1 hardening · Viewport sweep sur les routes principales du funnel.
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const PW = process.env.P1_TEST_PASSWORD;
if (!PW) { console.error("P1_TEST_PASSWORD required"); process.exit(1); }

const EMAIL_MONDE = "paul+yema_test_monde@example.com";
const ROUTES = [
  "/fr/onboarding",
  "/fr/onboarding/monde",
  "/fr/onboarding/monde/niveau",
  "/fr/decouverte/1",
  "/fr/decouverte/bilan",
  "/fr/activation-intent",
];
const VIEWPORTS = [
  { name: "360",  w: 360,  h: 800  },
  { name: "390",  w: 390,  h: 844  },
  { name: "768",  w: 768,  h: 1024 },
  { name: "1440", w: 1440, h: 900  },
];

async function login(page, email) {
  await page.goto(`${BASE}/fr/login`, { waitUntil: "networkidle", timeout: 30000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', PW);
  await Promise.all([
    page.waitForResponse(r => /supabase\.co\/auth\/v1\/token/.test(r.url()), { timeout: 20000 }).catch(() => null),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForTimeout(2500);
}

async function measure(page, vw) {
  return await page.evaluate((vw) => {
    const scrollW = document.documentElement.scrollWidth;
    const clientW = document.documentElement.clientWidth;
    let ovf = 0;
    const details = [];
    for (const el of Array.from(document.querySelectorAll("body *"))) {
      const r = el.getBoundingClientRect();
      if (r.right > vw + 1 && r.width < vw * 2 && r.width > 0) {
        ovf++;
        if (details.length < 3) details.push({ tag: el.tagName.toLowerCase(), right: Math.round(r.right) });
      }
    }
    return { scrollW, clientW, pageOverflow: scrollW - clientW, overflowCount: ovf, details };
  }, vw);
}

async function main() {
  const b = await chromium.launch({ headless: true });
  // Login once, reuse state
  const login_ctx = await b.newContext();
  const login_page = await login_ctx.newPage();
  await login(login_page, EMAIL_MONDE);
  const state = await login_ctx.storageState();
  await login_ctx.close();

  const rows = [];
  for (const vp of VIEWPORTS) {
    process.stderr.write(`\n═══ viewport ${vp.name} ═══\n`);
    const ctx = await b.newContext({ viewport: { width: vp.w, height: vp.h }, storageState: state });
    const page = await ctx.newPage();
    const cerr = [];
    page.on("console", m => { if (m.type() === "error") cerr.push(1); });
    for (const route of ROUTES) {
      const resp = await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 15000 });
      await page.waitForTimeout(500);
      const m = await measure(page, vp.w);
      rows.push({ vp: vp.name, route, http: resp?.status() ?? 0, ...m, cerr: cerr.length });
      process.stderr.write(`  ${route.padEnd(38)} scrollW=${m.scrollW} clientW=${m.clientW} pageOverflow=${m.pageOverflow} ovf=${m.overflowCount}\n`);
      cerr.length = 0;
    }
    await ctx.close();
  }

  // Summary
  const overflowsByVp = {};
  for (const r of rows) {
    overflowsByVp[r.vp] = (overflowsByVp[r.vp] ?? 0) + Math.max(0, r.pageOverflow);
  }
  process.stderr.write("\n=== SYNTHÈSE ===\n");
  for (const [vp, po] of Object.entries(overflowsByVp)) {
    process.stderr.write(`  vp=${vp} total pageOverflow=${po}\n`);
  }

  await b.close();
  const { writeFile, mkdir } = await import("node:fs/promises");
  await mkdir("/tmp/p1h-captures", { recursive: true });
  await writeFile("/tmp/p1h-captures/viewport-sweep.json", JSON.stringify(rows, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
