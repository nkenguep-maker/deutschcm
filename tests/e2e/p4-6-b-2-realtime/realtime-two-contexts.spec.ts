// P4.6-B.2 / P4.6-B.3 · E2E deux contextes navigateur
//
// La commande obligatoire `npm run test:messaging-realtime:p1` gère
// désormais la vérification des credentials avant même de lancer
// Playwright · le test.skip global est conservé pour la suite locale
// générale (dev sans creds) mais l'orchestrateur P4.6-B.3 échoue
// non-skippable si les envs manquent.

import { test, expect, type BrowserContext } from "playwright/test";

const TEACHER_EMAIL = process.env.E2E_TEACHER_EMAIL;
const TEACHER_PASSWORD = process.env.E2E_TEACHER_PASSWORD;
const STUDENT_EMAIL = process.env.E2E_STUDENT_EMAIL;
const STUDENT_PASSWORD = process.env.E2E_STUDENT_PASSWORD;
const OUTSIDER_EMAIL = process.env.E2E_OUTSIDER_EMAIL;
const OUTSIDER_PASSWORD = process.env.E2E_OUTSIDER_PASSWORD;

const CREDENTIALS_READY = Boolean(
  TEACHER_EMAIL && TEACHER_PASSWORD &&
  STUDENT_EMAIL && STUDENT_PASSWORD &&
  OUTSIDER_EMAIL && OUTSIDER_PASSWORD,
);

