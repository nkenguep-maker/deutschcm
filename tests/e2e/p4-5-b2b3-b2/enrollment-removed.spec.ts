// P4.5-B2b3b-b2 · enrollment REMOVED (§11).
// Le fixture crée student_removed avec enrollment isActive=false sur Classroom A.
// Vérifie · liste vide, accès direct → not-found canonique.
//
// SPEC MUTABLE · doit tourner en fin de séquence Student (après les autres
// specs Student).

import { test, expect } from "playwright/test";
import { PERSONAS, FIXTURE_IDS } from "./personas";

test.describe.configure({ mode: "serial" });
test.use({ storageState: PERSONAS.studentRemoved.storageStateFile });

test("Student REMOVED · liste vide (aucun assignment)", async ({ page }) => {
  await page.goto("/fr/student/assignments");
  // Aucun lien vers un assignment (fixture asmPubA/asmClosedA absents)
  await expect(page.getByRole("link", { name: /Devoir A · publié/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Devoir A · fermé/ })).toHaveCount(0);
  await expect(page.getByText(/Aucun devoir publié pour le moment|No published assignments yet/i)).toBeVisible();
});

test("Student REMOVED · accès direct assignment A · not-found", async ({ page }) => {
  const resp = await page.goto(`/fr/student/assignments/${FIXTURE_IDS.asmPubA}`);
  expect(resp?.status()).toBe(404);
});

test("Student REMOVED · accès direct submission A (Student A) · not-found", async ({ page }) => {
  // La submission appartient à Student A · student_removed n'y a jamais eu accès.
  const resp = await page.goto(`/fr/student/submissions/${FIXTURE_IDS.subDraftA}`);
  expect(resp?.status()).toBe(404);
});
