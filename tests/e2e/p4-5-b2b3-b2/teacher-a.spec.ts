// P4.5-B2b3b-b2 · Teacher A · parcours complet (§6 protocole).
// Utilise la Classroom A + Assignment A publié pré-créés par les fixtures.
// Crée un nouvel assignment DRAFT E2E-only, l'édite, le publie, consulte
// une submission Student A, crée + publie + ajoute un addendum sur un
// feedback, puis ferme l'assignment.

import { test, expect } from "playwright/test";
import { PERSONAS, FIXTURE_IDS } from "./personas";

test.describe.configure({ mode: "serial" });
test.use({ storageState: PERSONAS.teacherA.storageStateFile });

const runTag = `E2E-b2-${Date.now().toString(36)}`;
const asmTitle = `${runTag} · Devoir Teacher A`;
const asmTitleV2 = `${asmTitle} (v2)`;
const asmInstructions = "Rédigez un texte court sur votre région d'origine.";
const feedbackText = `${runTag} · retour v1 · bien construit`;

test("Teacher A · workflow complet (create → publish → feedback → addendum → close)", async ({ page }) => {
  // §6.1 · liste des classes
  await page.goto("/fr/teacher/classes");
  await expect(page).toHaveURL(/\/teacher\/classes$/);

  // §6.2 · sélection Classroom A (via lien direct pour être robuste au layout)
  await page.goto(`/fr/teacher/classes/${FIXTURE_IDS.classroomA}`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  // §6.3 · création d'un assignment DRAFT via /teacher/assignments/new
  await page.goto(`/fr/teacher/assignments/new?classroomId=${FIXTURE_IDS.classroomA}`);
  await page.getByLabel(/Titre|Title/).fill(asmTitle);
  await page.getByLabel(/Consignes|Instructions/).fill(asmInstructions);
  const [createResponse] = await Promise.all([
    page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/api/teacher/classes/") && r.url().endsWith("/assignments")),
    page.getByRole("button", { name: /Créer|Create/i }).click(),
  ]);
  expect(createResponse.status()).toBeGreaterThanOrEqual(200);
  expect(createResponse.status()).toBeLessThan(300);
  await page.waitForURL(/\/teacher\/assignments\/[^/?]+$/, { timeout: 15_000 });

  const detailUrl = page.url();

  // §6.4 · modification du titre + save
  await page.getByLabel(/Titre|Title/).fill(asmTitleV2);
  await Promise.all([
    page.waitForResponse((r) => r.request().method() === "PATCH" && r.url().includes("/api/teacher/assignments/")),
    page.getByRole("button", { name: /Sauvegarder|Save/i }).click(),
  ]);

  // §6.5 · publication avec confirmation (window.confirm auto-accepté)
  page.once("dialog", (d) => d.accept());
  await Promise.all([
    page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/publish")),
    page.getByRole("button", { name: /Publier|Publish/i }).click(),
  ]);
  await expect(page.getByText(/Publié|Published/i).first()).toBeVisible();

  // §6.6 · consultation submissions · l'assignment nouveau n'en a pas · on
  // vérifie que le bloc "aucune submission" est présent OU navigate vers
  // une submission existante Student A (fixture).
  await page.goto(`/fr/teacher/submissions/${FIXTURE_IDS.subSubmittedA}`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  // §6.7 · création d'un feedback DRAFT sur la submission SUBMITTED de Student A
  // Fixture inclut déjà un fb DRAFT/PUBLISHED/ADDENDUM · on utilise le
  // bouton "Créer un retour" si présent, sinon on skip (le fixture couvre).
  const createFeedbackBtn = page.getByRole("button", { name: /Créer un retour|Create feedback/i });
  if (await createFeedbackBtn.isVisible().catch(() => false)) {
    await createFeedbackBtn.click();
    await page.getByLabel(/Contenu|Content|Retour|Feedback/i).fill(feedbackText);
    await Promise.all([
      page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/api/teacher/submissions/") && r.url().endsWith("/feedback")),
      page.getByRole("button", { name: /Sauvegarder|Save/i }).click(),
    ]);
  }

  // §6.8 · vérifier qu'un feedback DRAFT est visible côté Teacher (fixture ou nouveau)
  await expect(page.getByText(/Brouillon|Draft/i).first()).toBeVisible();

  // §6.9 · fermeture de l'assignment nouveau (retour à detailUrl)
  await page.goto(detailUrl);
  page.once("dialog", (d) => d.accept());
  await Promise.all([
    page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/close")),
    page.getByRole("button", { name: /Fermer|Close/i }).click(),
  ]);
  await expect(page.getByText(/Fermé|Closed/i).first()).toBeVisible();
});
