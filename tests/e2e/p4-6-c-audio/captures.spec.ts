// P4.6-C.3 · captures Preview P-1 (états UI messagerie audio).
//
// Génère les captures desktop 1440, tablette 768, mobile 390 pour les
// états principaux. Aucun contenu personnel · fixtures QA techniques.

import { test, type Page } from "playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const TEACHER_EMAIL = process.env.E2E_TEACHER_EMAIL;
const TEACHER_PASSWORD = process.env.E2E_TEACHER_PASSWORD;
const OUT = process.env.YEMA_CAPTURE_OUT ?? resolve(process.cwd(), "playwright-report/captures/p4-6-c-audio");

const MOCK_SRC = readFileSync(resolve(__dirname, "support/mediaRecorderMock.js"), "utf-8");

const VIEWPORTS = [
  { name: "desktop-1440", width: 1440, height: 1000 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "mobile-390", width: 390, height: 844 },
];

async function loginAndOpen(page: Page, locale: "fr" | "en" = "fr"): Promise<void> {
  await page.goto(`/${locale}/login`);
  await page.getByLabel(/e-?mail/i).fill(TEACHER_EMAIL!);
  await page.getByLabel(/mot de passe|password/i).fill(TEACHER_PASSWORD!);
  await page.getByRole("button", { name: /ouvrir ma maison|open my house|log in/i }).click();
  await page.waitForURL(new RegExp(`/${locale}/(dashboard|messages|onboarding|apprentissage)`), { timeout: 15_000 });
  await page.goto(`/${locale}/messages`);
  const item = page.getByRole("button", { name: /Élève.*Enseignant|Student.*Teacher/i }).first();
  await item.waitFor({ timeout: 15_000 });
  await item.click({ force: true });
  // Sur mobile, deux composers coexistent dans le DOM (desktop hidden +
  // mobile visible) · attendre le mic visible plutôt que le textarea.
  await page.getByRole("button", { name: /enregistrer un message vocal|record a voice message/i }).first().waitFor({ timeout: 15_000, state: "visible" });
}

const manifest: string[] = [];

test.describe.serial("P4.6-C.3 captures", () => {
  test.skip(!TEACHER_EMAIL, "credentials absents · orchestrateur E2E fournit");

  for (const vp of VIEWPORTS) {
    test(`${vp.name} · IDLE + RECORDING + RECORDED + AUDIO bubble`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      await ctx.addInitScript(MOCK_SRC);
      const page = await ctx.newPage();
      await loginAndOpen(page);

      // IDLE
      const idlePath = `${OUT}/${vp.name}-adult-IDLE.png`;
      await page.screenshot({ path: idlePath, fullPage: false });
      manifest.push(idlePath);

      // RECORDING
      await page.getByRole("button", { name: /enregistrer un message vocal|record a voice message/i }).first().click();
      await page.getByRole("button", { name: /arrêter|stop/i }).first().waitFor({ timeout: 10_000 });
      const recPath = `${OUT}/${vp.name}-adult-RECORDING.png`;
      await page.screenshot({ path: recPath });
      manifest.push(recPath);

      // RECORDED
      await page.waitForTimeout(400);
      await page.getByRole("button", { name: /arrêter|stop/i }).first().click();
      await page.getByRole("button", { name: /^envoyer$/i, exact: false }).first().waitFor({ timeout: 15_000 });
      const recordedPath = `${OUT}/${vp.name}-adult-RECORDED.png`;
      await page.screenshot({ path: recordedPath });
      manifest.push(recordedPath);

      // SEND → attendre bulle AUDIO puis capture.
      await page.getByRole("button", { name: /^envoyer$/i }).first().click();
      await page.locator('[role="log"]').getByRole("button", { name: /lire le message vocal/i }).first().waitFor({ timeout: 20_000 });
      const bubblePath = `${OUT}/${vp.name}-adult-AUDIO-bubble.png`;
      await page.screenshot({ path: bubblePath });
      manifest.push(bubblePath);

      await ctx.close();
    });
  }

  // P4.6-C.3.1 · captures EN minimales (§8 brief).
  test("desktop-1440 EN · adulte AUDIO bubble", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await ctx.addInitScript(MOCK_SRC);
    const page = await ctx.newPage();
    await loginAndOpen(page, "en");
    // Envoyer un audio pour capturer la bulle.
    await page.getByRole("button", { name: /record a voice message|enregistrer un message vocal/i }).first().click();
    await page.getByRole("button", { name: /stop|arrêter/i }).first().waitFor({ timeout: 10_000 });
    await page.waitForTimeout(400);
    await page.getByRole("button", { name: /stop|arrêter/i }).first().click();
    await page.getByRole("button", { name: /^send$|^envoyer$/i }).first().waitFor({ timeout: 10_000 });
    await page.getByRole("button", { name: /^send$|^envoyer$/i }).first().click();
    await page.locator('[role="log"]').getByRole("button", { name: /play voice message|lire le message vocal/i }).first().waitFor({ timeout: 20_000 });
    const p = `${OUT}/desktop-1440-adult-EN-AUDIO-bubble.png`;
    await page.screenshot({ path: p });
    manifest.push(p);
    await ctx.close();
  });

  test("mobile-390 EN · adulte RECORDING", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.addInitScript(MOCK_SRC);
    const page = await ctx.newPage();
    await loginAndOpen(page, "en");
    await page.getByRole("button", { name: /record a voice message|enregistrer un message vocal/i }).first().click();
    await page.getByRole("button", { name: /stop|arrêter/i }).first().waitFor({ timeout: 10_000 });
    const p = `${OUT}/mobile-390-adult-EN-RECORDING.png`;
    await page.screenshot({ path: p });
    manifest.push(p);
    await ctx.close();
  });

  test.afterAll(async () => {
    const manifestPath = `${OUT}/MANIFEST.txt`;
    const now = new Date().toISOString();
    const content = [
      `# P4.6-C.3 captures manifest · generated ${now}`,
      `# Project · P-1 (kzzagbojjkivdzzcrmxn) · fixtures techniques QA · aucun contenu personnel`,
      `# Total captures · ${manifest.length}`,
      "",
      ...manifest,
    ].join("\n");
    writeFileSync(manifestPath, content, "utf-8");
    console.log(`[captures] manifest écrit · ${manifestPath}`);
  });
});
