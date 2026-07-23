// P3 hardening · E2E complémentaire au p3-e2e.
//
// Couvre les gaps §13-§16 :
//   §3  · 4 états dashboard Racines (SOLO, FAMILY, FAMILY_EMPTY, NO_ACCESS)
//   §6  · persistance server-side du profil actif (user_metadata.activeChildId)
//   §13 · sweep viewports 360 / 390 / 768 / 1440 sur dashboard
//   §14 · trace clavier · Tab visible focus ring
//   §15 · zoom 200% · lisibilité maintenue
//   §16 · parcours EN complet dashboard + famille
//   §4  · MAX_CHILDREN=4 enforcement
//
// Requis :
//   - dev server sur localhost:3000 avec .env.local pointé sur P-1
//   - P1_TEST_PASSWORD dans l'env
//   - fixtures P3 posées (voir p3-hardening-fixtures.mjs)

import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { spawn } from "node:child_process";

function runFixture(mode) {
  return new Promise((resolve, reject) => {
    const child = spawn("node", ["scripts/test-baseline/p3-hardening-fixtures.mjs", mode], {
      stdio: ["ignore", "pipe", "pipe"], env: process.env,
    });
    let out = ""; child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    child.on("exit", (code) => {
      process.stderr.write(`  [fixture ${mode}] ${out.trim().split("\n").pop()}\n`);
      code === 0 ? resolve() : reject(new Error(`fixture ${mode} failed ${code}`));
    });
  });
}

const BASE = "http://localhost:3000";
const PW = process.env.P1_TEST_PASSWORD;
if (!PW) { console.error("P1_TEST_PASSWORD required"); process.exit(1); }

const EMAILS = {
  solo:   "paul+yema_test_racines_solo@example.com",
  family: "paul+yema_test_racines_family@example.com",
};

const events = [];
function log(label, obj) {
  events.push({ label, ...obj });
  process.stderr.write(`  ${label}: ${JSON.stringify(obj)}\n`);
}

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

async function grabCookieHeader(ctx) {
  const cookies = await ctx.cookies();
  return cookies.map(c => `${c.name}=${c.value}`).join("; ");
}

async function fetchDashboard(ctx) {
  const cookieHeader = await grabCookieHeader(ctx);
  const resp = await fetch(`${BASE}/api/me/racines-dashboard`, { headers: { cookie: cookieHeader } });
  const body = await resp.json().catch(() => null);
  return { status: resp.status, body };
}

async function overflowScan(page, vw) {
  return page.evaluate((vw) => {
    const scrollW = document.documentElement.scrollWidth;
    const clientW = document.documentElement.clientWidth;
    let ovf = 0;
    const worst = [];
    for (const el of Array.from(document.querySelectorAll("body *"))) {
      const r = el.getBoundingClientRect();
      if (r.right > vw + 1 && r.width < vw * 2 && r.width > 0) {
        ovf++;
        if (worst.length < 3) {
          worst.push({ tag: el.tagName, cls: (el.className || "").toString().slice(0, 40), right: Math.round(r.right) });
        }
      }
    }
    return { scrollW, clientW, pageOverflow: scrollW - clientW, overflowCount: ovf, worst };
  }, vw);
}

// §3 · 4 états dashboard Racines
// Chaque état est vérifié après application de sa fixture · les états sont
// posés séquentiellement pour éviter les collisions.
async function state4Sweep(browser) {
  process.stderr.write("\n═══ §3 · Dashboard Racines 4-state (mode source of truth) ═══\n");

  // NO_ACCESS · aucun grant Racines, aucun activationIntent
  await runFixture("no-access");
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const pg = await ctx.newPage();
    await login(pg, EMAILS.solo);
    const api = await fetchDashboard(ctx);
    await pg.goto(`${BASE}/fr/dashboard`, { waitUntil: "domcontentloaded" });
    await pg.waitForTimeout(800);
    const text = await pg.evaluate(() => document.body.innerText);
    log("NO_ACCESS · api", { status: api.status, mode: api.body?.mode });
    log("NO_ACCESS · dashboard text hints", {
      hasOffersCta: /voir les offres|see offers|activer un abonnement|activate a subscription/i.test(text),
      hasNoAccessSoul: /n'est pas encore activé|isn't activated yet/i.test(text),
      hasChildrenList: /TEST_Ade|TEST_Yara/.test(text),
    });
    await ctx.close();
  }

  // SOLO · grant ROOTS_SOLO
  await runFixture("solo");
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const pg = await ctx.newPage();
    await login(pg, EMAILS.solo);
    const api = await fetchDashboard(ctx);
    log("SOLO · api", { status: api.status, mode: api.body?.mode, incoherent: api.body?.household?.incoherent });
    await ctx.close();
  }

  // FAMILY_EMPTY · grant ROOTS_FAMILY, 0 enfants
  await runFixture("family-empty");
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const pg = await ctx.newPage();
    await login(pg, EMAILS.family);
    const api = await fetchDashboard(ctx);
    await pg.goto(`${BASE}/fr/dashboard`, { waitUntil: "domcontentloaded" });
    await pg.waitForTimeout(800);
    const text = await pg.evaluate(() => document.body.innerText);
    log("FAMILY_EMPTY · api", {
      status: api.status, mode: api.body?.mode,
      kids: api.body?.household?.childrenCount, incoherent: api.body?.household?.incoherent,
    });
    log("FAMILY_EMPTY · dashboard text hints", {
      hasConfigureCta: /configurer le foyer|configure the home|attend ses profils|waits for its profiles/i.test(text),
      hasChildrenList: /TEST_Ade|TEST_Yara/.test(text),
    });
    await ctx.close();
  }

  // FAMILY (full) · grant ROOTS_FAMILY + 2 enfants restaurés
  await runFixture("family-full");
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const pg = await ctx.newPage();
    await login(pg, EMAILS.family);
    const api = await fetchDashboard(ctx);
    log("FAMILY · api", {
      status: api.status, mode: api.body?.mode,
      kids: api.body?.household?.childrenCount, incoherent: api.body?.household?.incoherent,
    });
    await ctx.close();
  }

  // Restore healthy state pour la suite du sweep
  await runFixture("restore");
}

