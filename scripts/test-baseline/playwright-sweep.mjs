// P-1 Baseline · Sweep authentifiée Playwright
// Pour chaque compte : login réel via Supabase Auth → storageState → visite
// des pages autorisées à 4 breakpoints avec collecte overflow/AI/placeholders.

import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { assertNonProduction, ACCOUNTS, getTestPassword } from "./_common.mjs";

const TEST_PASSWORD = getTestPassword();

assertNonProduction();

const BASE = "http://localhost:3000";
const BPS = [
  { name: "360",  width: 360,  height: 800 },
  { name: "390",  width: 390,  height: 844 },
  { name: "768",  width: 768,  height: 1024 },
  { name: "1440", width: 1440, height: 900 },
];

// Route → allowed roles (subset per doctrine §7)
const PAGES = [
  // STUDENT Monde
  { path: "/fr/dashboard", roles: ["monde", "racines_solo", "racines_family", "teacher", "center", "admin"] },
  { path: "/fr/courses", roles: ["monde", "racines_solo", "racines_family", "teacher", "center", "admin"] },
  { path: "/fr/progress", roles: ["monde", "racines_solo", "racines_family", "teacher", "center", "admin"] },
  { path: "/fr/settings", roles: ["monde", "racines_solo", "racines_family", "teacher", "center", "admin"] },
  { path: "/fr/notifications", roles: ["monde", "racines_solo", "racines_family", "teacher", "center", "admin"] },
  { path: "/fr/discover", roles: ["monde", "racines_solo", "racines_family", "teacher", "center", "admin"] },
  { path: "/fr/test-niveau", roles: ["monde", "racines_solo"] },
  // Racines / Famille
  { path: "/fr/famille", roles: ["racines_family"] },
  { path: "/fr/classroom", roles: ["monde", "teacher"] },
  { path: "/fr/classroom/join", roles: ["monde", "racines_solo"] },
  { path: "/fr/group", roles: ["monde"] },
  // Teacher
  { path: "/fr/teacher", roles: ["teacher"] },
  { path: "/fr/teacher/classrooms", roles: ["teacher"] },
  { path: "/fr/teacher/students", roles: ["teacher"] },
  { path: "/fr/teacher/assignments", roles: ["teacher"] },
  { path: "/fr/teacher/stats", roles: ["teacher"] },
  { path: "/fr/teacher/resources", roles: ["teacher"] },
  { path: "/fr/teacher/studio", roles: ["teacher"] },
  { path: "/fr/teacher/settings", roles: ["teacher"] },
  // Center
  { path: "/fr/center", roles: ["center"] },
  { path: "/fr/center/teachers", roles: ["center"] },
  { path: "/fr/center/students", roles: ["center"] },
  { path: "/fr/center/classes", roles: ["center"] },
  { path: "/fr/center/billing", roles: ["center"] },
  { path: "/fr/center/stats", roles: ["center"] },
  // Admin
  { path: "/fr/admin", roles: ["admin"] },
  { path: "/fr/admin/users", roles: ["admin"] },
  { path: "/fr/admin/courses", roles: ["admin"] },
  { path: "/fr/admin/applications", roles: ["admin"] },
  { path: "/fr/admin/roles", roles: ["admin"] },
  { path: "/fr/admin/system", roles: ["admin"] },
  { path: "/fr/admin/centers", roles: ["admin"] },
  // Onboarding (auth-only)
  { path: "/fr/onboarding", roles: ["monde", "racines_solo"] },
];

const AI_RX = /(analyser avec ia|analyze with ai|corriger avec ia|correct with ai|coach ia|ai coach)/i;
const FAKE_RX = /(Sophie Tanda|Marie N\.|Prof\. Sophie|Herr Kwessi|Coach Mokili|Netzwerk neu|lorem ipsum|Jane Doe|John Doe)/i;

