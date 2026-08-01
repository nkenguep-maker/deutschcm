// P4.6-C.3 · config Playwright · E2E audio UI adulte P-1.
//
// Pré-requis stricts ·
//   - migration P4.6-C.1 appliquée sur P-1 (déjà)
//   - bucket yema-messaging-audio-private créé (script ensure)
//   - YEMA_MESSAGING_ENABLED=true (wrapper --flag on)
//   - YEMA_MESSAGE_AUDIO_ENABLED=true (set par l'orchestrateur)
//   - E2E_TEACHER/STUDENT/OUTSIDER_EMAIL+PASSWORD fournis
//   - Serveur next start lancé par l'orchestrateur audio E2E

import { defineConfig, devices } from "playwright/test";

const PORT = process.env.PLAYWRIGHT_PORT || "3160";
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "tests/e2e/p4-6-c-audio",
  testIgnore: ["**/support/**"],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report/p4-6-c-audio-ui", open: "never" }],
  ],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
