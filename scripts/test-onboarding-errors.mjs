// scripts/test-onboarding-errors.mjs
// Test e2e Playwright · scénarios d'erreur sur /onboarding/{monde,racines}.
// Vérifie :
//   1. Session absente au chargement → redirect immédiat vers /login (SSR)
//   2. API en échec pendant handleFinish → message inline visible, bouton
//      débloqué, réponses préservées (localStorage draft)
//   3. 401 pendant handleFinish → message "session expirée" + lien reconnexion
//
//   npm run dev  # autre terminal, port 3110
//   node scripts/test-onboarding-errors.mjs

import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const BASE = "http://localhost:3110";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    }),
);
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const results = [];
function step(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "✅" : "❌"} ${name}${detail ? "  " + detail : ""}`);
}

async function resetUser(email) {
  await fetch(`${BASE}/api/dev/reset-user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  }).catch(() => {});
}

async function loginViaUI(page, email, password) {
  await page.goto(`${BASE}/fr/login`, { waitUntil: "networkidle" });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((u) => !u.pathname.endsWith("/login"), { timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(1500);
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  // ── Scénario 1 · session absente au chargement /onboarding/monde ──
  console.log("\n── Scénario 1 · session absente → SSR redirect /login ──");
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    // Aucune session cookie. Direct hit /fr/onboarding/monde
    await page.goto(`${BASE}/fr/onboarding/monde`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    const url = page.url();
    step("  redirigé vers /login", url.includes("/login"), url.replace(BASE, ""));
    step("  next param préservé", url.includes("onboarding") || url.includes("next="),
      url.replace(BASE, ""));
    await ctx.close();
  }

  // ── Scénario 2 · API 500 pendant handleFinish → message + bouton libre ──
  console.log("\n── Scénario 2 · /api/learning-paths 500 → erreur inline ──");
  {
    const email = `onb-500-${Date.now()}@yema.test`;
    const password = "TestPass1234!";
    await resetUser(email);
    await admin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { role: "STUDENT", universe: "monde", full_name: "Test 500" },
    });

    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await loginViaUI(page, email, password);

    // Intercepte /api/learning-paths avec un 500
    await page.route("**/api/learning-paths**", (route) =>
      route.fulfill({ status: 500, contentType: "application/json", body: '{"error":"boom"}' })
    );

    await page.goto(`${BASE}/fr/onboarding/monde`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    // Step 1 : pick "study"
    await page.locator('.entry-choice').first().click();
    await page.locator('.entry-cta-primary').click(); // Continuer
    await page.waitForTimeout(500);
    // Step 2 : pick "beginner"
    await page.locator('.entry-choice').first().click();
    await page.locator('.entry-cta-primary').click(); // Terminer
    await page.waitForTimeout(3000);

    const errCount = await page.locator('.entry-err').count();
    step("  message d'erreur affiché", errCount > 0);
    const msg = (await page.locator('.entry-err p').first().textContent()) ?? "";
    step("  message = 'finish_error'",
      /enregistrer|save|parcours|path/i.test(msg), msg.trim());
    const btnText = ((await page.locator('.entry-cta-primary').last().textContent()) ?? "").trim();
    const btnDisabled = await page.locator('.entry-cta-primary').last().isDisabled();
    step("  bouton débloqué", !btnDisabled && !btnText.includes("enregistre") && !btnText.includes("Saving"),
      `disabled=${btnDisabled} label='${btnText}'`);
    // Vérif : les choix sont TOUJOURS sélectionnés (state préservé)
    const step2Choices = await page.locator('.entry-choice.on').count();
    step("  réponses préservées (choix conservé)", step2Choices > 0, `on=${step2Choices}`);

    await ctx.close();
    await resetUser(email);
  }

  // ── Scénario 3 · 401 pendant handleFinish → session_expired + lien reco ──
  console.log("\n── Scénario 3 · 401 → session_expired + lien reconnexion ──");
  {
    const email = `onb-401-${Date.now()}@yema.test`;
    const password = "TestPass1234!";
    await resetUser(email);
    await admin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { role: "STUDENT", universe: "monde", full_name: "Test 401" },
    });

    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await loginViaUI(page, email, password);

    // Force un 401 sur les 2 APIs finales
    await page.route("**/api/learning-paths**", (route) =>
      route.fulfill({ status: 401, contentType: "application/json", body: '{"error":"unauthorized"}' })
    );

    await page.goto(`${BASE}/fr/onboarding/monde`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await page.locator('.entry-choice').first().click();
    await page.locator('.entry-cta-primary').click();
    await page.waitForTimeout(500);
    await page.locator('.entry-choice').first().click();
    await page.locator('.entry-cta-primary').click();
    await page.waitForTimeout(3000);

    const msg = ((await page.locator('.entry-err p').first().textContent()) ?? "").trim();
    step("  message = 'session expirée'",
      /session|expir/i.test(msg), msg);
    step("  lien 'Se reconnecter' présent",
      (await page.locator('.entry-err-link').count()) > 0);
    const linkHref = await page.locator('.entry-err-link').getAttribute('href');
    const decoded = decodeURIComponent(linkHref ?? "");
    step("  lien préserve next=/onboarding/monde",
      decoded.includes("next=") && decoded.includes("onboarding/monde"),
      linkHref ?? "");
    const btnDisabled = await page.locator('.entry-cta-primary').last().isDisabled();
    step("  bouton débloqué après 401", !btnDisabled);

    // Vérifie le draft en localStorage
    const draft = await page.evaluate(() =>
      window.localStorage.getItem("yema.onboarding.monde.draft")
    );
    step("  draft sauvé en localStorage",
      !!draft && draft.includes('"startPoint"'), (draft ?? "").slice(0, 80));

    await ctx.close();
    await resetUser(email);
  }

  // ── Scénario 5 · état partiel (users row orpheline même email) → auto-répare ──
  console.log("\n── Scénario 5 · users Prisma orpheline → auto-répare ──");
  {
    const email = `orphan-${Date.now()}@yema.test`;
    const password = "TestPass1234!";
    await resetUser(email);

    // Injecte une ligne orpheline AVANT de créer le nouveau compte Supabase
    await fetch(`${BASE}/api/dev/inject-orphan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    await admin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { role: "STUDENT", universe: "monde", full_name: "Post-repair" },
    });

    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    const responses = [];
    page.on("response", async (res) => {
      const url = res.url();
      if (url.includes("/api/learning-paths") || url.includes("/api/onboarding/complete")) {
        responses.push({ status: res.status(), body: await res.text().catch(() => "") });
      }
    });

    await loginViaUI(page, email, password);
    await page.goto(`${BASE}/fr/onboarding/monde`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await page.locator('.entry-choice').first().click();
    await page.locator('.entry-cta-primary').click();
    await page.waitForTimeout(500);
    await page.locator('.entry-choice').first().click();
    await page.locator('.entry-cta-primary').click();
    await page.waitForTimeout(4000);

    const lp = responses.find(r => r.body.includes("universe"));
    const oc = responses.find(r => r.body.includes("success"));
    step("  /api/learning-paths = 200 (auto-répare)", lp?.status === 200, `status=${lp?.status ?? "?"}`);
    step("  /api/onboarding/complete = 200", oc?.status === 200, `status=${oc?.status ?? "?"}`);
    step("  URL finale = /dashboard (pas /onboarding)",
      page.url().endsWith("/dashboard") || page.url().endsWith("/fr/dashboard"),
      page.url().replace(BASE, ""));

    await ctx.close();
    await resetUser(email);
  }

  // ── Scénario 4 · racines · session absente ──
  console.log("\n── Scénario 4 · session absente sur /onboarding/racines ──");
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/fr/onboarding/racines`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    const url = page.url();
    step("  racines · redirigé vers /login", url.includes("/login"), url.replace(BASE, ""));
    await ctx.close();
  }

  await browser.close();

  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;
  console.log(`\n=== ${passed}/${results.length} passed${failed ? " · " + failed + " FAILED" : ""} ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("\n❌ Fatal:", e);
  process.exit(1);
});
