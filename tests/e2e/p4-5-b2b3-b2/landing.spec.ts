// P4.5-B2b3b-b2 · landing (§18).
// /fr et /en aux largeurs 360, 390, 1440 · HTTP 200 · overflow 0 · aucune
// redirection vers Teacher/Student · aucune erreur console bloquante.

import { test, expect } from "playwright/test";

const WIDTHS = [360, 390, 1440];
const LOCALES = ["fr", "en"];

for (const locale of LOCALES) {
  for (const width of WIDTHS) {
    test(`landing /${locale} @ ${width}px · 200 + overflow 0 + pas de redirect`, async ({ browser }) => {
      const consoleErrors: string[] = [];
      const context = await browser.newContext({
        viewport: { width, height: 800 },
      });
      const page = await context.newPage();
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });
      const resp = await page.goto(`/${locale}`);
      expect(resp?.status(), `HTTP 200 sur /${locale}`).toBe(200);
      // Aucune redirection vers Teacher/Student
      expect(page.url()).not.toMatch(/\/(teacher|student)\//);
      // Overflow horizontal global = 0
      const overflowPx = await page.evaluate(() => {
        const doc = document.documentElement;
        return Math.max(0, doc.scrollWidth - doc.clientWidth);
      });
      expect(overflowPx, `overflow global 0 sur /${locale}@${width}`).toBe(0);
      // Aucune erreur console bloquante (Warn tolérées)
      const blocking = consoleErrors.filter((e) => !/^(Warning|Failed to load resource)/i.test(e));
      expect(blocking, `pas d'erreur console bloquante sur /${locale}@${width}`).toEqual([]);
      await context.close();
    });
  }
}
