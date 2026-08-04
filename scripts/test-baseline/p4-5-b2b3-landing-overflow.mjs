// P4.5-B2b3a Gate 1 · landing overflow check · Playwright headless.
// Vérifie /fr et /en à 360/390/1440 px · overflow horizontal = 0 exigé.
//
// Nécessite un serveur Next dev up sur PORT (default 3579). Le script
// suppose que le serveur est déjà démarré (flag-off ou flag-on peu importe,
// la landing ne dépend pas des flags P4.5).

import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const PORT = process.env.HTTP_TEST_PORT || "3579";
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = "/tmp/p4-5-b-captures";
const VIEWPORTS = [
  { name: "360x800", width: 360, height: 800 },
  { name: "390x844", width: 390, height: 844 },
  { name: "1440x900", width: 1440, height: 900 },
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
      const consoleErrs = [];
      page.on("console", (m) => {
        if (m.type() === "error") consoleErrs.push(m.text().slice(0, 80));
      });
      const resp = await page.goto(`${BASE}${route}`, {
        waitUntil: "networkidle", timeout: 30000,
      }).catch((e) => ({ status: () => 0, err: e.message }));
      const status = resp?.status?.() ?? 0;
      const overflow = await page.evaluate((vw) => {
        const el = document.scrollingElement || document.body;
        return el.scrollWidth - vw;
      }, viewport.width).catch(() => null);
      const url = page.url();
      results.push({
        route, viewport: viewport.name, status, overflowPx: overflow,
        finalUrl: url, consoleErrors: consoleErrs.length,
      });
      const flag = status !== 200 ? `❌ HTTP ${status}` :
                   overflow > 2 ? `⚠ OVERFLOW ${overflow}` :
                   consoleErrs.length > 0 ? `⚠ console(${consoleErrs.length})` :
                   "OK";
      process.stderr.write(`  ${viewport.name} ${route} · status=${status} overflow=${overflow}px · ${flag}\n`);
      await ctx.close();
    }
  }

  await browser.close();
  await writeFile(join(OUT, "landing-overflow.json"), JSON.stringify(results, null, 2));

  const allOk = results.every((r) => r.status === 200 && (r.overflowPx ?? 0) <= 2);
  process.stderr.write(`\n${allOk ? "PASS · landing overflow 0" : "FAIL · landing regression detected"}\n`);
  process.exit(allOk ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
