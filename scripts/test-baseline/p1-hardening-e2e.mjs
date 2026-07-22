// P1 hardening E2E · FR + EN + Racines + resume + role exclusion + ownership.
// Utilise EXCLUSIVEMENT le projet P-1 kzzagbojjkivdzzcrmxn (fixtures).

import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const BASE = "http://localhost:3000";
const PW = process.env.P1_TEST_PASSWORD;
if (!PW) { console.error("P1_TEST_PASSWORD required"); process.exit(1); }

const EMAILS = {
  monde:   "paul+yema_test_monde@example.com",
  racines: "paul+yema_test_racines_solo@example.com",
  teacher: "paul+yema_test_teacher@example.com",
  center:  "paul+yema_test_center@example.com",
  admin:   "paul+yema_test_admin@example.com",
};

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
const db = new PrismaClient({ adapter, log: ["error"] });
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const results = [];
function record(label, data) {
  results.push({ label, ...data });
  process.stderr.write(`  ${label}: ${JSON.stringify(data)}\n`);
}

async function login(page, email, localePrefix = "fr") {
  await page.goto(`${BASE}/${localePrefix}/login`, { waitUntil: "networkidle", timeout: 30000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', PW);
  await Promise.all([
    page.waitForResponse(r => /supabase\.co\/auth\/v1\/token/.test(r.url()), { timeout: 20000 }).catch(() => null),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForTimeout(2500);
  await page.waitForURL(u => !u.pathname.includes("/login"), { timeout: 15000 }).catch(() => {});
}

async function measure(page, vw) {
  return await page.evaluate((vw) => {
    const scrollW = document.documentElement.scrollWidth;
    const clientW = document.documentElement.clientWidth;
    let ovf = 0;
    for (const el of Array.from(document.querySelectorAll("body *"))) {
      const r = el.getBoundingClientRect();
      if (r.right > vw + 1 && r.width < vw * 2 && r.width > 0) ovf++;
    }
    return { scrollW, clientW, pageOverflow: scrollW - clientW, overflowCount: ovf };
  }, vw);
}

async function resetLearningPaths(email) {
  // Idempotent · nettoie les LP du user pour repartir d'un état "juste post-inscription".
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
  const authUser = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!authUser) return;
  const dbUser = await db.user.findFirst({ where: { supabaseId: authUser.id }, select: { id: true } });
  if (!dbUser) return;
  await db.learningPath.deleteMany({ where: { userId: dbUser.id } });
}

async function runMondeFrFull(browser) {
  process.stderr.write("\n═══ E2E Monde FR full ═══\n");
  await resetLearningPaths(EMAILS.monde);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const cerr = [];
  page.on("console", m => { if (m.type() === "error") cerr.push(m.text().slice(0, 80)); });

  await login(page, EMAILS.monde, "fr");

  // Step 1 · onboarding router → aucun LP, montre les 2 portes
  await page.goto(`${BASE}/fr/onboarding`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  record("monde-fr onboarding-router-no-lp", { url: new URL(page.url()).pathname, m: await measure(page, 390) });

  // Step 2 · click porte Monde → formulaire Monde
  const [porteMonde] = await page.$$('a.onboarding-router-porte-monde, a[href*="/onboarding/monde"]');
  if (porteMonde) await porteMonde.click();
  await page.waitForTimeout(1000);
  record("monde-fr form", { url: new URL(page.url()).pathname });

  // Step 3 · remplir le form (why=envie, startPoint=beginner) → soumettre
  await page.click('button[data-choice="envie"], button:has-text("envie")').catch(() => {});
  await page.waitForTimeout(300);
  // Suivant
  await page.click('button:has-text("Continuer")').catch(() => {});
  await page.waitForTimeout(600);
  await page.click('button[data-choice="beginner"], button:has-text("Je débute")').catch(() => {});
  await page.waitForTimeout(300);
  await page.click('button:has-text("Terminer")').catch(() => {});
  await page.waitForTimeout(2500);

  // Step 4 · niveau screen (nouveau hardening)
  record("monde-fr after form", { url: new URL(page.url()).pathname });
  if (new URL(page.url()).pathname.includes("/niveau")) {
    // Sélectionne option 1 (A1) + Continuer
    await page.click('button[role="radio"]:nth-of-type(1)').catch(() => {});
    await page.waitForTimeout(300);
    // The label might not be Continuer — try both
    await page.click('button:has-text("Continuer"), button.entry-cta-primary').catch(() => {});
    await page.waitForTimeout(2500);
  }
  record("monde-fr after niveau", { url: new URL(page.url()).pathname });

  // Step 5 · découverte lesson 1
  const url1 = new URL(page.url()).pathname;
  record("monde-fr on lesson", { url: url1, isLesson: url1.includes("/decouverte/") });

  // Step 6 · complete 4 lessons via API
  const cookies = await ctx.cookies();
  const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
  const patch = await fetch(`${BASE}/api/funnel`, {
    method: "PATCH", headers: { "Content-Type": "application/json", cookie: cookieHeader },
    body: JSON.stringify({ patch: { discoveryProgress: [1, 2, 3, 4] } }),
  });
  record("monde-fr complete-4-via-api", { status: patch.status });

  // Step 7 · router doit envoyer sur bilan
  await page.goto(`${BASE}/fr/onboarding`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  record("monde-fr router after 4 lessons", { url: new URL(page.url()).pathname });

  // Step 8 · activation-intent
  await page.goto(`${BASE}/fr/activation-intent`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  const m = await measure(page, 390);
  const html = await page.content();
  record("monde-fr activation", {
    url: new URL(page.url()).pathname,
    m,
    hasLockedBadge: html.includes("Bientôt disponible"),
    hasPassageTitle: html.includes("Choisir un Passage") || html.includes("Choose a Passage"),
  });

  await ctx.close();
}

async function runMondeEnCheck(browser) {
  process.stderr.write("\n═══ E2E Monde EN (locale preservation) ═══\n");
  // Ne pas reset · on veut voir un user avec progress qui bascule EN
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await login(page, EMAILS.monde, "en");
  await page.goto(`${BASE}/en/decouverte/1`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  const bodyText = await page.evaluate(() => document.body?.innerText ?? "");
  const hasFrOnly = /Continuer|Bientôt disponible|Vérifier/.test(bodyText);
  const hasEn = /Continue|Coming soon|Check/i.test(bodyText);
  record("monde-en decouverte/1", {
    url: new URL(page.url()).pathname,
    hasFrOnlyStrings: hasFrOnly,
    hasEnStrings: hasEn,
  });

  await page.goto(`${BASE}/en/decouverte/bilan`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  const bilanText = await page.evaluate(() => document.body?.innerText ?? "");
  record("monde-en bilan", {
    url: new URL(page.url()).pathname,
    hasEn: /You've finished|Lessons completed|See the offers/i.test(bilanText),
  });

  await page.goto(`${BASE}/en/activation-intent`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  const actText = await page.evaluate(() => document.body?.innerText ?? "");
  record("monde-en activation-intent", {
    url: new URL(page.url()).pathname,
    hasEn: /Choose a Passage|Level|Currency/i.test(actText),
    hasFrOnly: /Choisir un Passage|Devise/.test(actText),
  });

  await ctx.close();
}

async function runRacinesFr(browser) {
  process.stderr.write("\n═══ E2E Racines FR (waitlist honnête) ═══\n");
  await resetLearningPaths(EMAILS.racines);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await login(page, EMAILS.racines, "fr");

  await page.goto(`${BASE}/fr/onboarding`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  record("racines-fr router-no-lp", { url: new URL(page.url()).pathname });

  // Click porte Racines
  const [porteRacines] = await page.$$('a.onboarding-router-porte-sources, a[href*="/onboarding/racines"]');
  if (porteRacines) await porteRacines.click();
  await page.waitForTimeout(1000);

  // Fill form (link=any, startPoint=beginner)
  await page.$$eval('button', (btns) => {
    // pick the first radio-like button in first step
    const first = btns.find((b) => b.getAttribute("role") === "radio" || b.className.includes("choice"));
    if (first) first.click();
  }).catch(() => {});
  await page.waitForTimeout(300);
  await page.click('button:has-text("Continuer")').catch(() => {});
  await page.waitForTimeout(600);
  await page.$$eval('button', (btns) => {
    const first = btns.find((b) => b.getAttribute("role") === "radio" || b.className.includes("choice"));
    if (first) first.click();
  }).catch(() => {});
  await page.waitForTimeout(300);
  await page.click('button:has-text("Terminer")').catch(() => {});
  await page.waitForTimeout(2500);

  record("racines-fr after form", { url: new URL(page.url()).pathname });

  // Should hit niveau screen
  if (new URL(page.url()).pathname.includes("/niveau")) {
    // Verify no CECR in DOM
    const text = await page.evaluate(() => document.body?.innerText ?? "");
    record("racines-fr niveau · no A1/A2/B1/B2/C1", {
      hasCEFR: /\bA1\b|\bA2\b|\bB1\b|\bB2\b|\bC1\b/.test(text),
      hasE: /É1|É2|É3|É4|É5|E1|E2|E3|E4|E5/.test(text),
    });
    // Pick option 1 + Continue
    await page.click('button[role="radio"]:nth-of-type(1)').catch(() => {});
    await page.waitForTimeout(300);
    await page.click('button:has-text("Continuer"), button.entry-cta-primary').catch(() => {});
    await page.waitForTimeout(2500);
  }

  // After niveau · router should send to /decouverte/attente (Racines langs not active)
  const urlAfter = new URL(page.url()).pathname;
  record("racines-fr after niveau", {
    url: urlAfter,
    isWaitlist: urlAfter.includes("/attente") || urlAfter.includes("/dashboard"),
  });

  // Manual visit /activation-intent for Racines · should show empty state
  await page.goto(`${BASE}/fr/activation-intent`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  const actText = await page.evaluate(() => document.body?.innerText ?? "");
  record("racines-fr activation-intent · locked", {
    url: new URL(page.url()).pathname,
    hasWaitlistMsg: /arrivent bientôt|coming soon|en préparation/i.test(actText),
    hasSelectableOffer: /Solo|Famille/.test(actText) && !/bientôt|coming soon/i.test(actText.slice(0, 200)),
  });

  await ctx.close();
}

async function runResume(browser) {
  process.stderr.write("\n═══ E2E Resume (fresh browser after logout) ═══\n");
  // Setup: Monde user with progress [1, 2] via API
  await resetLearningPaths(EMAILS.monde);
  // Login once, do the funnel to create LP + niveau
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await login(page, EMAILS.monde, "fr");
    // Direct API PATCH to simulate all needed state
    // But first we need an LP → create via /api/learning-paths
    const cookies = await ctx.cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
    const lpRes = await fetch(`${BASE}/api/learning-paths`, {
      method: "POST", headers: { "Content-Type": "application/json", cookie: cookieHeader },
      body: JSON.stringify({ universe: "MONDE", language: "DEUTSCH", onboardingAnswers: { why: "envie", startPoint: "beginner" } }),
    });
    const funnelRes = await fetch(`${BASE}/api/funnel`, {
      method: "PATCH", headers: { "Content-Type": "application/json", cookie: cookieHeader },
      body: JSON.stringify({ patch: {
        selfAssessmentAnswer: 1, declaredLevel: "A1", recommendedLevel: "A1",
        discoveryProgress: [1, 2],
      } }),
    });
    record("resume setup", { lpStatus: lpRes.status, funnelStatus: funnelRes.status });
    await ctx.close();
  }

  // Now fresh browser context (no cookies) → new login → visit /onboarding
  const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page2 = await ctx2.newPage();
  await login(page2, EMAILS.monde, "fr");
  await page2.goto(`${BASE}/fr/onboarding`, { waitUntil: "domcontentloaded" });
  await page2.waitForTimeout(1000);
  const resumeUrl = new URL(page2.url()).pathname;
  record("resume after logout+login", {
    url: resumeUrl,
    isLesson3: resumeUrl.includes("/decouverte/3"),
  });
  await ctx2.close();
}

async function runRoleExclusion(browser) {
  process.stderr.write("\n═══ E2E Role exclusion (teacher, center, admin) ═══\n");
  for (const [role, email] of [["teacher", EMAILS.teacher], ["center", EMAILS.center], ["admin", EMAILS.admin]]) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await login(page, email, "fr");
    for (const route of ["/fr/onboarding", "/fr/decouverte/1", "/fr/activation-intent"]) {
      const resp = await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 15000 });
      await page.waitForTimeout(800);
      const finalPath = new URL(page.url()).pathname;
      record(`role-${role} ${route}`, {
        http: resp?.status() ?? 0,
        redirectedTo: finalPath,
        blockedFromFunnel: !finalPath.startsWith(route),
      });
    }
    // API check
    const cookies = await ctx.cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
    const apiGet = await fetch(`${BASE}/api/funnel`, { headers: { cookie: cookieHeader } });
    record(`role-${role} api-funnel-GET`, { status: apiGet.status });
    const apiPatch = await fetch(`${BASE}/api/funnel`, {
      method: "PATCH", headers: { "Content-Type": "application/json", cookie: cookieHeader },
      body: JSON.stringify({ patch: { discoveryProgress: [1] } }),
    });
    record(`role-${role} api-funnel-PATCH`, { status: apiPatch.status });
    await ctx.close();
  }
}

async function runOwnershipAndAnonymous(browser) {
  process.stderr.write("\n═══ E2E Ownership + anonymous ═══\n");
  // Anonymous
  const anonRes = await fetch(`${BASE}/api/funnel`);
  record("anon api-funnel GET", { status: anonRes.status });
  const anonPatch = await fetch(`${BASE}/api/funnel`, {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ patch: { discoveryProgress: [1] } }),
  });
  record("anon api-funnel PATCH", { status: anonPatch.status });

  // Ownership · User A tries to set data via client-supplied fields
  // The API loads LP via server session · client cannot target another user's LP.
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await login(page, EMAILS.monde, "fr");
  const cookies = await ctx.cookies();
  const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
  // Try to pass forged userId, learningPathId, dbUserId in body
  const forgeAttempt = await fetch(`${BASE}/api/funnel`, {
    method: "PATCH", headers: { "Content-Type": "application/json", cookie: cookieHeader },
    body: JSON.stringify({
      patch: { discoveryProgress: [4] },
      userId: "attacker",
      learningPathId: "attacker-lp",
      supabaseId: "attacker-supabase",
    }),
  });
  record("ownership forge-fields ignored", { status: forgeAttempt.status });

  // Verify only the authenticated user's LP was affected
  const state = await fetch(`${BASE}/api/funnel`, { headers: { cookie: cookieHeader } });
  const stateJson = await state.json();
  record("ownership after PATCH", {
    step: stateJson.step,
    learningPathBelongsToAuth: Boolean(stateJson.learningPath),
  });

  await ctx.close();
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    await runMondeFrFull(browser);
    await runMondeEnCheck(browser);
    await runRacinesFr(browser);
    await runResume(browser);
    await runRoleExclusion(browser);
    await runOwnershipAndAnonymous(browser);
  } finally {
    await browser.close();
    await db.$disconnect();
  }
  const { writeFile, mkdir } = await import("node:fs/promises");
  await mkdir("/tmp/p1h-captures", { recursive: true });
  await writeFile("/tmp/p1h-captures/e2e-results.json", JSON.stringify(results, null, 2));
  process.stderr.write(`\n${results.length} events recorded to /tmp/p1h-captures/e2e-results.json\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
