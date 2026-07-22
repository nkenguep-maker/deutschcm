// P0.B · Vérification visuelle authentifiée
// Login 3 rôles (center/admin/monde) × 12 routes × 4 viewports.
// Mesures : document.documentElement.scrollWidth vs clientWidth,
// détails des éléments dépassant, erreurs console, network errors.

import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";

const BASE = "http://localhost:3000";
const PW = process.env.P1_TEST_PASSWORD;
if (!PW) { console.error("P1_TEST_PASSWORD required"); process.exit(1); }

const ACCOUNTS = {
  monde:  { email: "paul+yema_test_monde@example.com" },
  center: { email: "paul+yema_test_center@example.com" },
  admin:  { email: "paul+yema_test_admin@example.com" },
};

const BPS = [
  { name: "360",  width: 360,  height: 800 },
  { name: "390",  width: 390,  height: 844 },
  { name: "768",  width: 768,  height: 1024 },
  { name: "1440", width: 1440, height: 900 },
];

const ROUTES = [
  { path: "/fr/center/students",     role: "center" },
  { path: "/fr/center/teachers",     role: "center" },
  { path: "/fr/center/classes",      role: "center" },
  { path: "/fr/center/billing",      role: "center" },
  { path: "/fr/admin",               role: "admin"  },
  { path: "/fr/admin/users",         role: "admin"  },
  { path: "/fr/admin/centers",       role: "admin"  },
  { path: "/fr/admin/applications",  role: "admin"  },
  { path: "/fr/admin/system",        role: "admin"  },
  { path: "/fr/notifications",       role: "monde"  },
  { path: "/fr/group",               role: "monde"  },
  { path: "/fr/discover",            role: "monde"  },
];

async function loginAs(browser, acc) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/fr/login`, { waitUntil: "networkidle", timeout: 30000 });
  await page.fill('input[type="email"]', acc.email);
  await page.fill('input[type="password"]', PW);
  const [resp] = await Promise.all([
    page.waitForResponse((r) => /supabase\.co\/auth\/v1\/token/.test(r.url()), { timeout: 20000 }).catch(() => null),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForTimeout(2500);
  await page.waitForURL(u => !u.pathname.includes("/login"), { timeout: 15000 }).catch(() => {});
  const state = await ctx.storageState();
  const status = resp?.status() ?? 0;
  const finalUrl = page.url();
  await ctx.close();
  return { state, status, finalUrl };
}

async function measure(page, viewportWidth) {
  return await page.evaluate((vw) => {
    const scrollW = document.documentElement.scrollWidth;
    const clientW = document.documentElement.clientWidth;
    const overflows = [];
    for (const el of Array.from(document.querySelectorAll("body *"))) {
      const r = el.getBoundingClientRect();
      // ignore fixed/absolute overlays intentionally larger, and things far off-screen
      if (r.right > vw + 1 && r.width < vw * 2 && r.width > 0) {
        // find selector
        const id = el.id ? `#${el.id}` : "";
        const cls = el.className && typeof el.className === "string"
          ? "." + el.className.split(" ").slice(0, 2).join(".")
          : "";
        overflows.push({
          tag: el.tagName.toLowerCase(),
          sel: `${el.tagName.toLowerCase()}${id}${cls}`.slice(0, 80),
          right: Math.round(r.right),
          width: Math.round(r.width),
        });
      }
    }
    return { scrollW, clientW, pageOverflowBy: scrollW - clientW, overflowCount: overflows.length, topOverflows: overflows.slice(0, 5) };
  }, viewportWidth);
}

async function main() {
  await mkdir("/tmp/p0b-captures", { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];
  const errors = [];

  // Login all
  const states = {};
  for (const [label, acc] of Object.entries(ACCOUNTS)) {
    process.stderr.write(`login ${label}...`);
    try {
      const { state, status } = await loginAs(browser, acc);
      states[label] = state;
      process.stderr.write(` OK (HTTP ${status})\n`);
    } catch (e) {
      process.stderr.write(` FAIL: ${e.message}\n`);
    }
  }

  for (const bp of BPS) {
    process.stderr.write(`\n=== viewport ${bp.width}x${bp.height} ===\n`);
    for (const route of ROUTES) {
      const state = states[route.role];
      if (!state) continue;
      const ctx = await browser.newContext({
        viewport: { width: bp.width, height: bp.height },
        storageState: state,
      });
      const page = await ctx.newPage();
      const cerr = [];
      const netfail = [];
      page.on("console", m => { if (m.type() === "error") cerr.push(m.text().slice(0, 120)); });
      page.on("requestfailed", r => netfail.push(`${r.method()} ${r.url().slice(0, 80)}`));

      try {
        const resp = await page.goto(BASE + route.path, { waitUntil: "domcontentloaded", timeout: 20000 });
        const status = resp?.status() ?? 0;
        await page.waitForTimeout(600);
        const finalPath = new URL(page.url()).pathname;
        const m = await measure(page, bp.width);

        const record = {
          vp: bp.name,
          route: route.path,
          role: route.role,
          http: status,
          final: finalPath,
          scrollW: m.scrollW,
          clientW: m.clientW,
          pageOverflowBy: m.pageOverflowBy,
          overflowCount: m.overflowCount,
          topOverflows: m.topOverflows,
          consoleErrors: cerr.length,
          networkFailures: netfail.length,
          netfailSamples: netfail.slice(0, 3),
        };
        results.push(record);
        process.stderr.write(`  ${route.path.padEnd(30)} scrollW=${m.scrollW} clientW=${m.clientW} ovf=${m.overflowCount}\n`);
      } catch (e) {
        errors.push({ vp: bp.name, route: route.path, error: e.message });
        process.stderr.write(`  ${route.path} FAIL: ${e.message}\n`);
      }
      await ctx.close();
    }
  }

  await browser.close();
  await writeFile("/tmp/p0b-captures/sweep-results.json", JSON.stringify({ results, errors }, null, 2));
  process.stderr.write(`\nDone. ${results.length} captures written to /tmp/p0b-captures/sweep-results.json\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
