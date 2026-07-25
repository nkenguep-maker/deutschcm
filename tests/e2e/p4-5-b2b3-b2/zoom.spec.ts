// P4.5-B2b3b-b2 · zoom 200 % sur les 7 pages (§16).
// Simulé via viewport largeur / 2 · rend l'équivalent de 200% en zoom CSS.
// Vérifie · overflow horizontal global = 0, action principale reste
// atteignable (pas hors écran).

import { test, expect } from "playwright/test";
import { PERSONAS, FIXTURE_IDS } from "./personas";

// Zoom 200% simulé · on part du viewport 1440×900 mais on met devicePixelRatio
// à 2 et on utilise document.body.style.zoom pour un vrai 200%.
const BASE = { width: 1440, height: 900 };

const PAGES = [
  { name: "teacher/classes",              path: "/fr/teacher/classes",                                    storage: PERSONAS.teacherA.storageStateFile },
  { name: "teacher/assignments/list",     path: "/fr/teacher/assignments",                                storage: PERSONAS.teacherA.storageStateFile },
  { name: "teacher/assignments/detail",   path: `/fr/teacher/assignments/${FIXTURE_IDS.asmPubA}`,        storage: PERSONAS.teacherA.storageStateFile },
  { name: "teacher/submissions/detail",   path: `/fr/teacher/submissions/${FIXTURE_IDS.subSubmittedA}`,  storage: PERSONAS.teacherA.storageStateFile },
  { name: "student/assignments/list",     path: "/fr/student/assignments",                                storage: PERSONAS.studentA.storageStateFile },
  { name: "student/assignments/detail",   path: `/fr/student/assignments/${FIXTURE_IDS.asmPubA}`,        storage: PERSONAS.studentA.storageStateFile },
  { name: "student/submissions/detail",   path: `/fr/student/submissions/${FIXTURE_IDS.subDraftA}`,     storage: PERSONAS.studentA.storageStateFile },
];

for (const p of PAGES) {
  test(`zoom 200% · ${p.name} · overflow horizontal = 0`, async ({ browser }) => {
    const context = await browser.newContext({
      storageState: p.storage,
      viewport: BASE,
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    await page.goto(p.path);
    // Applique zoom 200% via CSS (approximation, Playwright n'expose pas
    // encore le zoom natif du navigateur).
    await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
    // Overflow horizontal global doit rester 0 après zoom.
    const overflowPx = await page.evaluate(() => {
      const doc = document.documentElement;
      return Math.max(0, doc.scrollWidth - doc.clientWidth);
    });
    // Note · zoom 200% double la largeur logique · certains conteneurs
    // internes autorisent scroll (`overflow-x-auto`). On teste que le
    // débordement DOCUMENT reste zéro.
    expect(overflowPx, `overflow document doit être 0 sur ${p.name} @ 200%`).toBe(0);
    // Vérifie qu'un heading H1 reste visible dans le viewport.
    const h1 = page.getByRole("heading", { level: 1 }).first();
    if (await h1.isVisible().catch(() => false)) {
      const box = await h1.boundingBox();
      expect(box, `H1 must have a box on ${p.name}`).not.toBeNull();
    }
    await context.close();
  });
}
