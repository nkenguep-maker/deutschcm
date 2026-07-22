// P2 acceptance verification · matrice 4×N routes × 5 fixtures + clavier + zoom + EN full.
// Utilise EXCLUSIVEMENT le projet Supabase P-1 kzzagbojjkivdzzcrmxn.

import { chromium } from "playwright";
import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const BASE = "http://localhost:3000";
const PW = process.env.P1_TEST_PASSWORD;
if (!PW) { console.error("P1_TEST_PASSWORD required"); process.exit(1); }

const EMAIL_MONDE = "paul+yema_test_monde@example.com";
const REAL_COURSE_ID = "a1-beta-1";
const REAL_MODULE_ID = "a1-beta-1-quiz";           // module quiz avec exercice

const VIEWPORTS = [
  { name: "360",  w: 360,  h: 800  },
  { name: "390",  w: 390,  h: 844  },
  { name: "768",  w: 768,  h: 1024 },
  { name: "1440", w: 1440, h: 900  },
];

const ROUTES = [
  "/fr/dashboard",
  "/fr/courses",
  `/fr/courses/${REAL_COURSE_ID}/modules/${REAL_MODULE_ID}`,
  "/fr/progress",
  "/fr/classroom",
  "/fr/notifications",
];

const results = { matrix: [], keyboard: [], zoom: [], en: [], resume: {}, db: {}, feedback: {} };

function setFixture(mode) { execSync(`node scripts/test-baseline/p2-access-fixtures.mjs ${mode}`, { stdio: "pipe" }); }

async function login(page, email, prefix = "fr") {
  await page.goto(`${BASE}/${prefix}/login`, { waitUntil: "networkidle", timeout: 30000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', PW);
  await Promise.all([
    page.waitForResponse(r => /supabase\.co\/auth\/v1\/token/.test(r.url()), { timeout: 20000 }).catch(() => null),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForTimeout(2500);
}

async function measure(page, vw) {
  return page.evaluate((vw) => {
    const scrollW = document.documentElement.scrollWidth;
    const clientW = document.documentElement.clientWidth;
    let ovf = 0, interactiveOvf = 0;
    for (const el of Array.from(document.querySelectorAll("body *"))) {
      const r = el.getBoundingClientRect();
      if (r.right > vw + 1 && r.width < vw * 2 && r.width > 0) {
        ovf++;
        const tag = el.tagName.toLowerCase();
        if (["button", "a"].includes(tag) || el.getAttribute("role") === "button") interactiveOvf++;
      }
    }
    return { scrollW, clientW, pageOverflow: scrollW - clientW, ovf, interactiveOvf };
  }, vw);
}

// ══ Matrix ═══════════════════════════════════════════════════════
async function scanMatrix(browser) {
  const modes = ["NEW", "ACTIVE", "COMPLETED", "EXPIRED", "NONE"];
  for (const mode of modes) {
    setFixture(mode.toLowerCase());
    process.stderr.write(`\n═══ MATRIX · ${mode} ═══\n`);
    for (const vp of VIEWPORTS) {
      const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
      const page = await ctx.newPage();
      const cerr = [], netfail = [];
      page.on("console", m => { if (m.type() === "error") cerr.push(1); });
      page.on("requestfailed", () => netfail.push(1));
      await login(page, EMAIL_MONDE, "fr");
      for (const route of ROUTES) {
        const resp = await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 20000 });
        await page.waitForTimeout(600);
        const m = await measure(page, vp.w);
        const html = await page.content();
        const text = await page.evaluate(() => document.body?.innerText ?? "");
        const isModuleRoute = route.includes("/modules/");
        results.matrix.push({
          mode, vp: vp.name, route,
          http: resp?.status() ?? 0,
          scrollW: m.scrollW, clientW: m.clientW,
          pageOverflow: m.pageOverflow,
          overflowCount: m.ovf,
          interactiveOffscreen: m.interactiveOvf,
          consoleErrors: cerr.length,
          networkFailed: netfail.length,
          hasStateLocked: html.includes("state-locked"),
          hasCourseContent: isModuleRoute && /Willkommen|Guten Tag|Meine Familie/.test(text),
          hasFakeName: /Sophie Tanda|Marie N\.|Prof\. Sophie/i.test(text),
        });
        cerr.length = 0; netfail.length = 0;
      }
      await ctx.close();
      process.stderr.write(`  vp=${vp.name} done\n`);
    }
  }
}

// ══ Keyboard trace ══════════════════════════════════════════════
async function keyboardTrace(browser) {
  setFixture("active");
  process.stderr.write("\n═══ KEYBOARD trace · TEST_MONDE_ACTIVE ═══\n");
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await login(page, EMAIL_MONDE, "fr");

  const info = async (label) => {
    const el = await page.evaluate(() => {
      const a = document.activeElement;
      if (!a || a === document.body) return { tag: "body", text: "", visible: false, focusVisible: false };
      return {
        tag: a.tagName.toLowerCase(),
        role: a.getAttribute("role") || "",
        text: (a.getAttribute("aria-label") || a.textContent || "").trim().slice(0, 40),
        focusVisible: a.matches(":focus-visible"),
      };
    });
    return { step: label, ...info };
  };
  const trace = [];

  // Dashboard
  await page.goto(`${BASE}/fr/dashboard`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(700);
  // Focus body first, then tab to CTA
  await page.evaluate(() => (document.body).focus());
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press("Tab");
    const el = await info(`Tab ${i + 1}`);
    trace.push(el);
    // Stop when we hit the hero CTA (Reprendre/Commencer link containing "Beta")
    if (typeof el.text === "string" && /Beta|Reprendre|Commencer|Continuer|Willkommen/.test(el.text)) break;
  }
  // Press Enter on the hero CTA
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => null),
    page.keyboard.press("Enter"),
  ]);
  await page.waitForTimeout(1500);
  trace.push({ step: "Enter on hero CTA", url: new URL(page.url()).pathname });

  // On lesson page · tab to first radio, select with Space, submit
  // The a1-beta-1-quiz module renders an AdaptiveQuiz component with radio buttons
  const hasQuiz = await page.evaluate(() => Boolean(document.querySelector('button[role="radio"], button[data-answer]')));
  trace.push({ step: "lesson has interactive quiz", hasQuiz });

  if (hasQuiz) {
    // Tab until we find a radio-like button
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press("Tab");
      const cur = await info(`Tab lesson ${i + 1}`);
      trace.push(cur);
      const el = await page.evaluate(() => {
        const a = document.activeElement;
        return a?.getAttribute("role") === "radio" || (a?.tagName === "BUTTON" && (a.textContent || "").length < 50);
      });
      if (el) break;
    }
    // Select with Space
    await page.keyboard.press("Space");
    await page.waitForTimeout(300);
    trace.push({ step: "Space on option", info: await info("post-Space") });

    // Look for feedback via role=status
    const feedbackFound = await page.evaluate(() => {
      const statuses = document.querySelectorAll('[role="status"]');
      for (const s of Array.from(statuses)) {
        const t = (s).innerText || "";
        if (/Correct|Incorrect/.test(t)) return { text: t.slice(0, 80), ariaLive: s.getAttribute("aria-live") };
      }
      return null;
    });
    trace.push({ step: "aria-live feedback after Enter", feedbackFound });
  }

  await ctx.close();
  results.keyboard = trace;
}

