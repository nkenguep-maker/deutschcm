// Lot 3M · viewport smoke pour vérifier que le shell mobile YEMA (login page
// publique = point d'entrée le plus fiable sans auth bakée) ne produit aucun
// overflow horizontal aux 5 viewports cibles + capture une image par viewport.
// Pour une vraie capture des dashboards Teacher/Coach/Monde/Racines, il faut
// baker les personas P-1 via le harness p4-5-b2b3-b2 puis lancer un test
// équivalent avec storageState — cf. tests/e2e/p4-5-b2b3-b2/responsive.spec.ts.

import { test, expect } from "playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync } from "node:fs";

const VIEWPORTS = [
  { name: "360x800", width: 360, height: 800 },
  { name: "390x844", width: 390, height: 844 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1024x768", width: 1024, height: 768 },
  { name: "1440x900", width: 1440, height: 900 },
];

// Pages publiques : login (chemin canonique) et racine (redirect locale).
const PUBLIC_PAGES = [
  { name: "landing-fr", path: "/fr" },
  { name: "landing-en", path: "/en" },
  { name: "login-fr", path: "/fr/login" },
  { name: "register-fr", path: "/fr/register" },
  { name: "pre-onboarding-fr", path: "/fr/pre-onboarding" },
  { name: "beta-fr", path: "/fr/beta" },
];

const ACCESSIBILITY_VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
];

const OUT_DIR = "screenshots/lot-3m-mobile";
mkdirSync(OUT_DIR, { recursive: true });

for (const p of PUBLIC_PAGES) {
  for (const vp of VIEWPORTS) {
    test(`viewport smoke · ${p.name} · ${vp.name}`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await context.newPage();
      const resp = await page.goto(p.path, { waitUntil: "load", timeout: 20_000 });
      expect(resp?.status(), `${p.name} HTTP status`).toBeLessThan(400);

      // Assertion dure : aucun overflow horizontal
      const overflowPx = await page.evaluate(() => {
        const doc = document.documentElement;
        return Math.max(0, doc.scrollWidth - doc.clientWidth);
      });
      expect(overflowPx, `overflow ${p.name} ${vp.name}`).toBe(0);

      await page.screenshot({
        path: `${OUT_DIR}/${p.name}-${vp.name}.png`,
        fullPage: false,
      });
      await context.close();
    });
  }
}

for (const p of PUBLIC_PAGES) {
  for (const vp of ACCESSIBILITY_VIEWPORTS) {
    test(`WCAG A/AA · ${p.name} · ${vp.name}`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await context.newPage();
      const resp = await page.goto(p.path, { waitUntil: "networkidle", timeout: 20_000 });
      expect(resp?.status(), `${p.name} HTTP status`).toBeLessThan(400);

      const { violations } = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      expect(violations, `${p.name} ${vp.name} doit respecter WCAG A/AA`).toEqual([]);
      await context.close();
    });
  }
}
