// P4.5-B2b3b-b2 Gate final · addendum depuis l'UI Teacher.
// Persona Teacher A, submission SUBMITTED de Student A (fixture) qui
// possède déjà fbPublished (v1 PUBLISHED) + fbAddendum (v2 ADDENDUM).
// Le spec ajoute une v3 ADDENDUM via l'UI et vérifie les invariants DB +
// AuditEvent.

import { test, expect } from "playwright/test";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { PERSONAS, FIXTURE_IDS } from "./personas";

test.describe.configure({ mode: "serial" });
test.use({ storageState: PERSONAS.teacherA.storageStateFile });

function newDb() {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
    log: ["error"],
  });
}

test("Teacher A · ajoute un addendum depuis l'UI + assertions DB & audit", async ({ page }) => {
  const db = newDb();
  const submissionId = FIXTURE_IDS.subSubmittedA;
  const fbPublishedId = "test_p4_5_b_feedback_a_published";

  // Snapshot état avant · dernière version feedback + AuditEvent count.
  const [preLatest, preAuditCount] = await Promise.all([
    db.assignmentFeedback.findFirst({
      where: { submissionId },
      orderBy: { version: "desc" },
      select: { id: true, status: true, version: true, supersedesFeedbackId: true },
    }),
    db.auditEvent.count({
      where: {
        action: "FEEDBACK_ADDENDUM_CREATED",
        scopeId: submissionId,
      },
    }),
  ]);
  expect(preLatest).not.toBeNull();
  const expectedNewVersion = preLatest!.version + 1;

  // Naviguer vers la submission via UI Teacher.
  await page.goto(`/fr/teacher/submissions/${submissionId}`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  // Le bloc addendum apparaît car lastPublished (fbPublishedA) existe.
  // Remplir le textarea et cliquer sur le bouton "Ajouter un complément".
  const addendumText = `E2E-Gate · addendum v${expectedNewVersion} · ${Date.now()}`;
  const addendumTextarea = page.getByPlaceholder(/Rédigez un complément|Write an addendum/i);
  await expect(addendumTextarea).toBeVisible();
  await addendumTextarea.fill(addendumText);

  const addendumBtn = page.getByRole("button", { name: /Ajouter un complément|Add addendum/i });
  // Capture la request AVANT click (matcher = tout POST /addendum).
  // Note · le composant `TeacherSubmissionDetailView` sélectionne
  // `lastPublished` = dernier feedback statut PUBLISHED OU ADDENDUM ·
  // avec fbAddendumA (v2) présent, l'URL pointe vers fbAddendumA. Le
  // service B1 résout la baseline via son propre `latest` orderBy version
  // desc · comportement métier identique.
  const requestPromise = page.waitForRequest(
    (r) => r.method() === "POST" && /\/api\/teacher\/feedback\/[^/]+\/addendum$/.test(new URL(r.url()).pathname),
    { timeout: 30_000 },
  );
  await addendumBtn.click();
  const req = await requestPromise;
  // La cible est le "dernier feedback visible" (PUBLISHED ou ADDENDUM).
  expect(req.url()).toMatch(/\/api\/teacher\/feedback\/test_p4_5_b_feedback_a_(published|addendum)\/addendum$/);
  // Poll DB · attendre l'apparition de la nouvelle addendum row (id auto-
  // généré, on la reconnaît via version > preLatest.version).
  const deadline = Date.now() + 20_000;
  type LatestRow = {
    id: string; status: string; version: number;
    supersedesFeedbackId: string | null; writtenContent: string | null; authorTeacherId: string;
  };
  let postLatest: LatestRow | null = null;
  while (Date.now() < deadline) {
    const row = await db.assignmentFeedback.findFirst({
      where: { submissionId },
      orderBy: { version: "desc" },
      select: { id: true, status: true, version: true, supersedesFeedbackId: true, writtenContent: true, authorTeacherId: true },
    });
    if (row && row.version > preLatest!.version) {
      postLatest = row;
      break;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  expect(postLatest, "nouvelle addendum row visible via poll").not.toBeNull();
  expect(postLatest!.version, "nouvelle version supérieure à preLatest").toBeGreaterThan(preLatest!.version);
  // Attendre que le router.refresh() se propage pour un état visuel propre.
  await page.waitForLoadState("networkidle", { timeout: 15_000 });

  // Vérifier assertions détaillées.
  const postAuditCount = await db.auditEvent.count({
    where: { action: "FEEDBACK_ADDENDUM_CREATED", scopeId: submissionId },
  });
  expect(postLatest!.version, "version = prev + 1").toBe(expectedNewVersion);
  expect(postLatest!.status, "status = ADDENDUM").toBe("ADDENDUM");
  // Le service B1 supersede la dernière row (preLatest = fbAddendumA v2 dans
  // le fixture · UI a envoyé POST vers /feedback/fbAddendumA/addendum qui
  // sert de "previous" · le service lit `latest` = preLatest et l'utilise
  // comme baseline). Attendu · supersedes = preLatest.id.
  expect(postLatest!.supersedesFeedbackId, "supersedes = prev latest").toBe(preLatest!.id);
  expect(postLatest!.writtenContent, "contenu appliqué (trim)").toContain(addendumText);
  expect(postAuditCount, "AuditEvent FEEDBACK_ADDENDUM_CREATED +1").toBe(preAuditCount + 1);

  // L'ancien PUBLISHED (v1) doit rester intact (status PUBLISHED).
  const fbPublished = await db.assignmentFeedback.findUnique({
    where: { id: fbPublishedId },
    select: { status: true, version: true },
  });
  expect(fbPublished?.status, "fbPublished v1 reste PUBLISHED").toBe("PUBLISHED");
  expect(fbPublished?.version, "fbPublished version inchangée").toBe(1);

  await db.$disconnect();
});
