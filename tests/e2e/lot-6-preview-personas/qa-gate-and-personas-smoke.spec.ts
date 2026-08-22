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
  { name: "open-beta-fr", path: "/fr/beta" },
  { name: "register-fr", path: "/fr/register" },
  { name: "pre-onboarding-fr", path: "/fr/pre-onboarding" },
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

const AUTH_BOUNDARIES = [
  { path: "/api/notifications", status: 401 },
  { path: "/api/social", status: 401 },
  { path: "/api/messaging/inbox", status: 404 },
  { path: "/api/admin/applications", status: 403 },
  { path: "/api/center/pending", status: 404 },
];

const CALLBACK_FAILURES = [
  { next: "/fr/onboarding/monde", loginPath: "/fr/login" },
  { next: "/en/dashboard", loginPath: "/en/login" },
  { next: "https://attacker.invalid/steal", loginPath: "/login" },
  { next: "//attacker.invalid/steal", loginPath: "/login" },
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

test("open beta entry point reaches public registration by keyboard", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto("/fr/beta", { waitUntil: "load", timeout: 30_000 });
  expect(response?.status(), "open beta HTTP status").toBe(200);

  const registerLink = page.locator('a[href="/fr/register"]');
  await expect(registerLink).toBeVisible();
  await registerLink.focus();
  await expect(registerLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/fr\/register$/);
  await expect(page.locator("form")).toBeVisible();
});

test("preconfirmation onboarding records a World journey without authentication", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto("/fr/pre-onboarding", { waitUntil: "load", timeout: 30_000 });
  expect(response?.status(), "pre-onboarding HTTP status").toBe(200);

  await page.getByRole("button", { name: /Une langue du monde/ }).click();
  await expect(page.getByRole("heading", { name: "Quelle langue souhaitez-vous apprendre ?" })).toBeVisible();
  await page.getByRole("button", { name: /Allemand/ }).click();
  await expect(page.getByRole("heading", { name: "À quoi doit vous servir cette langue ?" })).toBeVisible();
  await page.getByRole("button", { name: /Voyager/ }).click();

  await expect(page).toHaveURL(/\/fr\/pre-onboarding\/complete$/);
  await expect(page.getByRole("heading", { name: "Votre parcours est prêt." })).toBeVisible();
  const worldDraft = await page.evaluate(() => {
    const raw = localStorage.getItem("yema.preconfirmation.journey");
    return raw ? JSON.parse(raw) : null;
  });
  expect(worldDraft).toMatchObject({
    version: 1,
    authUserId: null,
    persona: "student_monde",
    pathwayVariant: "TOURISM",
    languageId: "deutsch",
  });
  expect(typeof worldDraft?.createdAt).toBe("number");
});

test("preconfirmation onboarding records a Roots family journey and keeps coming languages unavailable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/fr/pre-onboarding", { waitUntil: "load", timeout: 30_000 });

  await page.getByRole("button", { name: /Une langue de famille/ }).click();
  await expect(page.getByRole("heading", { name: "Quelle langue souhaitez-vous retrouver ?" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Bassa/ })).toBeDisabled();
  await page.getByRole("button", { name: /Wolof/ }).click();
  await expect(page.getByRole("heading", { name: "Pour qui commence ce parcours ?" })).toBeVisible();
  await page.getByRole("button", { name: /Pour ma famille/ }).click();

  await expect(page).toHaveURL(/\/fr\/pre-onboarding\/complete$/);
  await expect(page.getByRole("heading", { name: "Votre parcours est prêt." })).toBeVisible();
  const rootsDraft = await page.evaluate(() => {
    const raw = localStorage.getItem("yema.preconfirmation.journey");
    return raw ? JSON.parse(raw) : null;
  });
  expect(rootsDraft).toMatchObject({
    version: 1,
    authUserId: null,
    persona: "family",
    languageId: "wolof",
  });
  expect(typeof rootsDraft?.createdAt).toBe("number");
});

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

test.describe("public auth boundaries · fail closed", () => {
  for (const boundary of AUTH_BOUNDARIES) {
    test(`GET ${boundary.path} refuse une session anonyme`, async ({ request }) => {
      const response = await request.get(boundary.path);
      expect(response.status()).toBe(boundary.status);
      const text = await response.text();
      expect(text).not.toMatch(/SUPABASE_SERVICE_ROLE|SUPABASE_JWT_SECRET|sbp_[a-z0-9]{20,}|sb_secret_[A-Za-z0-9_]{20,}/i);
    });
  }
});

test.describe("auth callback · safe failure redirects", () => {
  for (const callback of CALLBACK_FAILURES) {
    test(`keeps next=${callback.next} on YEMA`, async ({ request, baseURL }) => {
      const response = await request.get(
        `/auth/callback?next=${encodeURIComponent(callback.next)}`,
        { maxRedirects: 0 },
      );
      expect(response.status()).toBe(307);

      const location = response.headers().location;
      expect(location).toBeTruthy();
      const redirect = new URL(location!, baseURL);
      expect(redirect.origin).toBe(new URL(baseURL!).origin);
      expect(redirect.pathname).toBe(callback.loginPath);
      expect(redirect.searchParams.get("error")).toBe("auth_callback_failed");
    });
  }
});

test("role setup requires an authenticated session", async ({ request, baseURL }) => {
  const response = await request.get("/fr/setup-role", { maxRedirects: 0 });
  expect(response.status()).toBe(307);

  const redirect = new URL(response.headers().location!, baseURL);
  expect(redirect.origin).toBe(new URL(baseURL!).origin);
  expect(redirect.pathname).toBe("/fr/login");
  expect(redirect.searchParams.get("next")).toBe("/fr/setup-role");
});
