// P0.B · Non-régression landing FR/EN
// Test anonyme (pas de login) sur / /fr et /en aux 3 viewports critiques.
// Vérifie : aucun overflow horizontal, aucun élément shell P0.B ne fuit.

import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const BPS = [
  { name: "360",  width: 360,  height: 800 },
  { name: "390",  width: 390,  height: 844 },
  { name: "1440", width: 1440, height: 900 },
];
const ROUTES = ["/fr", "/en"];

// Classes P0.B qui ne DOIVENT PAS apparaître sur la landing.
const P0B_LEAK = ["data-list", "data-card", "filter-row", "safe-area-inset", "state-offline", "state-locked", "tech-block"];

async function measure(page, vw) {
  return page.evaluate((vw) => {
    const scrollW = document.documentElement.scrollWidth;
    const clientW = document.documentElement.clientWidth;
    const ovf = [];
    for (const el of Array.from(document.querySelectorAll("body *"))) {
      const r = el.getBoundingClientRect();
      if (r.right > vw + 1 && r.width < vw * 2 && r.width > 0) {
        const cls = typeof el.className === "string" ? el.className : "";
        ovf.push({ tag: el.tagName.toLowerCase(), cls: cls.slice(0, 80), right: Math.round(r.right), width: Math.round(r.width) });
      }
    }
    return { scrollW, clientW, pageOverflow: scrollW - clientW, ovf };
  }, vw);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  let leakHits = [];

  for (const bp of BPS) {
    for (const route of ROUTES) {
      const ctx = await browser.newContext({ viewport: { width: bp.width, height: bp.height } });
      const page = await ctx.newPage();
      const cerr = [];
      page.on("console", m => { if (m.type() === "error") cerr.push(m.text().slice(0, 100)); });
      const resp = await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(600);
      const status = resp?.status() ?? 0;
      const m = await measure(page, bp.width);

      // Check P0.B class leaks
      const html = await page.content();
      const leaks = P0B_LEAK.filter(cls => html.includes(cls));
      if (leaks.length) leakHits.push({ vp: bp.name, route, leaks });

      results.push({
        vp: bp.name,
        route,
        http: status,
        scrollW: m.scrollW,
        clientW: m.clientW,
        pageOverflow: m.pageOverflow,
        overflowCount: m.ovf.length,
        topOvf: m.ovf.slice(0, 5),
        leaks,
        consoleErrors: cerr.length,
      });
      process.stderr.write(`  ${route.padEnd(8)} ${bp.name.padEnd(4)}  scrollW=${m.scrollW} clientW=${m.clientW} ovf=${m.ovf.length} leaks=${leaks.length}\n`);
      await ctx.close();
    }
  }

  await browser.close();
  const { writeFile } = await import("node:fs/promises");
  await writeFile("/tmp/p0b-captures/landing-results.json", JSON.stringify({ results, leakHits }, null, 2));
  process.stderr.write("\nDone. /tmp/p0b-captures/landing-results.json\n");
}
main().catch(e => { console.error(e); process.exit(1); });
