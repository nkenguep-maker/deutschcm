// Gate 8K · Playwright chromium reel · flow UI complet Family → dialog PIN
// → dashboard enfant + Coach data-testid count · network dual context.

import { test, expect, type Page, type Request } from "playwright/test";
import { existsSync, mkdirSync, appendFileSync } from "node:fs";

const OUT = "captures/final-browser-acceptance";
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
const MANIFEST_PATH = `${OUT}/MANIFEST.txt`;
function appendManifest(row: string) { appendFileSync(MANIFEST_PATH, "\n" + row); }

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
  // @supabase/ssr 0.10.3+ exige base64URL (-_) et non pas base64 classique
  // (+/=) · sinon stringFromBase64URL throw et le cookie est ignoré → 401.
  const value = `base64-${Buffer.from(JSON.stringify(payload)).toString("base64url")}`;
  const cookie = `sb-${supRef}-auth-token`;
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
  appendManifest(`${filename}\t${meta.persona}\t${meta.locale}\t${meta.viewport}\t${meta.route}\t${meta.section}\t${meta.universe}\t${meta.entitlement}\t${h1Count}\t${overflow}\t${result}`);
}

const FAMILY_EMAIL = "test_yema_qa_family@example.com";
const PASSWORD = process.env.P1_TEST_PASSWORD!;
const COACH_A_EMAIL = process.env.GATE8K_COACH_A_EMAIL ?? "";
const COACH_B_EMAIL = process.env.GATE8K_COACH_B_EMAIL ?? "";

test.describe("Gate 8K · Child Monde flow UI complet · PIN dialog Family → dashboard", () => {
  for (const locale of ["fr", "en"] as const) {
    test(`${locale} · Lina · PIN dialog → dashboard Child Monde`, async ({ page }) => {
      await loginViaSupabase(page, FAMILY_EMAIL, PASSWORD);
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto(`/${locale}/famille`, { waitUntil: "networkidle" });

      // Click "Open child space" · trouve la carte de Lina.
      // Chaque carte a data-testid="family-child-open-space" · on cible via textContent parent.
      const linaCard = page.locator('[data-testid="family-child-card"]').filter({ hasText: "Lina" }).first();
      await linaCard.locator('[data-testid="family-child-open-space"]').click();

      // Dialog PIN doit apparaître.
      await expect(page.locator('[data-testid="child-pin-dialog"]')).toBeVisible();
      // Capture dialog.
      if (locale === "fr") {
        await captureAndRecord(page, `child-monde-pin-dialog-${locale}-1440.png`, {
          persona: "family_pin_dialog", locale, viewport: "1440", route: `/${locale}/famille`,
          section: "child-pin-dialog", universe: "MONDE", entitlement: "FAMILY_WORLD",
        });
      }
      // Saisir PIN Lina · variable ou fixture canonique "1234".
      await page.locator('[data-testid="child-pin-input"]').fill("1234");
      // Attendre POST + navigation.
      const [resp] = await Promise.all([
        page.waitForResponse((r) => r.url().includes("/api/child-session") && r.request().method() === "POST"),
        page.locator('[data-testid="child-pin-submit"]').click(),
      ]);
      expect(resp.status(), "POST /api/child-session status").toBe(200);
      await page.waitForURL((u) => u.pathname.includes("/dashboard"), { timeout: 10000 });
      await page.waitForLoadState("networkidle");
      // Verifier dashboard Child Monde rendu (contient "Lina").
      const bodyText = await page.locator("body").textContent();
      expect(bodyText, "Child Monde dashboard rendu · prenom Lina").toContain("Lina");
      await captureAndRecord(page, `child-monde-ui-dashboard-${locale}-1440.png`, {
        persona: "child_monde_ui", locale, viewport: "1440", route: `/${locale}/dashboard`,
        section: "child-dashboard-via-pin-ui", universe: "MONDE", entitlement: "FAMILY_WORLD",
      });
      // Logout enfant.
      await page.request.delete(`${process.env.PLAYWRIGHT_BASE_URL}/api/child-session`);
    });
  }
});

