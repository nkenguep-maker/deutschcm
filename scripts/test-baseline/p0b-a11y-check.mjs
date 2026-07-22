// P0.B · Validation clavier + zoom 200 % sur les 3 routes prioritaires.

import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const PW = process.env.P1_TEST_PASSWORD;
if (!PW) { console.error("P1_TEST_PASSWORD required"); process.exit(1); }

const ACCOUNTS = {
  admin:  "paul+yema_test_admin@example.com",
  center: "paul+yema_test_center@example.com",
};

async function login(browser, email) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/fr/login`, { waitUntil: "networkidle", timeout: 30000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', PW);
  await Promise.all([
    page.waitForResponse(r => /supabase\.co\/auth\/v1\/token/.test(r.url()), { timeout: 20000 }).catch(() => null),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForTimeout(2500);
  const state = await ctx.storageState();
  await ctx.close();
  return state;
}

// Récupère le sélecteur/label de l'élément focus courant.
async function focusInfo(page) {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return { tag: "body", label: "", visible: false };
    const r = el.getBoundingClientRect();
    return {
      tag: el.tagName.toLowerCase(),
      role: el.getAttribute("role") || "",
      label: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 60),
      visible: r.width > 0 && r.height > 0 && r.top >= 0 && r.bottom <= window.innerHeight + 200,
      hasFocusVisible: el.matches(":focus-visible"),
    };
  });
}

async function keyboardScenarioAdmin(browser, state) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, storageState: state });
  const page = await ctx.newPage();
  await page.goto(BASE + "/fr/admin", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  const trace = [];

  // Étape 1 : Tab jusqu'au hamburger
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Tab");
    const info = await focusInfo(page);
    if (info.label.toLowerCase().includes("menu") || info.tag === "button" && info.label === "") {
      trace.push({ step: `Tab ${i+1}`, target: `${info.tag} · ${info.label}`, focusVisible: info.hasFocusVisible });
      break;
    }
    trace.push({ step: `Tab ${i+1}`, target: `${info.tag} · ${info.label}`, focusVisible: info.hasFocusVisible });
  }

  // Étape 2 : Enter → drawer ouvre
  await page.keyboard.press("Enter");
  await page.waitForTimeout(400);
  const drawerAfterEnter = await page.evaluate(() => document.querySelector(".admin-sidebar.open") !== null);
  trace.push({ step: "Enter (hamburger)", drawerOpen: drawerAfterEnter });

  // Étape 3 : Tab dans le drawer (avec autofocus attendu sur premier item)
  await page.keyboard.press("Tab");
  const focusAfterOpenTab = await focusInfo(page);
  trace.push({ step: "Tab après ouverture", target: `${focusAfterOpenTab.tag} · ${focusAfterOpenTab.label}` });

  // Étape 4 : Escape → drawer se ferme + focus retour hamburger
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  const drawerAfterEsc = await page.evaluate(() => document.querySelector(".admin-sidebar.open") !== null);
  const focusAfterEsc = await focusInfo(page);
  trace.push({ step: "Escape", drawerOpen: drawerAfterEsc, focusReturnedTo: focusAfterEsc.label });

  // Étape 5 : re-ouverture + click sur un nav item → drawer se ferme après
  await page.click(".admin-hamburger");
  await page.waitForTimeout(300);
  const users = await page.$$('.admin-sidebar button');
  await users[1].click(); // second item = Users
  await page.waitForTimeout(300);
  const drawerAfterNav = await page.evaluate(() => document.querySelector(".admin-sidebar.open") !== null);
  trace.push({ step: "Nav item click", drawerClosedAfter: !drawerAfterNav });

  await ctx.close();
  return trace;
}

async function zoom200(browser, state, route) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    storageState: state,
  });
  const page = await ctx.newPage();
  // Simulate 200% zoom via meta viewport override
  await page.addInitScript(() => {
    document.documentElement.style.zoom = "2";
  });
  await page.goto(BASE + route, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  const measures = await page.evaluate((vw) => {
    const scrollW = document.documentElement.scrollWidth;
    const clientW = document.documentElement.clientWidth;
    // essential elements presence
    const hamb = !!document.querySelector(".admin-hamburger") || !!document.querySelector(".app-hamburger");
    const nav = !!document.querySelector("nav");
    const buttons = document.querySelectorAll("button:not([disabled])").length;
    const links = document.querySelectorAll("a").length;
    return { scrollW, clientW, pageOverflow: scrollW - clientW, hamb, nav, buttons, links };
  }, 390);
  await ctx.close();
  return measures;
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  const stateAdmin = await login(browser, ACCOUNTS.admin);
  const stateCenter = await login(browser, ACCOUNTS.center);

  process.stderr.write("\n=== Keyboard scenario /fr/admin (390) ===\n");
  const trace = await keyboardScenarioAdmin(browser, stateAdmin);
  for (const t of trace) process.stderr.write("  " + JSON.stringify(t) + "\n");

  process.stderr.write("\n=== Zoom 200% checks ===\n");
  for (const [role, state, route] of [
    ["admin", stateAdmin, "/fr/admin"],
    ["admin", stateAdmin, "/fr/admin/users"],
    ["center", stateCenter, "/fr/center/students"],
  ]) {
    const m = await zoom200(browser, state, route);
    process.stderr.write(`  ${route.padEnd(24)} scrollW=${m.scrollW} clientW=${m.clientW} pageOverflow=${m.pageOverflow} hamb=${m.hamb} nav=${m.nav} buttons=${m.buttons}\n`);
  }

  await browser.close();
}
main().catch(e => { console.error(e); process.exit(1); });
