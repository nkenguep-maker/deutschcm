// P4.5-B2b3b-b2 · Student A · parcours complet (§7 protocole).
// Le fixture pré-crée un assignment PUBLISHED (asmPubA), un draft v2 et une
// v1 supersedée. Le spec vérifie la lecture, ajoute un draft éphémère sur
// asmPubB (Assignment B publié) via API pour un contexte propre à l'E2E.
//
// Note · Student A n'a PAS d'enrollment sur Classroom B (fixture) donc la
// création directe sur asmPubB doit échouer via UI. On teste plutôt :
//   1. Lecture liste (asmPubA + asmClosedA visibles, asmDraftA invisible)
//   2. Ouverture asmPubA · voit versions v1 SUPERSEDED + v2 DRAFT
//   3. Ouverture submission DRAFT · éditable + Save + Submit
//   4. Ouverture submission SUBMITTED (asmClosedA) · lecture seule, feedbacks visibles

import { test, expect } from "playwright/test";
import { PERSONAS, FIXTURE_IDS } from "./personas";

test.describe.configure({ mode: "serial" });
test.use({ storageState: PERSONAS.studentA.storageStateFile });

test("Student A · liste devoirs · PUBLISHED/CLOSED uniquement, jamais DRAFT", async ({ page }) => {
  await page.goto("/fr/student/assignments");
  await expect(page.getByRole("heading", { name: /Mes devoirs|My assignments/i })).toBeVisible();
  // asmPubA (Devoir A · publié) doit apparaître
  await expect(page.getByRole("link", { name: /Devoir A · publié/ })).toBeVisible();
  // asmClosedA visible
  await expect(page.getByRole("link", { name: /Devoir A · fermé/ })).toBeVisible();
  // asmDraftA JAMAIS visible
  await expect(page.getByRole("link", { name: /Devoir A · brouillon/ })).toHaveCount(0);
  // asmPubB (Classroom B, aucun enrollment) JAMAIS visible
  await expect(page.getByRole("link", { name: /Devoir B · publié/ })).toHaveCount(0);
});

test("Student A · ouverture assignment · versions du Student affichées", async ({ page }) => {
  await page.goto(`/fr/student/assignments/${FIXTURE_IDS.asmPubA}`);
  await expect(page.getByRole("heading", { level: 1, name: /Devoir A · publié/ })).toBeVisible();
  // Section versions
  await expect(page.getByRole("heading", { name: /Mes versions|My versions/i })).toBeVisible();
  // v1 SUPERSEDED + v2 DRAFT visibles (fixture)
  await expect(page.getByText(/Version 1/).first()).toBeVisible();
  await expect(page.getByText(/Version 2/).first()).toBeVisible();
});

test("Student A · ouverture submission DRAFT (v2) · éditable + Save + Submit visibles", async ({ page }) => {
  await page.goto(`/fr/student/submissions/${FIXTURE_IDS.subDraftA}`);
  // textarea visible
  const textarea = page.locator("textarea").first();
  await expect(textarea).toBeVisible();
  await expect(textarea).toBeEditable();
  // boutons Save + Submit visibles
  await expect(page.getByRole("button", { name: /Sauvegarder|Save/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Soumettre|Submit/i })).toBeVisible();
  // Compteur visible
  await expect(page.getByText(/Nombre de mots|Word count/i)).toBeVisible();
});

test("Student A · submission SUBMITTED (asmClosedA v1) · lecture seule + feedbacks PUBLISHED/ADDENDUM", async ({ page }) => {
  await page.goto(`/fr/student/submissions/${FIXTURE_IDS.subSubmittedA}`);
  // Aucun textarea (readonly branch)
  await expect(page.locator("textarea")).toHaveCount(0);
  // Aucun bouton Save/Submit
  await expect(page.getByRole("button", { name: /Sauvegarder|Save|Soumettre|Submit/i })).toHaveCount(0);
  // Section Retours du professeur
  await expect(page.getByRole("heading", { name: /Retours du professeur|Teacher feedback/i })).toBeVisible();
  // fbPublishedA visible ("Bien !") + fbAddendumA visible ("Précision : travaille les articles.")
  await expect(page.getByText(/Bien !/)).toBeVisible();
  await expect(page.getByText(/Précision : travaille les articles/)).toBeVisible();
  // fbDraftA JAMAIS visible (le fixture le contient · l'UI doit le masquer)
  await expect(page.getByText(/Brouillon de retour A/)).toHaveCount(0);
});

test("Student A · sauvegarde draft (API call PATCH)", async ({ page }) => {
  await page.goto(`/fr/student/submissions/${FIXTURE_IDS.subDraftA}`);
  const textarea = page.locator("textarea").first();
  const now = new Date().toISOString();
  await textarea.fill(`Draft E2E sauvegardé à ${now}`);
  const [patchRes] = await Promise.all([
    page.waitForResponse((r) => r.request().method() === "PATCH" && r.url().includes("/api/student/submissions/")),
    page.getByRole("button", { name: /^Sauvegarder$|^Save$/i }).click(),
  ]);
  expect(patchRes.status()).toBe(200);
});
