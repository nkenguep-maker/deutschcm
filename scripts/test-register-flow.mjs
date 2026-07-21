// scripts/test-register-flow.mjs
// Test e2e du flux register → onboarding → dashboard via Playwright (vrai
// browser · cookies Supabase gérés nativement). Le dev server doit tourner
// sur :3110.
//
//   npm run dev  # autre terminal
//   node scripts/test-register-flow.mjs

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

const SUPA_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_URL || !SERVICE) { console.error("Missing env vars"); process.exit(1); }

const admin = createClient(SUPA_URL, SERVICE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const results = [];
function step(name, ok, detail = "") {
  results.push({ name, ok, detail });
  const icon = ok ? "✅" : "❌";
  console.log(`${icon} ${name}${detail ? "  " + detail : ""}`);
}

async function resetUser(email) {
  await fetch(`${BASE}/api/dev/reset-user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

async function createConfirmedUser(email, password, universe) {
  const { data, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { role: "STUDENT", universe, full_name: "Test E2E" },
  });
  if (error) throw error;
  return data.user;
}

async function scenario(label, { universe, expectedOnboardingPath, locale = "fr" }) {
  const email = `e2e-${universe}-${locale}-${Date.now()}@yema.test`;
  const password = "TestPass1234!";
  console.log(`\n── Scénario : ${label} ──`);

  await resetUser(email);
  await createConfirmedUser(email, password, universe);
  step(`  user créé (universe=${universe})`, true);

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();

  // 1. Login via l'UI
  await page.goto(`${BASE}/${locale}/login`, { waitUntil: "networkidle" });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').first().click();
  // Attend une navigation OU un délai — le login fait router.push
  await page.waitForURL((url) => !url.pathname.endsWith("/login"), { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const afterLoginUrl = page.url();
  step(`  après login → ${afterLoginUrl.replace(BASE, "")}`, !afterLoginUrl.includes("/login"));

  // 2. Naviguer vers /dashboard → doit finir sur l'onboarding correct
  await page.goto(`${BASE}/${locale}/dashboard`, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForTimeout(2000);
  const beforeOnboardingUrl = page.url();
  step(
    `  /dashboard non-onboardé bounce vers ${expectedOnboardingPath}`,
    beforeOnboardingUrl.includes(expectedOnboardingPath),
    `réel: ${beforeOnboardingUrl.replace(BASE, "")}`,
  );
  step(`  aucun /${locale}/${locale} dans l'URL`, !/\/(fr|en)\/(fr|en)\//.test(beforeOnboardingUrl));

  // 3. Fin d'onboarding via appels API (le composant client fait ces
  //    appels via handleFinish — on les rejoue directement pour raccourcir).
  const cookies = await ctx.cookies();
  const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
  const lpRes = await fetch(`${BASE}/api/learning-paths`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieHeader },
    body: JSON.stringify({
      universe: universe.toUpperCase(),
      language: universe === "monde" ? "DEUTSCH" : "WOLOF",
      intention: universe === "monde" ? "VISA_DEPART" : "RACINES_SOI",
      onboardingAnswers: { via: "e2e" },
    }),
  });
  step(`  POST /api/learning-paths`, lpRes.status === 200, `status=${lpRes.status}`);

  const ocRes = await fetch(`${BASE}/api/onboarding/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieHeader },
    body: JSON.stringify({
      role: "STUDENT",
      activeLanguage: universe === "monde" ? "deutsch" : "wolof",
    }),
  });
  step(`  POST /api/onboarding/complete`, ocRes.status === 200, `status=${ocRes.status}`);

  // 4. Après onboarding, /dashboard doit passer (200 pas de redirect vers onboarding)
  await page.goto(`${BASE}/${locale}/dashboard`, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForTimeout(2000);
  const afterOnboardingUrl = page.url();
  step(
    `  après onboarding, /dashboard s'affiche (pas de rebond)`,
    afterOnboardingUrl.endsWith("/dashboard") || afterOnboardingUrl.endsWith(`/${locale}/dashboard`),
    `réel: ${afterOnboardingUrl.replace(BASE, "")}`,
  );

  // 5. Déconnexion + reconnexion → dashboard direct (pas d'onboarding réopéré)
  await ctx.clearCookies();
  await page.goto(`${BASE}/${locale}/login`, { waitUntil: "networkidle" });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((url) => !url.pathname.endsWith("/login"), { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const reconnectedUrl = page.url();
  step(
    `  reconnexion → /dashboard direct (pas d'onboarding)`,
    reconnectedUrl.endsWith("/dashboard") || reconnectedUrl.endsWith(`/${locale}/dashboard`),
    `réel: ${reconnectedUrl.replace(BASE, "")}`,
  );

  await browser.close();
  await resetUser(email);
}

async function main() {
  await scenario("Monde · FR", { universe: "monde", expectedOnboardingPath: "/onboarding/monde", locale: "fr" });
  await scenario("Racines · FR", { universe: "racines", expectedOnboardingPath: "/onboarding/racines", locale: "fr" });
  await scenario("Monde · EN", { universe: "monde", expectedOnboardingPath: "/onboarding/monde", locale: "en" });

  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;
  console.log(`\n=== ${passed}/${results.length} passed${failed ? " · " + failed + " FAILED" : ""} ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("\n❌ Fatal:", e);
  process.exit(1);
});
