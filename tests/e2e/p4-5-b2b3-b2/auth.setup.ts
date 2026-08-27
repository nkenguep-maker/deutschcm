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
  const syncResponsePromise = page.waitForResponse(
    (response) => new URL(response.url()).pathname === "/api/auth/sync" && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: /Ouvrir ma maison|Come in/i }).click();
  const syncResponse = await syncResponsePromise;
  expect(syncResponse.status(), `expected successful auth sync for ${email}`).toBe(200);
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

  // Un cookie présent n'est pas une preuve de session utilisable. Vérifier
  // le serveur protège contre une régression SSR, un token invalide ou un
  // profil Prisma désaligné avant de réutiliser le storageState.
  let profile: { email?: string } | null = null;
  let lastStatus: number | null = null;
  // Auth peut avoir une très courte fenêtre de propagation après createUser +
  // signInWithPassword sur P-1. Le storageState n'est écrit qu'après une
  // réponse serveur authentifiée correspondant bien à l'email demandé.
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const me = await page.goto("/api/me", { waitUntil: "domcontentloaded" });
    lastStatus = me?.status() ?? null;
    if (lastStatus === 200) {
      profile = await me?.json() as { email?: string };
      if (profile.email?.toLowerCase() === email.toLowerCase()) break;
      profile = null;
    }
    await page.waitForTimeout(250);
  }
  expect(lastStatus, `expected authenticated /api/me for ${email}`).toBe(200);
  expect(profile?.email?.toLowerCase(), `expected /api/me identity for ${email}`).toBe(email.toLowerCase());
  await page.context().storageState({ path: storageStateFile });
}

for (const persona of Object.values(PERSONAS)) {
  setup(`login ${persona.key}`, async ({ page }) => {
    await signIn(persona.email, persona.storageStateFile, page);
  });
}