async function loginAs(browser, acc) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/fr/login`, { waitUntil: "networkidle", timeout: 20000 });
  await page.fill('input[type="email"]', acc.email);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  // Wait for the signIn Supabase call to complete AND cookies to be set
  const [resp] = await Promise.all([
    page.waitForResponse((r) => /supabase\.co\/auth\/v1\/token/.test(r.url()), { timeout: 15000 }).catch(() => null),
    page.click('button[type="submit"]'),
  ]);
  // Give proxy time to redirect + cookies to persist
  await page.waitForTimeout(2000);
  // Wait for URL change (redirect out of login) OR give up after 15s
  await page.waitForURL(u => !u.pathname.includes("/login"), { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000);
  const finalUrl = page.url();
  const state = await ctx.storageState();
  await ctx.close();
  return { state, finalUrl, signInStatus: resp?.status() ?? 0 };
}

async function main() {
  await mkdir("scripts/test-baseline/storage-state", { recursive: true });
  await mkdir("scripts/test-baseline/captures", { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const rows = [];

  console.log("═══ P-1 Sweep authentifiée · 6 comptes × 4 viewports ═══\n");

  // Login all accounts and capture state
  const states = {};
  for (const acc of ACCOUNTS) {
    console.log(`── Login ${acc.label} (${acc.email})`);
    try {
      const { state, finalUrl, signInStatus } = await loginAs(browser, acc);
      const path = `scripts/test-baseline/storage-state/${acc.label}.json`;
      await writeFile(path, JSON.stringify(state, null, 2));
      states[acc.label] = { path, finalUrl };
      const cookiesCount = state.cookies?.length ?? 0;
      const sbCookies = state.cookies?.filter(c => /^sb-/.test(c.name)).length ?? 0;
      console.log(`   ✓ signIn HTTP=${signInStatus} · ${cookiesCount} cookies (${sbCookies} sb-*) · post-login ${new URL(finalUrl).pathname}`);
    } catch (e) {
      console.log(`   ✗ login failed: ${e.message}`);
      states[acc.label] = { error: e.message };
    }
  }
  console.log("");

  // Sweep for each role
  for (const bp of BPS) {
    console.log(`── Viewport ${bp.name} ×${bp.height}`);
    for (const acc of ACCOUNTS) {
      if (!states[acc.label]?.path) continue;
      const ctx = await browser.newContext({
        viewport: { width: bp.width, height: bp.height },
        storageState: states[acc.label].path,
      });
      const page = await ctx.newPage();

      for (const p of PAGES) {
        if (!p.roles.includes(acc.label)) continue;
        let status = 0, finalPath = "", overflow = 0, aiBtns = 0, fakeHits = [], bodyLen = 0, h1 = "", consoleErr = 0;
        page.removeAllListeners("console");
        page.on("console", (msg) => { if (msg.type() === "error") consoleErr++; });
        try {
          const resp = await page.goto(BASE + p.path, { waitUntil: "domcontentloaded", timeout: 15000 });
          status = resp?.status() ?? 0;
          finalPath = new URL(page.url()).pathname;
        } catch { status = -1; }
        await page.waitForTimeout(300);

        try {
          overflow = await page.evaluate((vw) => {
            let n = 0;
            for (const el of Array.from(document.querySelectorAll("body *"))) {
              const r = el.getBoundingClientRect();
              if (r.right > vw + 1 && r.width < vw * 2) n++;
            }
            return n;
          }, bp.width);
          aiBtns = await page.evaluate((rxs) => {
            const rx = new RegExp(rxs, "i");
            return Array.from(document.querySelectorAll("button,a")).filter(el => rx.test(el.textContent || "")).length;
          }, AI_RX.source);
          const bodyText = await page.evaluate(() => document.body?.innerText ?? "");
          bodyLen = bodyText.length;
          h1 = (await page.evaluate(() => document.querySelector("h1")?.textContent?.trim() ?? "")).slice(0, 50);
          const matches = bodyText.match(FAKE_RX);
          if (matches) fakeHits = [...new Set([matches[0]])];
        } catch {}

        const redirectedToLogin = finalPath.endsWith("/login");
        rows.push({
          vp: bp.name, role: acc.label, path: p.path, http: status, final: finalPath === p.path ? "-" : finalPath,
          ovf: overflow, ai: aiBtns, fake: fakeHits.join(","), body: bodyLen, h1, cerr: consoleErr,
          rendered: !redirectedToLogin,
        });
      }
      await ctx.close();
    }
  }

  await browser.close();

  // Report
  const outLines = [];
  outLines.push("vp\trole\t\t\tpath\t\t\t\thttp\tfinal\tovf\tai\tfake\tbody\tcerr\th1\trendered");
  for (const r of rows) {
    outLines.push(`${r.vp}\t${r.role.padEnd(16).slice(0,16)}\t${r.path.padEnd(32).slice(0,32)}\t${r.http}\t${r.final.padEnd(20).slice(0,20)}\t${r.ovf}\t${r.ai}\t${r.fake.slice(0,15).padEnd(15)}\t${r.body}\t${r.cerr}\t${r.h1.padEnd(40).slice(0,40)}\t${r.rendered}`);
  }
  await writeFile("scripts/test-baseline/captures/sweep-report.tsv", outLines.join("\n"));
  console.log("");
  console.log(`report written: scripts/test-baseline/captures/sweep-report.tsv (${rows.length} rows)`);

  // Aggregate: pages rendered vs redirected per role
  const perRole = {};
  for (const r of rows) {
    if (r.vp !== "390") continue; // aggregate on canonical mobile
    if (!perRole[r.role]) perRole[r.role] = { rendered: 0, redirected: 0, ovf: 0, ai: 0, fake: 0, cerr: 0 };
    perRole[r.role][r.rendered ? "rendered" : "redirected"]++;
    perRole[r.role].ovf += r.ovf;
    perRole[r.role].ai += r.ai;
    if (r.fake) perRole[r.role].fake++;
    perRole[r.role].cerr += r.cerr;
  }
  console.log("\n=== SYNTHÈSE PAR RÔLE (viewport 390) ===");
  console.log("role\t\trendered\tredirected\tovf_total\tai_total\tfake_hits\tconsole_err_total");
  for (const [role, s] of Object.entries(perRole)) {
    console.log(`${role.padEnd(16).slice(0,16)}\t${s.rendered}\t\t${s.redirected}\t\t${s.ovf}\t\t${s.ai}\t\t${s.fake}\t\t${s.cerr}`);
  }
  console.log("\nDONE");
}

main().catch((e) => { console.error(e); process.exit(1); });