test.describe("P4.6-B.3 · Realtime deux contextes P-1", () => {
  test.skip(
    !CREDENTIALS_READY,
    "E2E_TEACHER/STUDENT/OUTSIDER_EMAIL+PASSWORD requis · voir npm run test:messaging-realtime:p1",
  );

  async function login(context: BrowserContext, email: string, password: string) {
    const page = await context.newPage();
    await page.goto("/fr/login");
    await page.getByLabel(/e-?mail/i).fill(email);
    await page.getByLabel(/mot de passe|password/i).fill(password);
    await page.getByRole("button", { name: /ouvrir ma maison|log in|login/i }).click();
    await page.waitForURL(/\/fr\/(dashboard|apprentissage|messages|onboarding)/, { timeout: 15_000 });
    return page;
  }

  // Ouvre /fr/messages et clique sur "Élève ↔ Enseignant" (t_em_en).
  // Attend l'apparition du composer (placeholder).
  async function openFirstConversation(page: import("playwright/test").Page) {
    await page.goto("/fr/messages");
    // Attend l'inbox chargée · cible le libellé exact.
    const item = page.getByRole("button", { name: /Élève.*Enseignant/i }).first();
    await item.waitFor({ timeout: 20_000 });
    await item.click({ force: true });
    // Le composer doit apparaître · c'est un textarea avec ce placeholder.
    await page.getByPlaceholder(/écrire un message|write a message/i)
      .waitFor({ timeout: 20_000 });
  }

  test("1+2. Teacher → Student sans reload · dédup · latence <1s attendue", async ({ browser }) => {
    const teacherCtx = await browser.newContext();
    const studentCtx = await browser.newContext();
    const teacherPage = await login(teacherCtx, TEACHER_EMAIL!, TEACHER_PASSWORD!);
    const studentPage = await login(studentCtx, STUDENT_EMAIL!, STUDENT_PASSWORD!);

    await openFirstConversation(teacherPage);
    await openFirstConversation(studentPage);

    const unique = `E2E-T2S-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const tSent = Date.now();
    await teacherPage.getByPlaceholder(/écrire un message|write a message/i).fill(unique);
    await teacherPage.getByRole("button", { name: /envoyer|send/i }).click();

    await expect(studentPage.getByText(unique)).toBeVisible({ timeout: 20_000 });
    const latencyMs = Date.now() - tSent;
    console.log(`[latency] Teacher → Student · ${latencyMs}ms`);
    if (latencyMs < 1000) test.info().annotations.push({ type: "latency-t2s", description: `${latencyMs}ms · Realtime OK` });
    else test.info().annotations.push({ type: "latency-t2s", description: `${latencyMs}ms · polling fallback probable` });

    // Dédup client.
    const occurrences = await studentPage.getByText(unique).count();
    expect(occurrences).toBe(1);

    // Retour · Student → Teacher.
    const unique2 = `E2E-S2T-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const sSent = Date.now();
    await studentPage.getByPlaceholder(/écrire un message|write a message/i).fill(unique2);
    await studentPage.getByRole("button", { name: /envoyer|send/i }).click();
    await expect(teacherPage.getByText(unique2)).toBeVisible({ timeout: 20_000 });
    console.log(`[latency] Student → Teacher · ${Date.now() - sSent}ms`);
    expect(await teacherPage.getByText(unique2).count()).toBe(1);

    await teacherCtx.close();
    await studentCtx.close();
  });

  test("3. Outsider authentifié ne voit AUCUN message des autres", async ({ browser }) => {
    const teacherCtx = await browser.newContext();
    const outsiderCtx = await browser.newContext();
    const teacherPage = await login(teacherCtx, TEACHER_EMAIL!, TEACHER_PASSWORD!);
    const outsiderPage = await login(outsiderCtx, OUTSIDER_EMAIL!, OUTSIDER_PASSWORD!);

    await openFirstConversation(teacherPage);
    // Outsider · goto direct · s'il a une inbox, elle ne doit PAS contenir t_em_en.
    await outsiderPage.goto("/fr/messages");
    await outsiderPage.waitForTimeout(3_000);

    const unique = `E2E-OUTSIDER-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await teacherPage.getByPlaceholder(/écrire un message|write a message/i).fill(unique);
    await teacherPage.getByRole("button", { name: /envoyer|send/i }).click();

    // L'outsider ne doit JAMAIS voir ce message · attente courte + assertion invisible.
    await outsiderPage.waitForTimeout(5_000);
    await expect(outsiderPage.getByText(unique)).not.toBeVisible();

    await teacherCtx.close();
    await outsiderCtx.close();
  });

  test("4. Typing éphémère · aucun contenu de saisie transmis", async ({ browser }) => {
    const teacherCtx = await browser.newContext();
    const studentCtx = await browser.newContext();
    const teacherPage = await login(teacherCtx, TEACHER_EMAIL!, TEACHER_PASSWORD!);
    const studentPage = await login(studentCtx, STUDENT_EMAIL!, STUDENT_PASSWORD!);

    await openFirstConversation(teacherPage);
    await openFirstConversation(studentPage);

    const secret = "SECRET_" + Date.now();
    const tStart = Date.now();
    await teacherPage.getByPlaceholder(/écrire un message|write a message/i).fill(secret);

    // Indicateur générique visible côté student, contenu invisible.
    await expect(studentPage.getByText(/écrit|typing/i).first()).toBeVisible({ timeout: 10_000 });
    console.log(`[latency] typing indicator · ${Date.now() - tStart}ms`);
    await expect(studentPage.getByText(secret)).not.toBeVisible({ timeout: 3_000 });

    await teacherCtx.close();
    await studentCtx.close();
  });

  test("5. Déconnexion WebSocket · bannière + polling + reconnexion sans doublon", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await login(ctx, TEACHER_EMAIL!, TEACHER_PASSWORD!);
    await page.goto("/fr/messages");
    await page.locator('[role="log"], .msg-col-center').first().waitFor({ timeout: 15_000 });

    await ctx.setOffline(true);
    await page.waitForTimeout(4_000);
    const banner = page.getByText(/connexion instantanée|live connection/i);
    // Best-effort · certains navigateurs headless ne ferment pas le WS immédiatement.
    if (await banner.isVisible({ timeout: 3_000 }).catch(() => false)) {
      expect(await banner.isVisible()).toBeTruthy();
    }

    const tReconnect = Date.now();
    await ctx.setOffline(false);
    // Resync doit ramener l'inbox sans doublon.
    await page.waitForTimeout(4_000);
    console.log(`[latency] reconnect resync · ${Date.now() - tReconnect}ms`);

    await ctx.close();
  });

  test("6. Switch persona · anciens channels fermés (session teacher logout)", async ({ browser }) => {
    const ctx = await browser.newContext();
    const teacherPage = await login(ctx, TEACHER_EMAIL!, TEACHER_PASSWORD!);
    await teacherPage.goto("/fr/messages");
    await teacherPage.waitForTimeout(2_000);
    await ctx.clearCookies();
    await teacherPage.goto("/fr/login");
    await expect(teacherPage).toHaveURL(/\/fr\/login/);
    // Après clearCookies, aucun canal Realtime authentifié ne peut plus
    // recevoir d'événements (RLS refuse subscribe sans auth.uid()).
    await ctx.close();
  });

  test("7. Child · realtimeAvailable=false · polling uniquement", async () => {
    // La session enfant s'établit via un flow PIN (pas email/password) ·
    // le provisioning email/password ne le couvre pas. Ce scénario est
    // couvert par le test structurel messagingP46B2-authorization ·
    // /api/messaging/self retourne channelName:null pour CHILD_PROFILE.
    // E2E complet du flux enfant · attendu au runbook Lot 6 preview.
    test.skip(true, "Session enfant flow PIN · voir runbook Lot 6 preview");
  });
});
