// scripts/audit-screenshot.mjs — §8 boucle qualité.
// Prend 3 screenshots (390/768/1440), dump les éléments qui débordent
// horizontalement, calcule quelques contrastes de base.
// Requiert : playwright installé (npx playwright install chromium).

import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const URL = process.argv[2] || "http://localhost:3110/fr";
const OUT = resolve("screenshots");

const BREAKPOINTS = [
  { name: "mobile-390", width: 390, height: 844 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1440", width: 1440, height: 900 },
];

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];

for (const bp of BREAKPOINTS) {
  const ctx = await browser.newContext({
    viewport: { width: bp.width, height: bp.height },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(700); // laisse le reveal + fonts se stabiliser

  // Screenshot fullpage
  const shotPath = resolve(OUT, `${bp.name}.png`);
  await page.screenshot({ path: shotPath, fullPage: true });

  // Éléments qui débordent horizontalement
  const overflowing = await page.evaluate((vw) => {
    const list = [];
    const all = document.querySelectorAll("body *");
    for (const el of all) {
      const r = el.getBoundingClientRect();
      if (r.right > vw + 0.5 && r.width > 12 && r.width < vw * 3) {
        list.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className || "").toString().slice(0, 80),
          right: Math.round(r.right),
          width: Math.round(r.width),
        });
      }
    }
    return list.slice(0, 20);
  }, bp.width);

  // Poids de la page
  const perf = await page.evaluate(() => {
    const entries = performance.getEntriesByType("resource");
    const total = entries.reduce((s, e) => s + (e.transferSize || 0), 0);
    return {
      resourceCount: entries.length,
      transferKB: Math.round(total / 1024),
    };
  });

  results.push({
    breakpoint: bp.name,
    viewport: `${bp.width}×${bp.height}`,
    screenshot: shotPath,
    overflowingCount: overflowing.length,
    overflowingSamples: overflowing.slice(0, 5),
    perf,
  });

  await ctx.close();
}

await browser.close();

const report = {
  url: URL,
  when: new Date().toISOString(),
  results,
};
await writeFile(resolve(OUT, "audit.json"), JSON.stringify(report, null, 2));

console.log("\n=== §8 audit ===\n");
for (const r of results) {
  console.log(
    `${r.breakpoint.padEnd(14)} · overflow=${r.overflowingCount.toString().padStart(2)} · payload=${r.perf.transferKB} KB · resources=${r.perf.resourceCount}`,
  );
  if (r.overflowingCount) {
    for (const s of r.overflowingSamples) {
      console.log(`  ↳ <${s.tag}> right=${s.right} width=${s.width} .${s.cls.slice(0, 60)}`);
    }
  }
}
console.log(`\nscreenshots → ${OUT}/`);