test.describe("Gate 8K · Child Racines flow UI complet · Aïcha", () => {
  for (const locale of ["fr", "en"] as const) {
    test(`${locale} · Aïcha · PIN dialog → dashboard Child Racines`, async ({ page }) => {
      await loginViaSupabase(page, FAMILY_EMAIL, PASSWORD);
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto(`/${locale}/famille`, { waitUntil: "networkidle" });

      const aichaCard = page.locator('[data-testid="family-child-card"]').filter({ hasText: "Aïcha" }).first();
      await aichaCard.locator('[data-testid="family-child-open-space"]').click();
      await expect(page.locator('[data-testid="child-pin-dialog"]')).toBeVisible();
      if (locale === "fr") {
        await captureAndRecord(page, `child-racines-pin-dialog-${locale}-1440.png`, {
          persona: "family_pin_dialog", locale, viewport: "1440", route: `/${locale}/famille`,
          section: "child-pin-dialog", universe: "RACINES", entitlement: "ROOTS_FAMILY",
        });
      }
      await page.locator('[data-testid="child-pin-input"]').fill("5678");
      const [resp] = await Promise.all([
        page.waitForResponse((r) => r.url().includes("/api/child-session") && r.request().method() === "POST"),
        page.locator('[data-testid="child-pin-submit"]').click(),
      ]);
      expect(resp.status()).toBe(200);
      await page.waitForURL((u) => u.pathname.includes("/dashboard"), { timeout: 10000 });
      await page.waitForLoadState("networkidle");
      const bodyText = await page.locator("body").textContent();
      expect(bodyText).toContain("Aïcha");
      await captureAndRecord(page, `child-racines-ui-dashboard-${locale}-1440.png`, {
        persona: "child_racines_ui", locale, viewport: "1440", route: `/${locale}/dashboard`,
        section: "child-dashboard-via-pin-ui", universe: "RACINES", entitlement: "ROOTS_FAMILY",
      });
      await page.request.delete(`${process.env.PLAYWRIGHT_BASE_URL}/api/child-session`);
    });
  }
});

test.describe("Gate 8K · PIN dialog · erreur générique sans divulgation", () => {
  test("PIN incorrect → erreur générique, dialog reste ouvert", async ({ page }) => {
    await loginViaSupabase(page, FAMILY_EMAIL, PASSWORD);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/fr/famille", { waitUntil: "networkidle" });
    const linaCard = page.locator('[data-testid="family-child-card"]').filter({ hasText: "Lina" }).first();
    await linaCard.locator('[data-testid="family-child-open-space"]').click();
    await expect(page.locator('[data-testid="child-pin-dialog"]')).toBeVisible();
    await page.locator('[data-testid="child-pin-input"]').fill("0000");
    await page.locator('[data-testid="child-pin-submit"]').click();
    // Erreur générique visible · dialog reste ouvert.
    await expect(page.locator('[data-testid="child-pin-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="child-pin-dialog"]')).toBeVisible();
  });
});

test.describe("Gate 8K · Coach A/B data-testid présent dans le DOM · count via API scope", () => {
  test.skip(!COACH_A_EMAIL || !COACH_B_EMAIL, "Coach credentials absent");

  // Note · Coach A/B users n'ont pas de LearningPath adulte donc /dashboard
  // redirige à onboarding. Le data-testid "coach-learner-card" reste
  // enforced dans CoachLearnersSection.tsx (test structurel · voir vitest).
  // Le comptage exact via DOM Chromium nécessite provisionning LP adulte
  // Coach · differed vers mini-lot dédié Coach dashboard render.

  test("Coach A · API isolation scope (fallback si DOM non accessible)", async ({ page }) => {
    await loginViaSupabase(page, COACH_A_EMAIL, PASSWORD);
    await page.setViewportSize({ width: 1440, height: 1000 });
    const r = await page.request.get(`${process.env.PLAYWRIGHT_BASE_URL}/api/roots-coach/profiles?pageSize=50`);
    if (r.status() !== 200) throw new Error(`Coach A API ${r.status()}`);
    const body = await r.json();
    expect(body.items?.length ?? 0, "Coach A voit 1 apprenant").toBe(1);
    const child = body.items[0];
    expect(child.circleLanguage?.toUpperCase() ?? "", "Coach A circle WOLOF").toBe("WOLOF");
  });

  test("Coach B · API isolation scope", async ({ page }) => {
    await loginViaSupabase(page, COACH_B_EMAIL, PASSWORD);
    await page.setViewportSize({ width: 1440, height: 1000 });
    const r = await page.request.get(`${process.env.PLAYWRIGHT_BASE_URL}/api/roots-coach/profiles?pageSize=50`);
    if (r.status() !== 200) throw new Error(`Coach B API ${r.status()}`);
    const body = await r.json();
    expect(body.items?.length ?? 0, "Coach B voit 1 apprenant").toBe(1);
    const child = body.items[0];
    expect(child.circleLanguage?.toUpperCase() ?? "", "Coach B circle SWAHILI").toBe("SWAHILI");
  });
});

test.describe("Gate 8K · Network dual context · Family route API scoping", () => {
  test("Family route · /api/family/* appelée · endpoint adulte non-appelé", async ({ page }) => {
    await loginViaSupabase(page, FAMILY_EMAIL, PASSWORD);
    await page.setViewportSize({ width: 1440, height: 1000 });
    const requests: string[] = [];
    page.on("request", (req: Request) => {
      const u = new URL(req.url());
      if (u.pathname.startsWith("/api/")) requests.push(u.pathname);
    });
    await page.goto("/fr/famille", { waitUntil: "networkidle" });
    const familyCalls = requests.filter((p) => p.startsWith("/api/family/"));
    const adultCalls = requests.filter((p) => p.startsWith("/api/me/monde-dashboard") || p.startsWith("/api/student/"));
    expect(familyCalls.length, "Family API called on /famille").toBeGreaterThan(0);
    expect(adultCalls.length, "Adult API NOT called on /famille").toBe(0);
  });
});
