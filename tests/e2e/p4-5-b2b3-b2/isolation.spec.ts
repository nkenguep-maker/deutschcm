// P4.5-B2b3b-b2 · isolation Teacher A/B + Student A/B (§9 + §10).
// Teacher B ne doit voir ni ouvrir aucune ressource A · Student B non plus.
// Vérifie via URLs directes que le rendu final est not-found canonique
// (aucune donnée A dans le HTML, aucun titre A, aucun toast avec un id A).

import { test, expect } from "playwright/test";
import { PERSONAS, FIXTURE_IDS } from "./personas";

async function assertNotFoundOrForbidden(page: import("playwright/test").Page) {
  const status = page.url();
  // La page peut soit renvoyer un HTML notFound canonique, soit rediriger
  // vers /fr (accueil). Ce qui est INTERDIT · titre A, sub A, feedback A,
  // contenu de submission/feedback A. Les IDs eux-mêmes apparaissent dans
  // l'URL (canonical link, __NEXT_DATA__) · ils ne sont pas un leak (URL
  // publiquement constructible), on ne les liste PAS ici.
  const html = await page.content();
  for (const forbidden of [
    "Devoir A · brouillon",
    "Devoir A · publié",
    "Devoir A · fermé",
    "Brouillon A · v2",
    "Réponse A · v1 finalisée",
    "Réponse A · v1 supersedée",
    "Bien !",
    "Précision : travaille les articles",
  ]) {
    expect(html, `URL ${status} must not leak fixture A data · found: ${forbidden}`).not.toContain(forbidden);
  }
}

test.describe("Teacher B · isolation vs ressources A", () => {
  test.use({ storageState: PERSONAS.teacherB.storageStateFile });

  for (const [label, path] of [
    ["assignment A DRAFT", `/fr/teacher/assignments/${FIXTURE_IDS.asmDraftA}`],
    ["assignment A PUBLISHED", `/fr/teacher/assignments/${FIXTURE_IDS.asmPubA}`],
    ["assignment A CLOSED", `/fr/teacher/assignments/${FIXTURE_IDS.asmClosedA}`],
    ["submission A SUBMITTED", `/fr/teacher/submissions/${FIXTURE_IDS.subSubmittedA}`],
    ["submission A DRAFT (Student A)", `/fr/teacher/submissions/${FIXTURE_IDS.subDraftA}`],
  ] as const) {
    test(`Teacher B → ${label} · not-found / aucune fuite`, async ({ page }) => {
      const resp = await page.goto(path);
      // Not-found canonique attendu · HTTP 404 idéalement (Next notFound()).
      // Certains setups peuvent renvoyer 200 avec le composant not-found · on
      // vérifie l'absence de donnée A dans le HTML.
      if (resp) expect([200, 404]).toContain(resp.status());
      await assertNotFoundOrForbidden(page);
    });
  }
});

test.describe("Student B · isolation vs ressources A", () => {
  test.use({ storageState: PERSONAS.studentB.storageStateFile });

  test("Student B · liste · aucun assignment A visible", async ({ page }) => {
    await page.goto("/fr/student/assignments");
    await expect(page.getByRole("link", { name: /Devoir A · publié/ })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /Devoir A · fermé/ })).toHaveCount(0);
    // Student B est enrollé sur Classroom B · voit asmPubB
    await expect(page.getByRole("link", { name: /Devoir B · publié/ })).toBeVisible();
  });

  for (const [label, path] of [
    ["assignment A PUBLISHED", `/fr/student/assignments/${FIXTURE_IDS.asmPubA}`],
    ["assignment A CLOSED", `/fr/student/assignments/${FIXTURE_IDS.asmClosedA}`],
    ["submission A DRAFT (Student A)", `/fr/student/submissions/${FIXTURE_IDS.subDraftA}`],
    ["submission A SUBMITTED (Student A)", `/fr/student/submissions/${FIXTURE_IDS.subSubmittedA}`],
  ] as const) {
    test(`Student B → ${label} · not-found / aucune fuite`, async ({ page }) => {
      const resp = await page.goto(path);
      if (resp) expect([200, 404]).toContain(resp.status());
      await assertNotFoundOrForbidden(page);
    });
  }
});
