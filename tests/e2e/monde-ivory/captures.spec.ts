// Lot 7A.2 · captures Monde Ivory · 5 parcours + états + FR/EN.
//
// L'orchestrateur wrapper bascule la valeur `User.learningGoal` du
// Student Monde QA entre chaque scénario via db.user.update() DIRECT
// depuis ce spec Playwright (Prisma dispo dans le process de test).
// La restauration finale est faite par l'orchestrateur dans finally.

import { test, type Page } from "playwright/test";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const OUT = resolve(process.cwd(), "playwright-report/captures/monde-ivory");
mkdirSync(OUT, { recursive: true });

const USER_ID = process.env.MONDE_QA_STUDENT_USER_ID!;
const STUDENT_EMAIL = process.env.MONDE_QA_STUDENT_EMAIL!;
const PASSWORD = process.env.P1_TEST_PASSWORD!;

// Scénarios · learningGoal + city pour piloter resolveMondePath +
// derivePathStatus.
const SCENARIOS = [
  { id: "no_pathway",       goal: null,                    city: null },
  { id: "STUDIES",          goal: "étudier à Berlin",      city: "Berlin" },
  { id: "WORK",             goal: "travailler à Zurich",   city: "Zurich" },
  { id: "TRAVEL",           goal: "voyager à Munich",      city: "Munich" },
  { id: "EXAM",             goal: "passer le goethe A2",   city: null },
  { id: "DAILY_LIFE",       goal: "vie quotidienne à Zurich", city: "Zurich" },
  { id: "incomplete_goal",  goal: "voyager à Munich",      city: null }, // TRAVEL sans date
];

const VIEWPORTS = [
  { name: "desktop-1440", width: 1440, height: 1000 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "mobile-390", width: 390, height: 844 },
];

async function login(page: Page, locale: "fr" | "en" = "fr") {
  await page.goto(`/${locale}/login`);
  await page.getByLabel(/e-?mail/i).fill(STUDENT_EMAIL);
  await page.getByLabel(/mot de passe|password/i).fill(PASSWORD);
  await page.getByRole("button", { name: /ouvrir ma maison|open my house|log in/i }).click();
  await page.waitForURL(new RegExp(`/${locale}/(dashboard|onboarding|apprentissage)`), { timeout: 20_000 });
  await page.goto(`/${locale}/dashboard`);
}

const manifest: string[] = [];

test.describe.serial("Monde Ivory captures P-1", () => {
  test.skip(!PASSWORD || !USER_ID, "creds P-1 requis · exécution via orchestrateur");

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }) });

  test.afterAll(async () => {
    await db.$disconnect();
    const manifestPath = `${OUT}/MANIFEST.txt`;
    const content = [
      `# Lot 7A.2 · Monde Ivory captures · generated ${new Date().toISOString()}`,
      `# Project · P-1 (kzzagbojjkivdzzcrmxn) · fixture QA temporaire restaurée par l'orchestrateur`,
      `# Total captures · ${manifest.length}`,
      "",
      ...manifest,
    ].join("\n");
    writeFileSync(manifestPath, content, "utf-8");
    console.log(`[monde-ivory] MANIFEST écrit · ${manifestPath}`);
  });

  for (const vp of VIEWPORTS) {
    for (const sc of SCENARIOS) {
      // 3 viewports × 7 scénarios = 21 captures FR de base
      test(`${vp.name} FR · ${sc.id}`, async ({ browser }) => {
        // Basculer fixture.
        await db.user.update({
          where: { id: USER_ID },
          data: { learningGoal: sc.goal, city: sc.city },
        });
        const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
        const page = await ctx.newPage();
        await login(page, "fr");
        await page.waitForTimeout(1000);
        const p = `${OUT}/${vp.name}-fr-${sc.id}.png`;
        await page.screenshot({ path: p, fullPage: false });
        // Vérifier overflow horizontal via DOM.
        const overflow = await page.evaluate(() => {
          const d = document.documentElement;
          return d.scrollWidth > d.clientWidth;
        });
        manifest.push(`${p} · locale=fr · viewport=${vp.name} · scenario=${sc.id} · overflow=${overflow ? "YES" : "no"}`);
        await ctx.close();
      });
    }
  }

  // Captures EN minimales (STUDIES desktop, EXAM mobile, DAILY_LIFE mobile).
  const EN_CAPTURES = [
    { vp: "desktop-1440", w: 1440, h: 1000, sc: "STUDIES",    goal: "study abroad in Berlin", city: "Berlin" },
    { vp: "mobile-390",    w: 390,  h: 844,  sc: "EXAM",       goal: "goethe zertifikat A1",   city: null },
    { vp: "mobile-390",    w: 390,  h: 844,  sc: "DAILY_LIFE", goal: "daily life in Berlin",   city: "Berlin" },
  ];
  for (const c of EN_CAPTURES) {
    test(`${c.vp} EN · ${c.sc}`, async ({ browser }) => {
      await db.user.update({
        where: { id: USER_ID },
        data: { learningGoal: c.goal, city: c.city },
      });
      const ctx = await browser.newContext({ viewport: { width: c.w, height: c.h } });
      const page = await ctx.newPage();
      await login(page, "en");
      await page.waitForTimeout(1000);
      const p = `${OUT}/${c.vp}-en-${c.sc}.png`;
      await page.screenshot({ path: p, fullPage: false });
      const overflow = await page.evaluate(() => {
        const d = document.documentElement;
        return d.scrollWidth > d.clientWidth;
      });
      manifest.push(`${p} · locale=en · viewport=${c.vp} · scenario=${c.sc} · overflow=${overflow ? "YES" : "no"}`);
      await ctx.close();
    });
  }
});