// §6 · Active child persistence
async function activeChildPersistence(browser) {
  process.stderr.write("\n═══ §6 · Active child persistence (user_metadata) ═══\n");
  const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
  const db = new PrismaClient({ adapter });
  const familyUser = await db.user.findFirst({ where: { email: EMAILS.family }, select: { id: true } });
  const kid = familyUser
    ? await db.childProfile.findFirst({ where: { parentUserId: familyUser.id }, select: { id: true } })
    : null;
  const otherUser = await db.user.findFirst({ where: { email: EMAILS.solo }, select: { id: true } });
  const otherKid = otherUser
    ? await db.childProfile.findFirst({ where: { parentUserId: otherUser.id }, select: { id: true } })
    : null;
  await db.$disconnect();
  if (!kid) { log("active-child setup", { ok: false, reason: "no family kid" }); return; }

  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await login(page, EMAILS.family);
  const cookieHeader = await grabCookieHeader(ctx);

  // GET initial
  const g1 = await fetch(`${BASE}/api/me/active-child`, { headers: { cookie: cookieHeader } });
  const g1b = await g1.json().catch(() => null);
  log("active-child · GET initial", { status: g1.status, activeChildId: g1b?.activeChildId });

  // POST own kid
  const p1 = await fetch(`${BASE}/api/me/active-child`, {
    method: "POST", headers: { "Content-Type": "application/json", cookie: cookieHeader },
    body: JSON.stringify({ childId: kid.id }),
  });
  log("active-child · POST own kid", { status: p1.status });

  // GET after set
  const g2 = await fetch(`${BASE}/api/me/active-child`, { headers: { cookie: cookieHeader } });
  const g2b = await g2.json().catch(() => null);
  log("active-child · GET after set", { status: g2.status, matches: g2b?.activeChildId === kid.id });

  // POST another parent's kid → must 404
  if (otherKid) {
    const p2 = await fetch(`${BASE}/api/me/active-child`, {
      method: "POST", headers: { "Content-Type": "application/json", cookie: cookieHeader },
      body: JSON.stringify({ childId: otherKid.id }),
    });
    log("active-child · POST other parent kid (must 404)", { status: p2.status });
  }

  // POST null → reset
  const p3 = await fetch(`${BASE}/api/me/active-child`, {
    method: "POST", headers: { "Content-Type": "application/json", cookie: cookieHeader },
    body: JSON.stringify({ childId: null }),
  });
  const p3b = await p3.json().catch(() => null);
  log("active-child · POST null (reset)", { status: p3.status, activeChildId: p3b?.activeChildId });

  // Anon
  const anon = await fetch(`${BASE}/api/me/active-child`);
  log("active-child · GET anon (must 401)", { status: anon.status });

  await ctx.close();
}

// §13 · Viewport sweep
async function viewportSweep(browser) {
  process.stderr.write("\n═══ §13 · Viewport sweep dashboard family ═══\n");
  const viewports = [
    { w: 360, h: 800, n: "360" },
    { w: 390, h: 844, n: "390" },
    { w: 768, h: 1024, n: "768" },
    { w: 1440, h: 900, n: "1440" },
  ];
  for (const vp of viewports) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
    const page = await ctx.newPage();
    await login(page, EMAILS.family);
    for (const route of ["/fr/dashboard", "/fr/famille", "/fr/progress"]) {
      await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 20000 });
      await page.waitForTimeout(700);
      const m = await overflowScan(page, vp.w);
      log(`sweep @${vp.n} ${route}`, {
        pageOverflow: m.pageOverflow,
        overflowCount: m.overflowCount,
        worst: m.worst,
      });
    }
    await ctx.close();
  }
}

