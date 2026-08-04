// P4.6-B.2 · config Playwright · deux contextes navigateur pour valider
// Realtime privé + isolation + typing éphémère + Presence anonyme.
//
// Usage ·
//   # Local server via wrapper P-1, flag messaging ON :
//   npx playwright test --config playwright.p4-6-b-2-realtime.config.ts
//
// Pré-requis stricts ·
//   - Migration 20260731000003 appliquée sur P-1 (Supabase Dashboard SQL Editor)
//   - YEMA_MESSAGING_ENABLED=true (fait par le wrapper --flag on)
//   - Deux utilisateurs test provisionnés en P-1 (Teacher + Student Monde)
//     appartenant à la même conversation WORLD_STUDENT_TEACHER
//   - Credentials fournis via env : E2E_TEACHER_EMAIL, E2E_TEACHER_PASSWORD,
//                                    E2E_STUDENT_EMAIL, E2E_STUDENT_PASSWORD
//   - Sinon le test skip automatiquement (fail-open) avec message explicite.

import { defineConfig, devices } from "playwright/test";

const PORT = process.env.PLAYWRIGHT_PORT || "3130";
const CUSTOM_BASE = process.env.PLAYWRIGHT_BASE_URL;
const BASE_URL = CUSTOM_BASE || `http://127.0.0.1:${PORT}`;

const useLocalServer = !CUSTOM_BASE;
const webServerCommand = useLocalServer
  ? [
      "node",
      "scripts/test-baseline/run-p4-5-b2-p1.mjs",
      "--flag",
      "on",
      "--",
      "npx",
      "next",
      "start",
      "-p",
      PORT,
    ].join(" ")
  : undefined;

export default defineConfig({
  testDir: "tests/e2e/p4-6-b-2-realtime",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report/p4-6-b-2-realtime", open: "never" }],
  ],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
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
          timeout: 180_000,
          reuseExistingServer: false,
          stdout: "ignore",
          stderr: "pipe",
        },
      }
    : {}),
});