// ══ Feedback in DOM ══════════════════════════════════════════════
async function feedbackDom(browser) {
  process.stderr.write("\n═══ FEEDBACK · role=status attributes ═══\n");
  setFixture("active");
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await login(page, EMAIL_MONDE, "fr");
  await page.goto(`${BASE}/fr/courses/${REAL_COURSE_ID}/modules/${REAL_MODULE_ID}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  // Try to click first option and validate
  const clicked = await page.evaluate(() => {
    const opts = Array.from(document.querySelectorAll('button[data-answer], button[role="radio"], .quiz-option'));
    if (opts.length > 0) { (opts[0]).click(); return { clicked: true, kind: opts[0].tagName + (opts[0].getAttribute("role") ? `[${opts[0].getAttribute("role")}]` : "") }; }
    return { clicked: false };
  });
  await page.waitForTimeout(400);
  // Look for a validate button and click
  const validated = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const validate = btns.find((b) => /Valider|Confirmer|Vérifier|Submit|Check/.test(b.textContent || ""));
    if (validate) { (validate).click(); return true; }
    return false;
  });
  await page.waitForTimeout(600);
  const feedback = await page.evaluate(() => {
    const el = document.querySelector('[role="status"]');
    if (!el) return null;
    return {
      role: el.getAttribute("role"),
      ariaLive: el.getAttribute("aria-live"),
      text: ((el).innerText || "").slice(0, 120),
    };
  });
  results.feedback = { clicked, validated, feedback };
  process.stderr.write("  " + JSON.stringify(results.feedback) + "\n");
  await ctx.close();
}

// ══ Zoom 200% ════════════════════════════════════════════════════
async function zoom200(browser) {
  process.stderr.write("\n═══ ZOOM 200% ═══\n");
  setFixture("active");
  const ROUTES_Z = [
    "/fr/dashboard",
    "/fr/courses",
    `/fr/courses/${REAL_COURSE_ID}/modules/${REAL_MODULE_ID}`,
    "/fr/progress",
  ];
  for (const route of ROUTES_Z) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.addInitScript(() => { document.documentElement.style.zoom = "2"; });
    await login(page, EMAIL_MONDE, "fr");
    await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(800);
    const m = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
      pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      buttons: document.querySelectorAll("button:not([disabled])").length,
      links: document.querySelectorAll("a").length,
      hasH1: Boolean(document.querySelector("h1")),
    }));
    results.zoom.push({ route, ...m });
    process.stderr.write(`  ${route.padEnd(60)} pageOvf=${m.pageOverflow} buttons=${m.buttons} h1=${m.hasH1}\n`);
    await ctx.close();
  }
}

// ══ EN full parcours ═════════════════════════════════════════════
async function enFull(browser) {
  process.stderr.write("\n═══ EN FULL parcours ═══\n");
  setFixture("active");
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await login(page, EMAIL_MONDE, "en");
  const routes = [
    "/en/dashboard",
    "/en/courses",
    `/en/courses/${REAL_COURSE_ID}/modules/${REAL_MODULE_ID}`,
    "/en/progress",
  ];
  for (const r of routes) {
    await page.goto(BASE + r, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(700);
    const text = await page.evaluate(() => document.body?.innerText ?? "");
    results.en.push({
      route: r,
      finalPath: new URL(page.url()).pathname,
      hasEnStrings: /(Resume|My journey|Coming soon|Modules completed|Continue|Level|Access|Overall progress|Check|Try|Correct|Incorrect)/i.test(text),
      hasFrFunctional: /(Reprendre|Ma progression|Bientôt disponible|Modules terminés|Vérifier)/.test(text),
      hasGermanVocab: /Willkommen|Guten Tag|Meine Familie|Hallo|Danke/.test(text),
    });
    process.stderr.write(`  ${r.padEnd(60)} → ${new URL(page.url()).pathname}\n`);
  }
  await ctx.close();
}

// ══ Resume fresh browser ═════════════════════════════════════════
async function resume(browser) {
  process.stderr.write("\n═══ RESUME fresh browser ═══\n");
  setFixture("new");
  // Terminate one module via ORM
  const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
  const db = new PrismaClient({ adapter });
  const dbUser = await db.user.findFirst({ where: { email: EMAIL_MONDE }, select: { id: true } });
  await db.moduleProgress.upsert({
    where: { userId_moduleId: { userId: dbUser.id, moduleId: "a1-beta-1-lesen" } },
    update: { status: "COMPLETED", completedAt: new Date() },
    create: { userId: dbUser.id, moduleId: "a1-beta-1-lesen", status: "COMPLETED", completedAt: new Date() },
  });
  results.resume.before = { completedModuleId: "a1-beta-1-lesen" };

  // Fresh context
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await login(page, EMAIL_MONDE, "fr");
  await page.goto(`${BASE}/fr/dashboard`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  const cookies = await ctx.cookies();
  const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join("; ");
  const stateResp = await fetch(`${BASE}/api/me/monde-dashboard`, { headers: { cookie: cookieHeader } });
  const state = await stateResp.json();
  results.resume.after = {
    nextModuleId: state.nextModule?.moduleId,
    overallPct: state.overallPct,
    diff: state.nextModule?.moduleId !== "a1-beta-1-lesen",
  };
  await ctx.close();
  await db.$disconnect();
  process.stderr.write("  " + JSON.stringify(results.resume) + "\n");
}

// ══ DB check ═════════════════════════════════════════════════════
async function dbCheck() {
  process.stderr.write("\n═══ DB check ═══\n");
  const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
  const db = new PrismaClient({ adapter });
  const dbUser = await db.user.findFirst({ where: { email: EMAIL_MONDE }, select: { id: true } });

  const orders = await db.order.count();
  const ordersPaid = await db.order.count({ where: { status: "PAID" } });
  const nonTestGrants = await db.accessGrant.count({
    where: { NOT: { sourceId: { startsWith: "test-p2-" } }, status: "ACTIVE" },
  });

  // Verify per-state progress counts
  const stateCounts = {};
  for (const mode of ["new", "completed", "expired", "none"]) {
    setFixture(mode);
    const c = await db.moduleProgress.count({
      where: { userId: dbUser.id, moduleId: { startsWith: "a1-beta-" }, status: "COMPLETED" },
    });
    stateCounts[mode] = c;
  }

  results.db = { orders, ordersPaid, nonTestActiveGrants: nonTestGrants, stateCounts };
  await db.$disconnect();
  process.stderr.write("  " + JSON.stringify(results.db) + "\n");
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    await scanMatrix(browser);
    await keyboardTrace(browser);
    await feedbackDom(browser);
    await zoom200(browser);
    await enFull(browser);
    await resume(browser);
    await dbCheck();
  } finally {
    await browser.close();
  }
  const { writeFile, mkdir } = await import("node:fs/promises");
  await mkdir("/tmp/p2v-captures", { recursive: true });
  await writeFile("/tmp/p2v-captures/verify.json", JSON.stringify(results, null, 2));
  process.stderr.write("\nWritten /tmp/p2v-captures/verify.json\n");
}
main().catch(e => { console.error(e); process.exit(1); });
