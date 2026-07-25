// P4.5-B2b3b-b2 · setup Playwright · crée les storageStates réels pour les 10
// personas via login UI (aucun contournement de cookies · brief §5).
// Le mot de passe est fourni par le wrapper P-1 · les Auth users doivent avoir
// été créés au préalable par `p4-5-b-auth-fixtures.mjs`.
//
// Chaque persona ouvre /fr/login, remplit email + mot de passe, soumet, attend
// une redirection hors /login, puis persiste le cookie de session dans le
// fichier storageState correspondant. Aucun fichier storageState n'est commit.

import { test as setup, expect } from "playwright/test";
import { mkdirSync } from "node:fs";
import { PERSONAS, requirePassword } from "./personas";

const password = requirePassword();

async function signIn(email: string, storageStateFile: string, page: import("playwright/test").Page) {
  mkdirSync(".playwright/.auth", { recursive: true });
  await page.goto("/fr/login", { waitUntil: "domcontentloaded" });
  // Attendre l'hydratation React (form onSubmit doit être branché) sinon
  // click submit → form GET natif qui repose sur /login sans handler ·
  // aucun appel Supabase n'est déclenché.
  await page.waitForLoadState("networkidle", { timeout: 15_000 });
  await page.getByLabel(/^Email$/).fill(email);
  await page.getByLabel(/Mot de passe|Password/).fill(password);
  await page.getByRole("button", { name: /Ouvrir ma maison|Come in/i }).click();
  // Le handler `handleLogin` fait signInWithPassword puis router.push
  // vers /dashboard. Certains personas (TEACHER, CENTER, no-role) ne
  // peuvent pas atteindre /dashboard et retombent sur /login via proxy.
  // On teste ce qu'on veut vraiment · le cookie sb-* de session est posé.
  await page.waitForFunction(
    () => document.cookie.split("; ").some((c) => c.startsWith("sb-")),
    null,
    { timeout: 20_000 },
  );
  const cookies = await page.context().cookies();
  const sbCookie = cookies.find((c) => c.name.startsWith("sb-"));
  expect(sbCookie, `expected sb-* cookie for ${email}`).toBeTruthy();
  await page.context().storageState({ path: storageStateFile });
}

for (const persona of Object.values(PERSONAS)) {
  setup(`login ${persona.key}`, async ({ page }) => {
    await signIn(persona.email, persona.storageStateFile, page);
  });
}
