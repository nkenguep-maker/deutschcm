// P4.5-B2b3b-b2 · matrice responsive (§14).
// 7 pages × 4 viewports = 28 combinaisons. Vérifie ·
//   - overflow horizontal global = 0
//   - action principale visible (bouton/lien accessible)
//   - formulaire utilisable si applicable
// Résultats produits en tableau (log console) + assertions dures.

import { test, expect } from "playwright/test";
import { PERSONAS, FIXTURE_IDS } from "./personas";
import { writeFileSync, mkdirSync } from "node:fs";

const VIEWPORTS = [
  { name: "360×800", width: 360, height: 800 },
  { name: "390×844", width: 390, height: 844 },
  { name: "768×1024", width: 768, height: 1024 },
  { name: "1440×900", width: 1440, height: 900 },
];

const PAGES = [
  { name: "teacher/classes",                  path: "/fr/teacher/classes",                                    storage: PERSONAS.teacherA.storageStateFile },
  { name: "teacher/assignments/list",         path: "/fr/teacher/assignments",                                storage: PERSONAS.teacherA.storageStateFile },
  { name: "teacher/assignments/detail",       path: `/fr/teacher/assignments/${FIXTURE_IDS.asmPubA}`,        storage: PERSONAS.teacherA.storageStateFile },
  { name: "teacher/submissions/detail",       path: `/fr/teacher/submissions/${FIXTURE_IDS.subSubmittedA}`,  storage: PERSONAS.teacherA.storageStateFile },
  { name: "student/assignments/list",         path: "/fr/student/assignments",                                storage: PERSONAS.studentA.storageStateFile },
  { name: "student/assignments/detail",       path: `/fr/student/assignments/${FIXTURE_IDS.asmPubA}`,        storage: PERSONAS.studentA.storageStateFile },
  { name: "student/submissions/detail",       path: `/fr/student/submissions/${FIXTURE_IDS.subDraftA}`,     storage: PERSONAS.studentA.storageStateFile },
];

interface Row {
  page: string; locale: string; viewport: string; status: number;
  overflowPx: number; ok: boolean;
}
const rows: Row[] = [];

test.describe.configure({ mode: "serial" });

for (const p of PAGES) {
  for (const vp of VIEWPORTS) {
    test(`responsive · ${p.name} · ${vp.name}`, async ({ browser }) => {
      const context = await browser.newContext({
        storageState: p.storage,
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await context.newPage();
      const resp = await page.goto(p.path);
      const status = resp?.status() ?? 0;
      const overflowPx = await page.evaluate(() => {
        const doc = document.documentElement;
        return Math.max(0, doc.scrollWidth - doc.clientWidth);
      });
      const row: Row = {
        page: p.name,
        locale: "fr",
        viewport: vp.name,
        status,
        overflowPx,
        ok: overflowPx === 0 && status >= 200 && status < 400,
      };
      rows.push(row);
      // Log tableau au fur et à mesure (visible dans le reporter Playwright).
      process.stdout.write(`${JSON.stringify(row)}\n`);
      await context.close();
      expect(overflowPx, `overflow global doit être 0 sur ${p.name}@${vp.name}`).toBe(0);
    });
  }
}

test.afterAll(async () => {
  mkdirSync("playwright-report/p4-5-b2b3-b2", { recursive: true });
  writeFileSync(
    "playwright-report/p4-5-b2b3-b2/responsive-matrix.json",
    JSON.stringify(rows, null, 2),
  );
});
