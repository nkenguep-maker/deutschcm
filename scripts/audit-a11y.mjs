// scripts/audit-a11y.mjs — §10 doctrine v2 : accessibilité mesurée.
// axe-core sur les pages publiques principales, résultat en JSON + résumé.

import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const BASE = process.argv[2] || "http://localhost:3110";
const OUT = resolve("screenshots");

const PAGES = [
  { name: "landing-fr",    path: "/fr" },
  { name: "langues-fr",    path: "/fr/langues" },
  { name: "login-fr",      path: "/fr/login" },
  { name: "register-fr",   path: "/fr/register" },
  { name: "methode-fr",    path: "/fr/methode" },
  { name: "histoires-fr",  path: "/fr/histoires" },
  { name: "manifeste-fr",  path: "/fr/manifeste" },
];

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
const page = await ctx.newPage();

const report = { base: BASE, when: new Date().toISOString(), pages: [] };

for (const p of PAGES) {
  const url = `${BASE}${p.path}`;
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(600);

    const res = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "best-practice"])
      .disableRules(["region"])
      .analyze();

    const violations = res.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      nodes: v.nodes.length,
      firstTarget: v.nodes[0]?.target?.[0]?.slice(0, 100) ?? "",
    }));

    report.pages.push({
      name: p.name,
      url,
      violations: violations.length,
      details: violations,
    });
  } catch (e) {
    report.pages.push({
      name: p.name,
      url,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}

await ctx.close();
await browser.close();

await writeFile(resolve(OUT, "a11y.json"), JSON.stringify(report, null, 2));

console.log("\n=== §10 axe-core audit ===\n");
for (const p of report.pages) {
  if ("error" in p) {
    console.log(`✗ ${p.name.padEnd(16)} · error: ${p.error}`);
    continue;
  }
  const impact = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  for (const v of p.details) if (v.impact) impact[v.impact] = (impact[v.impact] || 0) + 1;
  const status = p.violations === 0 ? "✓" : impact.critical || impact.serious ? "⚠" : "·";
  console.log(
    `${status} ${p.name.padEnd(16)} · ${p.violations} violations` +
      (p.violations > 0
        ? `  (crit ${impact.critical} · ser ${impact.serious} · mod ${impact.moderate} · min ${impact.minor})`
        : ""),
  );
  if (p.violations > 0) {
    for (const v of p.details.slice(0, 5)) {
      console.log(`    ${v.impact?.padEnd(8) ?? "—"} ${v.id}  ×${v.nodes}  ${v.firstTarget}`);
    }
  }
}
console.log(`\nfull report → ${OUT}/a11y.json`);
