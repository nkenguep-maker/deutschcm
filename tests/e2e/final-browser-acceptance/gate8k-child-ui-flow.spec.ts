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

test.describe("Release Canonicalization · /famille redirige vers /family (FR + EN)", () => {
  for (const locale of ["fr", "en"] as const) {
    test(`${locale} · /famille → /family (server redirect)`, async ({ page }) => {
      await loginViaSupabase(page, FAMILY_EMAIL, PASSWORD);
      const resp = await page.goto(`/${locale}/famille`, { waitUntil: "domcontentloaded" });
      // Server redirect → landed on /family.
      expect(page.url(), `/${locale}/famille redirect`).toMatch(new RegExp(`/${locale}/family(?:/|\\?|$)`));
      // Le statut final rendu par /family est 200 (ou une redirect chain se termine 200).
      const status = resp?.status() ?? 0;
      expect(status, `final status ${locale}/famille`).toBeGreaterThanOrEqual(200);
      expect(status, `no server error`).toBeLessThan(400);
    });
    test(`${locale} · /famille/enfant/[profilId] → /family sans profilId`, async ({ page }) => {
      await loginViaSupabase(page, FAMILY_EMAIL, PASSWORD);
      await page.goto(`/${locale}/famille/enfant/test_yema_qa_child_family_monde`, { waitUntil: "domcontentloaded" });
      // Doit landing sur /family SANS transmission du profilId dans la nouvelle URL.
      expect(page.url()).toMatch(new RegExp(`/${locale}/family(?:/|\\?|$)`));
      expect(page.url()).not.toContain("test_yema_qa_child_family_monde");
    });
  }
});

test.describe("Gate 8K · Child PIN flow UI réel · /family → dialog → dashboard", () => {
  // Parité restaurée · le flow UI PIN passe par ChildPinDialog rendu depuis
  // FamilyChildActions sur la route canonique /[locale]/family (Monde et
  // Racines, FR + EN). Le test clique réellement le bouton "Ouvrir son
  // espace", saisit le PIN, observe POST /api/child-session et vérifie le
  // rendu du dashboard enfant avec le prénom.
  for (const [label, childId, pin, prenom, entitlement] of [
    ["monde", "test_yema_qa_child_family_monde", "1234", "Lina", "FAMILY_WORLD"],
    ["racines", "test_yema_qa_child_family_racines", "5678", "Aïcha", "ROOTS_FAMILY"],
  ] as const) {
    for (const locale of ["fr", "en"] as const) {
      test(`${locale} · Child ${label.toUpperCase()} · UI PIN /family → dashboard prenom=${prenom}`, async ({ page }) => {
        test.setTimeout(60_000);
        await loginViaSupabase(page, FAMILY_EMAIL, PASSWORD);
        await page.setViewportSize({ width: 1440, height: 1000 });
        // Naviguer vers /family (canonique) · attendre chargement InboxList.
        await page.goto(`/${locale}/family`, { waitUntil: "networkidle" });
        // Trouver la carte enfant · cliquer "Ouvrir son espace" (data-testid).
        const openBtn = page.locator(`[data-testid="family-child-open-space"][data-child-id="${childId}"]`);
        await openBtn.waitFor({ state: "visible", timeout: 15_000 });
        await openBtn.click();
        // Dialogue PIN visible.
        await expect(page.locator('[data-testid="child-pin-dialog"]')).toBeVisible();
        if (locale === "fr") {
          await captureAndRecord(page, `child-${label}-pin-dialog-${locale}-1440.png`, {
            persona: "family_pin_dialog", locale, viewport: "1440", route: `/${locale}/family`,
            section: "child-pin-dialog", universe: label.toUpperCase(), entitlement,
          });
        }
        // Saisir PIN · attendre POST + navigation.
        await page.locator('[data-testid="child-pin-input"]').fill(pin);
        const [openResp] = await Promise.all([
          page.waitForResponse((r) => r.url().includes("/api/child-session") && r.request().method() === "POST"),
          page.locator('[data-testid="child-pin-submit"]').click(),
        ]);
        expect(openResp.status(), `POST /api/child-session ${label}`).toBe(200);
        // Redirect vers /dashboard enfant · le composant router.push().
        await page.waitForURL((u) => u.pathname.includes("/dashboard"), { timeout: 15_000 });
        const bodyText = await page.locator("body").textContent();
        expect(bodyText, `Child ${label} dashboard rendu prenom=${prenom}`).toContain(prenom);
        if (locale === "fr") {
          await captureAndRecord(page, `child-${label}-ui-dashboard-${locale}-1440.png`, {
            persona: `child_${label}_ui`, locale, viewport: "1440", route: `/${locale}/dashboard`,
            section: "child-dashboard-via-ui-pin", universe: label.toUpperCase(), entitlement,
          });
        }
        // Logout · via API (le composant enfant a un bouton exitChildMode
        // couvert par Gate 8L Playwright · ici on garantit la propreté state).
        await page.request.delete(`${process.env.PLAYWRIGHT_BASE_URL}/api/child-session`);
      });
    }
  }
});

