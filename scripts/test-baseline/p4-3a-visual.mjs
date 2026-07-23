// P4.3a · Parcours visuels · 5 routes × 2 locales × 4 viewports.
// Détecte : overflow horizontal, mocks résiduels (nom banni), erreurs console,
// requêtes échouées, cross-center leak.

import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const BASE = "http://localhost:3000";
const PW = process.env.P1_TEST_PASSWORD;
if (!PW) { console.error("P1_TEST_PASSWORD required"); process.exit(1); }

const EMAIL_A = "paul+p4_3a_admin_a@example.com";
const OUT = "/tmp/p4-3a-captures";

const ROUTES = [
  "/fr/center", "/fr/center/teachers", "/fr/center/classes",
  "/fr/center/students", "/fr/center/stats",
  "/en/center", "/en/center/teachers", "/en/center/classes",
  "/en/center/students", "/en/center/stats",
];
const VIEWPORTS = [
  { name: "360x800",  width: 360,  height: 800  },
  { name: "390x844",  width: 390,  height: 844  },
  { name: "768x1024", width: 768,  height: 1024 },
  { name: "1440x900", width: 1440, height: 900  },
];
const BANNED_NAMES = [
  "Marie Nguemo", "Sophie Tanda", "Dr. Beatrice", "Fatima Moussa",
  "Alice Fouda", "Jean-Pierre Nkolo", "Olivia Tchamba", "Diane Biya",
];
const CENTER_B_MARKERS = [
  "TEST_CENTER_B", "TEST P4.3a Center B", "TEST P4.3a Teacher B",
  "TEST P4.3a Student B1", "test_p4_3a_class_b1", "TEST_CLASS_B_1",
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
  const failedRequests = [];
  const handlers = [
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); }),
    page.on("requestfailed", (r) => failedRequests.push(`${r.method()} ${r.url()} → ${r.failure()?.errorText}`)),
  ];
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  const resp = await page.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: 30000 }).catch(() => null);
  const status = resp?.status() ?? 0;
  const html = await page.content();
  // Overflow · body scrollWidth > viewport width tolerance 2px.
  const overflow = await page.evaluate((vw) => {
    const el = document.scrollingElement || document.body;
    return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, overflow: el.scrollWidth - vw };
  }, viewport.width);
  const banned = BANNED_NAMES.filter((n) => html.includes(n));
  const centerBLeaks = CENTER_B_MARKERS.filter((m) => html.includes(m));
  await page.screenshot({ path: join(OUT, `${route.replace(/\//g, "_")}_${viewport.name}.png`), fullPage: false });
  return {
    route, viewport: viewport.name, status,
    overflowPx: overflow.overflow, scrollWidth: overflow.scrollWidth,
    consoleErrors: errors.slice(0, 5),
    failedRequests: failedRequests.slice(0, 5),
    bannedNames: banned,
    centerBLeaks,
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
  // Zoom 200% test sur 3 routes clés.
  process.stderr.write("\n═══ Zoom 200% ═══\n");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  for (const route of ["/fr/center", "/fr/center/teachers", "/fr/center/students"]) {
    const resp = await page.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: 30000 }).catch(() => null);
    const overflow = await page.evaluate(() => {
      const el = document.scrollingElement || document.body;
      return el.scrollWidth - window.innerWidth;
    });
    await page.screenshot({ path: join(OUT, `zoom200_${route.replace(/\//g, "_")}.png`), fullPage: false });
    results.push({ route, viewport: "zoom-200", status: resp?.status(), overflowPx: overflow });
    process.stderr.write(`  zoom200 ${route} · overflow=${overflow}px\n`);
  }
  await page.evaluate(() => { document.documentElement.style.zoom = ""; });

  // Keyboard navigation test · Tab sequence sur dashboard.
  process.stderr.write("\n═══ Clavier · dashboard tab sequence ═══\n");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/fr/center/teachers`, { waitUntil: "networkidle" });
  const focusChain = [];
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    const focus = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? { tag: el.tagName, type: el.type ?? null, text: (el.textContent ?? "").trim().slice(0, 40), href: el.href ?? null, visible: el.getBoundingClientRect().width > 0 } : null;
    });
    focusChain.push(focus);
    process.stderr.write(`  Tab#${i + 1} · ${focus?.tag ?? "null"} ${focus?.text ?? focus?.type ?? ""}\n`);
  }
  results.push({ keyboard: focusChain });

  await ctx.close();
  await browser.close();
  await writeFile(join(OUT, "visual.json"), JSON.stringify(results, null, 2));
  process.stderr.write(`\nWritten ${join(OUT, "visual.json")}\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
