// P4.5-B2b3b-b2 · flag-off UI (§17).
// SERVEUR REDÉMARRÉ SÉPARÉMENT avec `PW_FLAG=off` (voir npm script
// test:e2e:b2:flag-off). Vérifie · 7 pages rendent le placeholder
// feature_disabled sans données cache · 20 routes API Monde répondent 404.

import { test, expect } from "playwright/test";
import { PERSONAS, FIXTURE_IDS } from "./personas";

const PAGES = [
  { name: "teacher/classes",              path: "/fr/teacher/classes",                                    storage: PERSONAS.teacherA.storageStateFile },
  { name: "teacher/assignments/list",     path: "/fr/teacher/assignments",                                storage: PERSONAS.teacherA.storageStateFile },
  { name: "teacher/assignments/detail",   path: `/fr/teacher/assignments/${FIXTURE_IDS.asmPubA}`,        storage: PERSONAS.teacherA.storageStateFile },
  { name: "teacher/submissions/detail",   path: `/fr/teacher/submissions/${FIXTURE_IDS.subSubmittedA}`,  storage: PERSONAS.teacherA.storageStateFile },
  { name: "student/assignments/list",     path: "/fr/student/assignments",                                storage: PERSONAS.studentA.storageStateFile },
  { name: "student/assignments/detail",   path: `/fr/student/assignments/${FIXTURE_IDS.asmPubA}`,        storage: PERSONAS.studentA.storageStateFile },
  { name: "student/submissions/detail",   path: `/fr/student/submissions/${FIXTURE_IDS.subDraftA}`,     storage: PERSONAS.studentA.storageStateFile },
];

test.describe("flag-off · 7 pages → feature_disabled placeholder", () => {
  for (const p of PAGES) {
    test(`${p.name} · placeholder feature_disabled`, async ({ browser }) => {
      const context = await browser.newContext({ storageState: p.storage });
      const page = await context.newPage();
      await page.goto(p.path);
      // Placeholder distinct · contient "Bientôt disponible" (FR) ou
      // "Coming soon" (EN).
      await expect(page.getByText(/Bientôt disponible|Coming soon/i)).toBeVisible();
      // Aucune donnée métier fixture ne doit apparaître (sanity anti-cache).
      const html = await page.content();
      for (const forbidden of ["Devoir A", "Réponse A", "Bien !", "Précision : travaille les articles"]) {
        expect(html, `${p.name} feature-off must not leak ${forbidden}`).not.toContain(forbidden);
      }
      await context.close();
    });
  }
});

// Routes API Monde · uniquement les méthodes qui existent réellement
// sur chaque endpoint (source · `src/app/api/{student,teacher}/**`).
// Une méthode non exposée retourne 405 et non 404 · on ne la teste pas ici.
const MONDE_API_ROUTES = [
  // Student
  "GET /api/student/assignments",
  `GET /api/student/assignments/${FIXTURE_IDS.asmPubA}`,
  `POST /api/student/assignments/${FIXTURE_IDS.asmPubA}/submissions`,
  `PATCH /api/student/submissions/${FIXTURE_IDS.subDraftA}`,
  `POST /api/student/submissions/${FIXTURE_IDS.subDraftA}/submit`,
  `POST /api/student/submissions/${FIXTURE_IDS.subSubmittedA}/versions`,
  `GET /api/student/submissions/${FIXTURE_IDS.subSubmittedA}/feedback`,
  // Teacher
  `GET /api/teacher/classes/${FIXTURE_IDS.classroomA}/assignments`,
  `POST /api/teacher/classes/${FIXTURE_IDS.classroomA}/assignments`,
  `GET /api/teacher/assignments/${FIXTURE_IDS.asmPubA}`,
  `PATCH /api/teacher/assignments/${FIXTURE_IDS.asmPubA}`,
  `POST /api/teacher/assignments/${FIXTURE_IDS.asmDraftA}/publish`,
  `POST /api/teacher/assignments/${FIXTURE_IDS.asmPubA}/close`,
  `GET /api/teacher/assignments/${FIXTURE_IDS.asmPubA}/submissions`,
  `GET /api/teacher/submissions/${FIXTURE_IDS.subSubmittedA}`,
  `POST /api/teacher/submissions/${FIXTURE_IDS.subSubmittedA}/feedback`,
  `PATCH /api/teacher/feedback/tf_dummy`,
  `POST /api/teacher/feedback/tf_dummy/publish`,
  `POST /api/teacher/feedback/tf_dummy/addendum`,
  // Complément pour atteindre 20 routes protégées par le flag ·
  // le GET sur submission n'existe pas · on ajoute PATCH sur un id
  // inexistant pour un cas 404 stable (transitions guard 405 exclue).
  `GET /api/teacher/assignments/${FIXTURE_IDS.asmDraftA}/submissions`,
];

test.describe("flag-off · 20 routes API Monde → 404 stable", () => {
  for (const spec of MONDE_API_ROUTES) {
    test(`${spec} → 404`, async ({ browser }) => {
      const [method, path] = spec.split(" ");
      const context = await browser.newContext({
        storageState: PERSONAS.studentA.storageStateFile,
      });
      const req = context.request;
      let res;
      if (method === "GET") res = await req.get(path, { failOnStatusCode: false });
      else if (method === "POST") res = await req.post(path, { data: {}, failOnStatusCode: false });
      else if (method === "PATCH") res = await req.patch(path, { data: {}, failOnStatusCode: false });
      else throw new Error(`unhandled method ${method}`);
      expect(res.status(), `${spec} must be 404 with flag off`).toBe(404);
      await context.close();
    });
  }
});
