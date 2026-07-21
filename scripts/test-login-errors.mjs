// scripts/test-login-errors.mjs
// Test e2e Playwright · 4 scénarios d'erreur sur /login (+ 1 sur /register).
// Vérifie pour chacun :
//   · un message inline s'affiche
//   · le bouton sort de l'état "loading"
//   · le message correspond au bon variant
//
//   npm run dev   # autre terminal, port 3110
//   node scripts/test-login-errors.mjs

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

async function submitLogin(page, email, password) {
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').first().click();
}

async function waitForErrorOrNav(page, timeoutMs = 20_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const err = await page.locator(".ens-form-error").count();
    if (err > 0) return "error";
    if (!page.url().includes("/login")) return "navigated";
    await page.waitForTimeout(200);
  }
  return "timeout";
}

async function readError(page) {
  return (await page.locator(".ens-form-error p").first().textContent())?.trim() ?? "";
}

async function isButtonUnlocked(page) {
  const btn = page.locator('button[type="submit"]').first();
  const disabled = await btn.isDisabled();
  const label = ((await btn.textContent()) ?? "").trim();
  // Bouton débloqué = pas disabled ET label = "Ouvrir ma maison" (pas "Ouverture…")
  return !disabled && !label.includes("Ouverture") && !label.includes("Opening");
}

async function scenario(browser, label, fn) {
  console.log(`\n── ${label} ──`);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  try {
    await fn(page, ctx);
  } finally {
    await ctx.close();
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  // ── 1. Mauvais mot de passe ───────────────────────────────
  await scenario(browser, "Scénario 1 · mauvais mot de passe", async (page) => {
    const email = `err1-${Date.now()}@yema.test`;
    const password = "TestPass1234!";
    await resetUser(email);
    await admin.auth.admin.createUser({ email, password, email_confirm: true });

    await page.goto(`${BASE}/fr/login`, { waitUntil: "networkidle" });
    await submitLogin(page, email, "WrongPassword999!");
    const outcome = await waitForErrorOrNav(page);
    step("  erreur affichée", outcome === "error");
    const msg = await readError(page);
    step(`  message = 'E-mail ou mot de passe incorrect.'`, /incorrect|wrong/i.test(msg), msg);
    step("  bouton débloqué", await isButtonUnlocked(page));

    await resetUser(email);
  });

  // ── 2. E-mail inexistant ──────────────────────────────────
  await scenario(browser, "Scénario 2 · e-mail inexistant", async (page) => {
    await page.goto(`${BASE}/fr/login`, { waitUntil: "networkidle" });
    await submitLogin(page, `ghost-${Date.now()}@nowhere.test`, "AnyPassword123!");
    const outcome = await waitForErrorOrNav(page);
    step("  erreur affichée", outcome === "error");
    const msg = await readError(page);
    // Doctrine sécurité : Supabase ne distingue pas email inexistant vs bad password
    step("  message = même que bad password (pas de leak)", /incorrect|wrong/i.test(msg), msg);
    step("  bouton débloqué", await isButtonUnlocked(page));
  });

  // ── 3. E-mail non confirmé ────────────────────────────────
  await scenario(browser, "Scénario 3 · e-mail non confirmé", async (page) => {
    const email = `err3-${Date.now()}@yema.test`;
    const password = "TestPass1234!";
    await resetUser(email);
    // email_confirm: false → compte créé mais non confirmé
    await admin.auth.admin.createUser({ email, password, email_confirm: false });

    await page.goto(`${BASE}/fr/login`, { waitUntil: "networkidle" });
    await submitLogin(page, email, password);
    const outcome = await waitForErrorOrNav(page);
    step("  erreur affichée", outcome === "error");
    const msg = await readError(page);
    step("  message = variant 'non confirmé'", /confirmé|confirmed/i.test(msg), msg);
    step("  lien 'renvoyer' présent", (await page.locator(".ens-form-error-link").count()) > 0);
    step("  bouton débloqué", await isButtonUnlocked(page));

    await resetUser(email);
  });

  // ── 4. Réseau tombé ──────────────────────────────────────
  await scenario(browser, "Scénario 4 · réseau tombé (intercept)", async (page) => {
    // Intercept l'appel Supabase auth pour simuler un failed fetch
    await page.route("**/auth/v1/token**", (route) => route.abort("failed"));

    await page.goto(`${BASE}/fr/login`, { waitUntil: "networkidle" });
    await submitLogin(page, "someone@yema.test", "AnyPassword123!");
    const outcome = await waitForErrorOrNav(page);
    step("  erreur affichée", outcome === "error");
    const msg = await readError(page);
    step("  message = 'Connexion impossible, vérifiez votre réseau.'",
      /réseau|network|connexion|connect/i.test(msg), msg);
    step("  bouton débloqué (le finally garantit)", await isButtonUnlocked(page));
  });

  // ── 5. Register · mauvais e-mail format ──────────────────
  await scenario(browser, "Scénario 5 · register avec email mal formé", async (page) => {
    await page.goto(`${BASE}/fr/register?universe=monde`, { waitUntil: "networkidle" });
    await page.locator('input[type="text"]').first().fill("Test User"); // fullName
    await page.locator('input[type="text"], input[type="email"]').nth(1).fill("pas-un-email");
    await page.locator('input[type="password"]').fill("TestPass1234!");
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(3000);
    const err = await page.locator(".ens-form-error, [role='alert']").first().textContent();
    step("  message d'erreur affiché", !!err && err.trim().length > 0, (err ?? "").trim());
    const submit = page.locator('button[type="submit"]').first();
    step("  bouton register débloqué", !(await submit.isDisabled()));
  });

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
