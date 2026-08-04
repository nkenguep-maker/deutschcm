// Gate 8I · Playwright chromium reel · captures Family + Monde + Coach A/B.
//
// Le orchestrateur parent provisionne fixtures Coach A/B + PASSAGE grant +
// LearningPath adulte temp · propage credentials via env vars ·
// GATE8I_COACH_A_EMAIL, GATE8I_COACH_B_EMAIL.

import { test, expect, type Page } from "playwright/test";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";

const OUT = "captures/final-browser-acceptance";
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const manifest: string[] = ["filename\tpersona\tlocale\tviewport\troute\tsection\tuniverse\tentitlement\th1Count\toverflowCount\tresult"];

async function loginViaSupabase(page: Page, email: string, password: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supRef = new URL(url).host.split(".")[0];
  const r = await page.request.post(`${url}/auth/v1/token?grant_type=password`, {
    headers: { apikey: anon, "Content-Type": "application/json" },
    data: { email, password },
  });
  if (!r.ok()) throw new Error(`login ${email} ${r.status()}`);
  const s = await r.json();
  const payload = {
    access_token: s.access_token, token_type: s.token_type, expires_in: s.expires_in,
    expires_at: s.expires_at ?? (Math.floor(Date.now() / 1000) + s.expires_in),
    refresh_token: s.refresh_token, user: s.user,
  };
  const cookie = `sb-${supRef}-auth-token`;
  const value = `base64-${Buffer.from(JSON.stringify(payload)).toString("base64")}`;
  const host = new URL(process.env.PLAYWRIGHT_BASE_URL!).hostname;
  await page.context().addCookies([
    { name: cookie, value, domain: host, path: "/", httpOnly: false, secure: false, sameSite: "Lax" },
  ]);
}

async function captureAndRecord(page: Page, filename: string, meta: {
  persona: string; locale: string; viewport: string; route: string; section: string; universe: string; entitlement: string;
}) {
  const path = `${OUT}/${filename}`;
  await page.screenshot({ path, fullPage: true });
  const h1Count = await page.locator("h1").count();
  const overflow = await page.$$eval("*", (els, w) =>
    els.filter((e) => {
      if (e.getBoundingClientRect().right <= w + 1) return false;
      const ALLOW = ["[data-overflow-ok]", ".marquee", "[role=marquee]", "[data-carousel]"];
      for (const sel of ALLOW) if (e.matches(sel) || e.closest(sel)) return false;
      return true;
    }).length, page.viewportSize()?.width ?? 1440,
  );
  const result = h1Count === 1 && overflow === 0 ? "PASS" : `WARN(h1=${h1Count},ov=${overflow})`;
  manifest.push(`${filename}\t${meta.persona}\t${meta.locale}\t${meta.viewport}\t${meta.route}\t${meta.section}\t${meta.universe}\t${meta.entitlement}\t${h1Count}\t${overflow}\t${result}`);
}

const FAMILY_EMAIL = "test_yema_qa_family@example.com";
const PASSWORD = process.env.P1_TEST_PASSWORD!;
const COACH_A_EMAIL = process.env.GATE8I_COACH_A_EMAIL ?? "";
const COACH_B_EMAIL = process.env.GATE8I_COACH_B_EMAIL ?? "";

test.describe("Gate 8I · Family + Monde adulte + retour · FR + EN", () => {
  for (const locale of ["fr", "en"] as const) {
    test(`${locale} · Family avant navigation`, async ({ page }) => {
      await loginViaSupabase(page, FAMILY_EMAIL, PASSWORD);
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto(`/${locale}/famille`);
      await page.waitForLoadState("networkidle");
      await captureAndRecord(page, `family-${locale}-1440.png`, {
        persona: "family", locale, viewport: "1440", route: `/${locale}/famille`,
        section: "children", universe: "N/A", entitlement: "FAMILY_WORLD+ROOTS_FAMILY",
      });
    });

    test(`${locale} · Monde adulte apres navigation`, async ({ page }) => {
      await loginViaSupabase(page, FAMILY_EMAIL, PASSWORD);
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto(`/${locale}/dashboard`);
      await page.waitForLoadState("networkidle");
      const bodyText = await page.locator("body").textContent();
      expect(bodyText, "Monde adulte sans noms enfants").not.toMatch(/Lina|Malik|Aïcha/);
      await captureAndRecord(page, `monde-adulte-${locale}-1440.png`, {
        persona: "family+passage", locale, viewport: "1440", route: `/${locale}/dashboard`,
        section: "student-monde-adulte", universe: "MONDE", entitlement: "PASSAGE+LP",
      });
    });

    test(`${locale} · Family apres retour`, async ({ page }) => {
      await loginViaSupabase(page, FAMILY_EMAIL, PASSWORD);
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto(`/${locale}/dashboard`);
      await page.waitForLoadState("networkidle");
      await page.goto(`/${locale}/famille`);
      await page.waitForLoadState("networkidle");
      await captureAndRecord(page, `family-retour-${locale}-1440.png`, {
        persona: "family", locale, viewport: "1440", route: `/${locale}/famille`,
        section: "after-monde", universe: "N/A", entitlement: "FAMILY_WORLD+ROOTS_FAMILY",
      });
    });
  }
});

test.describe("Gate 8I · Coach A + Coach B dashboards Chromium", () => {
  test.skip(!COACH_A_EMAIL || !COACH_B_EMAIL, "Coach credentials absent · orchestrator ne les a pas propagés");

  for (const [label, email] of [["a", COACH_A_EMAIL], ["b", COACH_B_EMAIL]] as const) {
    test(`Coach ${label.toUpperCase()} · dashboard Racines Chromium`, async ({ page }) => {
      await loginViaSupabase(page, email, PASSWORD);
      await page.setViewportSize({ width: 1440, height: 1000 });
      const resp = await page.goto("/fr/dashboard", { waitUntil: "networkidle" });
      const status = resp?.status() ?? 0;
      expect(status, `Coach ${label.toUpperCase()} status`).toBeLessThan(400);
      await captureAndRecord(page, `coach-${label}-fr-1440.png`, {
        persona: `coach_${label}`, locale: "fr", viewport: "1440", route: "/fr/dashboard",
        section: "coach-racines-dashboard", universe: "RACINES", entitlement: "RACINES_COACH+Circle",
      });
    });
  }
});

test.afterAll(async () => {
  writeFileSync(`${OUT}/MANIFEST.txt`, manifest.join("\n"));
});
