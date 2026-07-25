// P4.5-B2b3b-b2 · flag-off UI + API (§17).
// SERVEUR REDÉMARRÉ SÉPARÉMENT avec `PW_FLAG=off` (voir npm script
// test:e2e:b2:flag-off). Vérifie ·
//
//   1. 7 pages Student/Teacher rendent le placeholder feature_disabled
//      sans données cache.
//   2. Manifeste des 20 opérations API Monde canoniques (méthode + chemin)
//      répond 404 stable.
//   3. Aucune mutation DB (Assignment, AssignmentSubmission,
//      AssignmentFeedback, ClassroomEnrollment) et aucun AuditEvent créé
//      pendant la volée des 20 appels · deltas comptés au préfixe fixtures
//      `test_p4_5_b_`.

import { test, expect } from "playwright/test";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { PERSONAS, FIXTURE_IDS, PREFIX } from "./personas";
import { MONDE_API_OPERATIONS } from "./monde-api-manifest";

// ── DB helper · service_role via .env.p1-baseline (chargé par wrapper) ──

function newDb() {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
    log: ["error"],
  });
}

async function snapshotCounts(db: PrismaClient) {
  const [assignments, submissions, feedbacks, audits, enrollments] = await Promise.all([
    db.assignment.count({ where: { id: { startsWith: PREFIX } } }),
    db.assignmentSubmission.count({ where: { id: { startsWith: PREFIX } } }),
    db.assignmentFeedback.count({ where: { id: { startsWith: PREFIX } } }),
    db.auditEvent.count({
      where: {
        OR: [
          { targetId: { startsWith: PREFIX } },
          { scopeId: { startsWith: PREFIX } },
          { actorUserId: { startsWith: PREFIX } },
        ],
      },
    }),
    db.classroomEnrollment.count({ where: { classroomId: { startsWith: PREFIX } } }),
  ]);
  return { assignments, submissions, feedbacks, audits, enrollments };
}

// ── §17.a · 7 pages placeholder feature_disabled + anti-leak cache ──────

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
      await expect(page.getByText(/Bientôt disponible|Coming soon/i)).toBeVisible();
      const html = await page.content();
      for (const forbidden of [
        "Devoir A · brouillon", "Devoir A · publié", "Devoir A · fermé",
        "Brouillon A · v2", "Réponse A · v1 finalisée",
        "Bien !", "Précision : travaille les articles",
      ]) {
        expect(html, `${p.name} feature-off must not leak ${forbidden}`).not.toContain(forbidden);
      }
      await context.close();
    });
  }
});

// ── §17.b · 20 routes API Monde canoniques → 404 stable + 0 mutation ────

test.describe("flag-off · 20 routes API Monde · 404 + 0 mutation + 0 AuditEvent", () => {
  test.describe.configure({ mode: "serial" });

  let db: PrismaClient;
  let baseline: Awaited<ReturnType<typeof snapshotCounts>>;

  test.beforeAll(async () => {
    db = newDb();
    baseline = await snapshotCounts(db);
  });

  test.afterAll(async () => {
    if (db) await db.$disconnect();
  });

  // Volée séquentielle des 20 opérations · assertion 404 par opération.
  for (const op of MONDE_API_OPERATIONS) {
    test(`${op.method} ${op.path} · ${op.label} → 404`, async ({ browser }) => {
      const context = await browser.newContext({
        // Le persona utilisé n'a aucun impact sur la 404 : le gate
        // `assignmentsFlagOr404` court-circuite AVANT tout resolveActor.
        storageState: PERSONAS.studentA.storageStateFile,
      });
      const req = context.request;
      let res;
      if (op.method === "GET") res = await req.get(op.path, { failOnStatusCode: false });
      else if (op.method === "POST") res = await req.post(op.path, { data: {}, failOnStatusCode: false });
      else res = await req.patch(op.path, { data: {}, failOnStatusCode: false });
      expect(res.status(), `${op.method} ${op.path} must be 404 with flag off`).toBe(404);
      // Réponse stable · JSON `{ error: "Not found" }` (assignmentsGate.ts).
      const body = await res.json().catch(() => null);
      expect(body).toMatchObject({ error: "Not found" });
      await context.close();
    });
  }

  test("bilan · 0 mutation DB, 0 AuditEvent après les 20 appels", async () => {
    const after = await snapshotCounts(db);
    expect(after.assignments, "no Assignment created/deleted").toBe(baseline.assignments);
    expect(after.submissions, "no AssignmentSubmission created/deleted").toBe(baseline.submissions);
    expect(after.feedbacks, "no AssignmentFeedback created/deleted").toBe(baseline.feedbacks);
    expect(after.audits, "no AuditEvent created (delta must be 0)").toBe(baseline.audits);
    expect(after.enrollments, "no ClassroomEnrollment mutation").toBe(baseline.enrollments);
  });
});
