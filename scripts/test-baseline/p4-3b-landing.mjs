// P4.3b hardening · Capture landing FR/EN × 3 viewports · vérifie non-régression.

import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const BASE = "http://localhost:3000";
const OUT = "/tmp/p4-3b-captures";
const VIEWPORTS = [
  { name: "360x800",  width: 360,  height: 800  },
  { name: "390x844",  width: 390,  height: 844  },
  { name: "1440x900", width: 1440, height: 900  },
];
const ROUTES = ["/fr", "/en"];

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];
  for (const viewport of VIEWPORTS) {
    for (const route of ROUTES) {
      const ctx = await browser.newContext({ viewport });
      const page = await ctx.newPage();
      const errs = [];
      page.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 80)); });
      const resp = await page.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: 30000 }).catch(() => null);
      const status = resp?.status() ?? 0;
      const overflow = await page.evaluate((vw) => {
        const el = document.scrollingElement || document.body;
        return el.scrollWidth - vw;
      }, viewport.width);
      await page.screenshot({ path: join(OUT, `landing_${route.slice(1)}_${viewport.name}.png`), fullPage: false });
      results.push({ route, viewport: viewport.name, status, overflowPx: overflow, consoleErrors: errs.length });
      process.stderr.write(`  ${viewport.name} ${route} · status=${status} overflow=${overflow}px consoleErr=${errs.length}\n`);
      await ctx.close();
    }
  }
  await browser.close();
  await writeFile(join(OUT, "landing.json"), JSON.stringify(results, null, 2));
  process.stderr.write(`\nWritten ${join(OUT, "landing.json")}\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
