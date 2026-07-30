// P4.6 Lot 6 · smoke Preview P-1 unauthenticated.
//
// Ce spec vérifie ce qui peut l'être SANS baker les 9 personas :
//   1. Les endpoints /api/qa/* sont 404 en réponse GET (protection stable).
//   2. Les pages publiques (landing FR/EN, login FR) restent 200 aux
//      viewports cibles (regression check du shell).
//   3. Aucun overflow horizontal à 360/390/768/1024/1440.
//
// La validation des 9 personas AUTHENTIFIÉS + captures nécessite le
// bake QA préalable (voir docs/YEMA_P4_6_LOT6_PREVIEW_RUNBOOK.md pour
// les commandes exactes). Elle sortira dans un spec authenticated
// séparé si tu veux automatiser cette étape.

import { test, expect } from "playwright/test";
import { mkdirSync } from "node:fs";

const VIEWPORTS = [
  { name: "360x800", width: 360, height: 800 },
  { name: "390x844", width: 390, height: 844 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1024x768", width: 1024, height: 768 },
  { name: "1440x900", width: 1440, height: 900 },
];

const PUBLIC_PAGES = [
  { name: "landing-fr", path: "/fr" },
  { name: "landing-en", path: "/en" },
  { name: "login-fr", path: "/fr/login" },
];

// Endpoints QA qui doivent renvoyer 404 par défaut (gate off si la Preview
// n'a pas YEMA_QA_MODE_ENABLED=true, OU 200/303 si la Preview a le gate on).
// On assert uniquement qu'ils ne renvoient JAMAIS 500 ni ne fuient de
// secret dans le body.
const QA_ENDPOINTS = [
  "/api/qa/status",
  "/api/qa/child-session?child=monde",
  "/api/qa/child-session?child=racines",
];

const OUT_DIR = "screenshots/lot-6-preview";
mkdirSync(OUT_DIR, { recursive: true });

for (const p of PUBLIC_PAGES) {
  for (const vp of VIEWPORTS) {
    test(`public smoke · ${p.name} · ${vp.name}`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await context.newPage();
      const resp = await page.goto(p.path, { waitUntil: "load", timeout: 30_000 });
      expect(resp?.status(), `${p.name} HTTP status`).toBeLessThan(400);

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

test.describe("QA endpoints · gate 404 stable", () => {
  for (const url of QA_ENDPOINTS) {
    test(`GET ${url} ne renvoie ni 500 ni fuite secret`, async ({ request }) => {
      const resp = await request.get(url);
      // Le statut varie selon que le gate QA est actif (200/303) ou off (404).
      // On accepte les deux mais on refuse toute réponse 5xx (bug serveur)
      // et toute fuite de clé/token/URL Supabase.
      expect(resp.status(), `status < 500 for ${url}`).toBeLessThan(500);
      const text = await resp.text();
      const forbidden = /SUPABASE_SERVICE_ROLE|SUPABASE_JWT_SECRET|sbp_[a-z0-9]{20,}|sb_secret_[A-Za-z0-9_]{20,}/i;
      expect(forbidden.test(text), `secret leak in body of ${url}`).toBe(false);
    });
  }
});
