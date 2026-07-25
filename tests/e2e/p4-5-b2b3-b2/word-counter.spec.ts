// P4.5-B2b3b-b2 · compteur canonique 1000 mots (§8 protocole).
// Vérifie 5 seuils UI (0, 1, 999, 1000, 1001) sur le draft Student A.
// Le serveur doit également refuser 1001 mots (defense-in-depth) via PATCH.

import { test, expect } from "playwright/test";
import { PERSONAS, FIXTURE_IDS } from "./personas";

test.describe.configure({ mode: "serial" });
test.use({ storageState: PERSONAS.studentA.storageStateFile });

const MAX = 1000;

function makeText(nWords: number): string {
  return Array.from({ length: nWords }, (_, i) => `mot${i}`).join(" ");
}

test.beforeEach(async ({ page }) => {
  await page.goto(`/fr/student/submissions/${FIXTURE_IDS.subDraftA}`);
});

for (const n of [0, 1, 999, MAX]) {
  test(`compteur · ${n} mots · Save autorisé`, async ({ page }) => {
    const textarea = page.locator("textarea").first();
    await textarea.fill(makeText(n));
    // Le compteur affiche `n of 1000` ou similaire
    await expect(page.getByTestId("word-count")).toContainText(`${n}`);
    const saveBtn = page.getByRole("button", { name: /^Sauvegarder$|^Save$/i });
    if (n > 0) await expect(saveBtn).toBeEnabled();
    else await expect(saveBtn).toBeEnabled(); // save vide autorisé (nettoie le draft)
  });
}

test("compteur · 1001 mots · UI bloque save + submit disabled", async ({ page }) => {
  const textarea = page.locator("textarea").first();
  await textarea.fill(makeText(MAX + 1));
  await expect(page.getByTestId("word-count")).toContainText(`${MAX + 1}`);
  // Message d'alerte présent
  await expect(page.getByText(/Limite dépassée|Limit exceeded/i)).toBeVisible();
  const saveBtn = page.getByRole("button", { name: /^Sauvegarder$|^Save$/i });
  const submitBtn = page.getByRole("button", { name: /Soumettre|Submit/i });
  await expect(saveBtn).toBeDisabled();
  await expect(submitBtn).toBeDisabled();
});

test("compteur · defense-in-depth serveur · PATCH avec 1001 mots retourné 4xx", async ({ request }) => {
  const oversized = makeText(MAX + 1);
  const res = await request.patch(`/api/student/submissions/${FIXTURE_IDS.subDraftA}`, {
    data: { writtenContent: oversized },
    failOnStatusCode: false,
  });
  expect(res.status()).toBeGreaterThanOrEqual(400);
  expect(res.status()).toBeLessThan(500);
  const body = await res.json().catch(() => ({}));
  expect(JSON.stringify(body)).toMatch(/submission_too_long|exceeds 1000/);
});

test("compteur · aria-live présent (accessibilité SR)", async ({ page }) => {
  const status = page.locator("[aria-live='polite']").first();
  await expect(status).toBeVisible();
});