// §14 · Keyboard trace
async function keyboardTrace(browser) {
  process.stderr.write("\n═══ §14 · Keyboard trace dashboard ═══\n");
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await login(page, EMAILS.family);
  await page.goto(`${BASE}/fr/dashboard`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(700);
  const trace = [];
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      const ring = cs.outlineWidth !== "0px" || cs.boxShadow !== "none";
      return {
        tag: el.tagName,
        role: el.getAttribute("role"),
        text: (el.textContent || "").trim().slice(0, 40),
        href: el.getAttribute("href"),
        hasFocusRing: ring,
      };
    });
    if (focused) trace.push(focused);
  }
  const noRing = trace.filter((t) => !t.hasFocusRing).length;
  log("keyboard trace · dashboard", { steps: trace.length, missingFocusRing: noRing, sample: trace.slice(0, 5) });
  await ctx.close();
}

// §15 · Zoom 200%
async function zoom200(browser) {
  process.stderr.write("\n═══ §15 · Zoom 200% lisibilité ═══\n");
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await login(page, EMAILS.family);
  await page.goto(`${BASE}/fr/dashboard`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => { document.body.style.zoom = "2"; });
  await page.waitForTimeout(600);
  const m = await overflowScan(page, 1280);
  log("zoom 200% · dashboard family", {
    pageOverflow: m.pageOverflow,
    overflowCount: m.overflowCount,
    hasChildrenText: await page.evaluate(() => /TEST_Ade|TEST_Yara|Ade|Yara/.test(document.body.innerText)),
  });
  await ctx.close();
}

// §16 · English full parcours
async function englishParcours(browser) {
  process.stderr.write("\n═══ §16 · English full parcours ═══\n");
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await login(page, EMAILS.family, "en");
  for (const route of ["/en/dashboard", "/en/famille", "/en/progress", "/en/classroom", "/en/notifications"]) {
    const resp = await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(700);
    const text = await page.evaluate(() => document.body.innerText);
    log(`EN · ${route}`, {
      http: resp?.status() ?? 0,
      hasFrenchLeak: /Écoute|Palabre|Foyer|Bienvenue|Bientôt/.test(text) && !/Family|Welcome|Coming/.test(text),
      hasCECR: /\bA1\b|\bA2\b|\bB1\b|\bB2\b|\bC1\b/.test(text),
      hasComingSoon: /Coming soon|coming soon/i.test(text),
    });
  }
  await ctx.close();
}

// §4 · MAX_CHILDREN enforcement
async function maxChildrenGuard(browser) {
  process.stderr.write("\n═══ §4 · MAX_CHILDREN=4 enforcement ═══\n");
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await login(page, EMAILS.family);
  const cookieHeader = await grabCookieHeader(ctx);

  // Compte actuel
  const listResp = await fetch(`${BASE}/api/family/children`, { headers: { cookie: cookieHeader } });
  const list = await listResp.json().catch(() => null);
  const current = list?.children?.length ?? 0;
  log("MAX_CHILDREN · current count", { current });

  // Tente d'en pousser au-delà de 4
  const createdIds = [];
  let lastStatus = 0;
  for (let i = current; i < 5; i++) {
    const resp = await fetch(`${BASE}/api/family/children`, {
      method: "POST", headers: { "Content-Type": "application/json", cookie: cookieHeader },
      body: JSON.stringify({
        prenom: `TEST_Cap${i}`, age: 5, avatarAnimal: "chouette",
        langues: [{ langue: "lingala", type: "native" }],
      }),
    });
    const body = await resp.json().catch(() => null);
    lastStatus = resp.status;
    if (resp.status === 200 && body?.child?.id) createdIds.push(body.child.id);
    log(`MAX_CHILDREN · POST attempt ${i + 1}`, { status: resp.status, error: body?.error, limit: body?.limit });
    if (resp.status === 409) break;
  }

  // Cleanup les enfants créés par ce test
  for (const id of createdIds) {
    await fetch(`${BASE}/api/family/children/${id}`, { method: "DELETE", headers: { cookie: cookieHeader } });
  }
  log("MAX_CHILDREN · cleanup", { removed: createdIds.length, lastStatus });
  await ctx.close();
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    // §3 nécessite de switcher les fixtures entre appels · fait manuellement en amont.
    // On lit d'abord l'état courant pour capturer.
    await state4Sweep(browser);
    await activeChildPersistence(browser);
    await viewportSweep(browser);
    await keyboardTrace(browser);
    await zoom200(browser);
    await englishParcours(browser);
    await maxChildrenGuard(browser);
  } finally {
    await browser.close();
  }
  const { writeFile, mkdir } = await import("node:fs/promises");
  await mkdir("/tmp/p3-captures", { recursive: true });
  await writeFile("/tmp/p3-captures/hardening-e2e.json", JSON.stringify(events, null, 2));
  process.stderr.write(`\nWritten /tmp/p3-captures/hardening-e2e.json (${events.length} events)\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
