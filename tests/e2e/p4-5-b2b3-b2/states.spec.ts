// P4.5-B2b3b-b2 · États UI réels (§12).
// Couvre · anonymous, role_absent, not-found, feature_disabled est testé
// par flag-off.spec.ts (spec séparée + serveur séparé).

import { test, expect } from "playwright/test";
import { PERSONAS } from "./personas";

async function expectCanonicalNotFound(page: import("playwright/test").Page, response: import("playwright/test").Response | null) {
  // App Router may stream `notFound()` with HTTP 200. In that case the rendered
  // 404 boundary and `noindex` are the security-relevant contract.
  if (response?.status() === 404) return;

  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: /La porte que vous cherchez|The door you are looking for/i })).toBeVisible();
  await expect(page.locator("meta[name='robots']")).toHaveAttribute("content", /noindex/i);
}

test.describe("État anonymous · redirect /login", () => {
  test("Teacher /assignments anonyme · redirect", async ({ page }) => {
    await page.goto("/fr/teacher/assignments");
    await expect(page).toHaveURL(/\/login/);
  });
  test("Student /assignments anonyme · redirect", async ({ page }) => {
    await page.goto("/fr/student/assignments");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("État role_absent · placeholder distinct de feature_disabled", () => {
  test("Student · rôle ADMIN sans STUDENT/LEARNER (center_admin) · placeholder role_absent", async ({ browser }) => {
    // center_admin est le seul persona avec role != STUDENT (ADMIN). Les
    // `yema_admin_no_bind` / `student_no_enroll` ont `role=STUDENT` en base
    // (fixture) donc passent `resolveStudentActor` avec 0 enrollments →
    // liste vide (pas role_absent).
    const context = await browser.newContext({ storageState: PERSONAS.centerAdmin.storageStateFile });
    const page = await context.newPage();
    await page.goto("/fr/student/assignments");
    // Placeholder canonique Student · message role_absent explicite.
    await expect(page.getByText(/pas encore inscrit|not yet enrolled/i)).toBeVisible();
    await context.close();
  });
  test("Teacher sans binding Teacher (teacher_no_bind) · placeholder role_absent", async ({ browser }) => {
    const context = await browser.newContext({ storageState: PERSONAS.teacherNoBind.storageStateFile });
    const page = await context.newPage();
    await page.goto("/fr/teacher/assignments");
    // Placeholder Teacher role_absent (heading H1 visible avec titre "Espace enseignant").
    await expect(page.getByRole("heading", { level: 1, name: /Espace enseignant|Teacher/i })).toBeVisible();
    await context.close();
  });
});

test.describe("État not-found · id inexistant → 404 canonique", () => {
  test("Student · submission id inexistant", async ({ browser }) => {
    const context = await browser.newContext({ storageState: PERSONAS.studentA.storageStateFile });
    const page = await context.newPage();
    const resp = await page.goto("/fr/student/submissions/does-not-exist-p4-5-b2");
    await expectCanonicalNotFound(page, resp);
    await context.close();
  });
  test("Student · assignment id inexistant", async ({ browser }) => {
    const context = await browser.newContext({ storageState: PERSONAS.studentA.storageStateFile });
    const page = await context.newPage();
    const resp = await page.goto("/fr/student/assignments/does-not-exist-p4-5-b2");
    await expectCanonicalNotFound(page, resp);
    await context.close();
  });
});