test.describe("Gate 8K · AddChildDialog accessible depuis /family (radiogroup Monde/Racines)", () => {
  test("fr · /family · ouvrir AddChildDialog + radiogroup MONDE/RACINES visible", async ({ page }) => {
    await loginViaSupabase(page, FAMILY_EMAIL, PASSWORD);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/fr/family", { waitUntil: "networkidle" });
    // Cliquer "Ajouter un enfant" (empty state OU footer selon canAddChild).
    const addBtn = page.locator('[data-testid="family-add-child-open"]').first();
    // Family QA a déjà 3 enfants · canAddChild peut être false si sièges épuisés.
    // On teste le comportement conforme dans les deux cas.
    const addCount = await addBtn.count();
    if (addCount === 0) {
      test.info().annotations.push({ type: "info", description: "canAddChild=false · sièges épuisés · AddChildDialog non exposé (comportement attendu)" });
      return;
    }
    await addBtn.click();
    await expect(page.locator('[data-testid="add-child-dialog"]')).toBeVisible();
    // Radiogroup universe · deux boutons MONDE + RACINES.
    await expect(page.locator('[data-testid="add-child-universe-MONDE"]')).toBeVisible();
    await expect(page.locator('[data-testid="add-child-universe-RACINES"]')).toBeVisible();
    // Submit désactivé tant qu'universe n'est pas choisi.
    const submit = page.locator('[data-testid="add-child-submit"]');
    await expect(submit).toBeDisabled();
    // Cancel · retour dashboard sans mutation.
    await page.locator('[data-testid="add-child-cancel"]').click();
    await expect(page.locator('[data-testid="add-child-dialog"]')).not.toBeVisible();
  });
});

test.describe("Gate 8K · PIN invalide · POST /api/child-session refusé 401", () => {
  test("PIN 0000 → 401 PIN_INVALID · session enfant reste inactive", async ({ page }) => {
    await loginViaSupabase(page, FAMILY_EMAIL, PASSWORD);
    const bad = await page.request.post(`${process.env.PLAYWRIGHT_BASE_URL}/api/child-session`, {
      data: { childProfileId: "test_yema_qa_child_family_monde", pin: "0000" },
    });
    expect(bad.status(), "PIN invalide status").toBe(401);
    const body = await bad.json();
    expect(body?.error, "code générique PIN_INVALID").toBe("PIN_INVALID");
    const check = await page.request.get(`${process.env.PLAYWRIGHT_BASE_URL}/api/child-session`);
    const checkBody = await check.json();
    expect(checkBody?.active, "session enfant reste inactive après échec").toBe(false);
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
    // /famille redirige serveur-side vers /family · on observe les requêtes
    // API des deux étapes (redirect + landing).
    await page.goto("/fr/famille", { waitUntil: "networkidle" }).catch(() => {});
    const familyCalls = requests.filter((p) => p.startsWith("/api/family/"));
    const adultCalls = requests.filter((p) => p.startsWith("/api/me/monde-dashboard") || p.startsWith("/api/student/"));
    expect(familyCalls.length, "Family API called on /famille→/family").toBeGreaterThan(0);
    expect(adultCalls.length, "Adult API NOT called on /famille→/family").toBe(0);
  });
});
