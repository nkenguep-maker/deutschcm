// P4.5-B2b3b-b2 · Playwright config dédiée à la validation navigateur
// Monde (Teacher + Student). Isolation stricte P-1 · le serveur Next
// dev/start est TOUJOURS lancé via `scripts/test-baseline/run-p4-5-b2-p1.mjs`
// qui charge `.env.p1-baseline` et refuse toute référence prod.
//
// Doctrine · workers=1, fullyParallel=false, retries=0 · les fixtures P-1
// sont partagées et certaines specs mutent l'état (draft/submit/newVersion).
// La sérialisation est nécessaire pour éviter les races et rendre les
// échecs reproductibles.
//
// Deux commandes d'exécution (npm scripts) ·
//   test:e2e:b2           → serveur flag-on, tous specs sauf flag-off/landing-flag-off
//   test:e2e:b2:flag-off  → serveur flag-off, uniquement le spec `flag-off.spec.ts`
// Le webServer est démarré indépendamment pour chaque commande (`reuseExistingServer: false`).

import { defineConfig, devices } from "playwright/test";

const PORT = process.env.PLAYWRIGHT_PORT || "3100";
const BASE_URL = `http://127.0.0.1:${PORT}`;

// Le pattern des specs est ajusté via la variable PW_TESTMATCH pour permettre
// une invocation ciblée (flag-off vs reste). Défaut · tous sauf flag-off.
const testMatch = process.env.PW_TESTMATCH ?? "**/tests/e2e/p4-5-b2b3-b2/!(flag-off).spec.ts";

// Le flag est piloté par le wrapper P-1. `PW_FLAG=on|off` permet à la config
// de choisir la commande webServer et son storageState.
const flag = (process.env.PW_FLAG ?? "on") === "off" ? "off" : "on";
// P4.5-B2b3b-b2 · le serveur est TOUJOURS un `next start` sur un build
// production préalable (§ recommandation user). Le mode `next dev` sous
// Playwright headless Chromium exhibe un défaut d'hydratation React
// (le handleLogin ne s'exécute pas · form submit natif GET). En prod
// build, l'hydratation fonctionne correctement.
const webServerCommand = [
  "node",
  "scripts/test-baseline/run-p4-5-b2-p1.mjs",
  "--flag",
  flag,
  "--",
  "npx",
  "next",
  "start",
  "-p",
  PORT,
].join(" ");

export default defineConfig({
  testDir: ".",
  testMatch,
  timeout: 45_000,
  expect: { timeout: 8_000 },

  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report/p4-5-b2b3-b2", open: "never" }],
    ["json", { outputFile: "playwright-report/p4-5-b2b3-b2/results.json" }],
  ],
  outputDir: "test-results/p4-5-b2b3-b2",

  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 8_000,
    navigationTimeout: 15_000,
  },

  projects: [
    // Auth setup crée les storageState réels via login UI. Doit tourner en 1er.
    {
      name: "setup",
      testMatch: "**/tests/e2e/p4-5-b2b3-b2/auth.setup.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium",
      testIgnore: [
        "**/tests/e2e/p4-5-b2b3-b2/auth.setup.ts",
      ],
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        // storageState est sélectionné explicitement par chaque spec via
        // `test.use({ storageState: ... })`. Aucun default global · les
        // specs anonymous (login, landing, flag-off) doivent démarrer
        // sans cookies.
      },
    },
  ],

  webServer: {
    command: webServerCommand,
    url: `${BASE_URL}/fr`,
    reuseExistingServer: false,
    timeout: 90_000,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      // La config passe uniquement le port au webServer · l'environnement
      // Supabase/flag est injecté par le wrapper P-1 lui-même. Ne JAMAIS
      // ajouter ici de SUPABASE_* ou de YEMA_* · le wrapper est autorité.
      PORT,
    },
  },
});
