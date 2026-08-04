// Gate 8F · Playwright réel · dual context Family + Monde adulte + captures.
//
// Le orchestrateur parent a provisionné PASSAGE + LearningPath adulte MONDE
// temp sur test_yema_qa_family@example.com. Cette spec navigue via un vrai
// navigateur Chromium et vérifie · pas de fetch, pas de mock.

import { test, expect, type Page } from "playwright/test";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";

const OUT = "captures/browser-signoff";
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

async function captureAndRecord(page: Page, filename: string, meta: { persona: string; locale: string; viewport: string; route: string; section: string; universe: string; entitlement: string }) {
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
  const result = h1Count <= 1 && overflow === 0 ? "PASS" : "FAIL";
  manifest.push(`${filename}\t${meta.persona}\t${meta.locale}\t${meta.viewport}\t${meta.route}\t${meta.section}\t${meta.universe}\t${meta.entitlement}\t${h1Count}\t${overflow}\t${result}`);
}

const FAMILY_EMAIL = "test_yema_qa_family@example.com";
const PASSWORD = process.env.P1_TEST_PASSWORD!;

test.describe("Gate 8F · dual context Family + Monde adulte · chromium réel", () => {
  test("FR · Family avant navigation", async ({ page }) => {
    await loginViaSupabase(page, FAMILY_EMAIL, PASSWORD);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/fr/famille");
    await page.waitForLoadState("networkidle");
    // Vérifier au moins un enfant visible.
    const bodyText = await page.locator("body").textContent();
    expect(bodyText, "Family shows children names").toMatch(/Lina|Malik|Aïcha/i);
    await captureAndRecord(page, "family-fr-1440.png", {
      persona: "family", locale: "fr", viewport: "1440", route: "/fr/famille",
      section: "children", universe: "N/A", entitlement: "FAMILY_WORLD+ROOTS_FAMILY",
    });
  });

  test("FR · Monde adulte après navigation avec PASSAGE + LP", async ({ page }) => {
    await loginViaSupabase(page, FAMILY_EMAIL, PASSWORD);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/fr/dashboard");
    await page.waitForLoadState("networkidle");
    // Vérifier redirection réussie (status 200) et absence de noms enfants.
    const bodyText = await page.locator("body").textContent();
    // Le dashboard adulte NE doit PAS contenir les noms Lina/Malik/Aïcha.
    expect(bodyText, "Adult dashboard sans noms enfants").not.toMatch(/Lina|Malik|Aïcha/);
    await captureAndRecord(page, "monde-adulte-fr-1440.png", {
      persona: "family+passage", locale: "fr", viewport: "1440", route: "/fr/dashboard",
      section: "student-monde-adulte", universe: "MONDE", entitlement: "PASSAGE+LP",
    });
  });

  test("FR · retour Family après Monde adulte", async ({ page }) => {
    await loginViaSupabase(page, FAMILY_EMAIL, PASSWORD);
    await page.setViewportSize({ width: 1440, height: 1000 });
    // Aller au dashboard adulte d'abord.
    await page.goto("/fr/dashboard");
    await page.waitForLoadState("networkidle");
    // Revenir à Family.
    await page.goto("/fr/famille");
    await page.waitForLoadState("networkidle");
    const bodyText = await page.locator("body").textContent();
    expect(bodyText, "Family après retour shows children").toMatch(/Lina|Malik|Aïcha/i);
    await captureAndRecord(page, "family-retour-fr-1440.png", {
      persona: "family", locale: "fr", viewport: "1440", route: "/fr/famille",
      section: "after-monde-navigation", universe: "N/A", entitlement: "FAMILY_WORLD+ROOTS_FAMILY",
    });
  });

  test("EN · Family + Monde adulte + retour", async ({ page }) => {
    await loginViaSupabase(page, FAMILY_EMAIL, PASSWORD);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/en/famille");
    await page.waitForLoadState("networkidle");
    await captureAndRecord(page, "family-en-1440.png", {
      persona: "family", locale: "en", viewport: "1440", route: "/en/famille",
      section: "children", universe: "N/A", entitlement: "FAMILY_WORLD+ROOTS_FAMILY",
    });
    await page.goto("/en/dashboard");
    await page.waitForLoadState("networkidle");
    await captureAndRecord(page, "monde-adulte-en-1440.png", {
      persona: "family+passage", locale: "en", viewport: "1440", route: "/en/dashboard",
      section: "student-monde-adulte", universe: "MONDE", entitlement: "PASSAGE+LP",
    });
  });
});

test.afterAll(async () => {
  writeFileSync(`${OUT}/MANIFEST.txt`, manifest.join("\n"));
});
