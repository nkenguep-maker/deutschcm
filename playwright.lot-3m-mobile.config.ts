// Lot 3M · config Playwright minimale pour les smoke viewport (login public).
// Réutilise strictement le wrapper P-1 (aucune fuite prod). Serveur next start
// sur build production précompilé (cf. p4-5-b2 pour la doctrine).

import { defineConfig, devices } from "playwright/test";

const PORT = process.env.PLAYWRIGHT_PORT || "3110";
const BASE_URL = `http://127.0.0.1:${PORT}`;

// Flag off suffit — les pages publiques ne dépendent pas du redesign flag.
const webServerCommand = [
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
].join(" ");

export default defineConfig({
  testDir: "tests/e2e/lot-3m-mobile",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { outputFolder: "playwright-report/lot-3m-mobile", open: "never" }]],
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
  webServer: {
    command: webServerCommand,
    port: Number(PORT),
    timeout: 120_000,
    reuseExistingServer: false,
    stdout: "ignore",
    stderr: "pipe",
  },
});
