// P4.6 Lot 6 · config Playwright pour la smoke Preview P-1.
//
// Usage :
//   # Lancer contre un serveur next start local (via wrapper P-1) :
//   npx playwright test --config playwright.lot-6-preview.config.ts
//
//   # Ou contre une Preview Vercel déployée · définir BASE_URL :
//   PLAYWRIGHT_BASE_URL=https://deutschcm-xxx.vercel.app \
//     npx playwright test --config playwright.lot-6-preview.config.ts
//
// Aucun secret n'est chargé par cette config · l'auth complète des 9
// personas est faite via un flow séparé (voir runbook).

import { defineConfig, devices } from "playwright/test";

const PORT = process.env.PLAYWRIGHT_PORT || "3120";
const CUSTOM_BASE = process.env.PLAYWRIGHT_BASE_URL;
const BASE_URL = CUSTOM_BASE || `http://127.0.0.1:${PORT}`;

// Serveur local uniquement si BASE_URL absente · sinon on hit la Preview.
const useLocalServer = !CUSTOM_BASE;
const webServerCommand = useLocalServer
  ? [
      "node",
      "scripts/test-baseline/run-p4-5-b2-p1.mjs",
      "--flag",
      "off",
      "--",
      "npx",
      "next",
      "start",
      "-p",
      PORT,
    ].join(" ")
  : undefined;

export default defineConfig({
  testDir: "tests/e2e/lot-6-preview-personas",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report/lot-6-preview", open: "never" }],
  ],
  use: {
    baseURL: BASE_URL,
    trace: "off",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  ...(useLocalServer
    ? {
        webServer: {
          command: webServerCommand!,
          port: Number(PORT),
          timeout: 120_000,
          reuseExistingServer: false,
          stdout: "ignore",
          stderr: "pipe",
        },
      }
    : {}),
});
