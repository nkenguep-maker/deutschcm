// P4.5-B2b3b-b2 Gate final · nouvelle version depuis l'UI Student.
// Fichier préfixé `z-` pour être exécuté APRÈS les autres specs Student
// (Playwright ordre alphabétique) · ce test transitionne subDraftA
// (v2 DRAFT) → SUBMITTED puis crée une v3 DRAFT · aucune autre spec ne
// doit dépendre de subDraftA après.
//
// Parcours ·
//   1. Student A submit sa v2 DRAFT (subDraftA) → SUBMITTED
//   2. Depuis /student/assignments/asmPubA, cliquer "Rédiger une nouvelle
//      version", saisir contenu, valider → nouvelle v3 DRAFT
//   3. Assertions DB · subDraftA (v2) status devient SUPERSEDED, v3 row
//      créée avec status=DRAFT, AuditEvents SUBMISSION_SUBMITTED +
//      SUBMISSION_CREATED (supersededSubmissionId=subDraftA)

import { test, expect } from "playwright/test";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { PERSONAS, FIXTURE_IDS } from "./personas";

test.describe.configure({ mode: "serial" });
test.use({ storageState: PERSONAS.studentA.storageStateFile });

function newDb() {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
    log: ["error"],
  });
}

test("Student A · submit puis crée une nouvelle version + assertions DB & audit", async ({ page }) => {
  const db = newDb();
  const assignmentId = FIXTURE_IDS.asmPubA;
  const draftId = FIXTURE_IDS.subDraftA;

  // Snapshot état initial · subDraftA v2 DRAFT + AuditEvent counts.
  const preDraft = await db.assignmentSubmission.findUnique({
    where: { id: draftId },
    select: { status: true, version: true, userId: true },
  });
  expect(preDraft, "fixture subDraftA doit exister").not.toBeNull();
  expect(preDraft!.status, "fixture subDraftA doit être DRAFT").toBe("DRAFT");

  const [preSubmittedCount, preCreatedCount, preSubCount] = await Promise.all([
    db.auditEvent.count({
      where: { action: "SUBMISSION_SUBMITTED", targetId: draftId },
    }),
    db.auditEvent.count({
      where: {
        action: "SUBMISSION_CREATED",
        scopeId: assignmentId,
        actorUserId: preDraft!.userId,
      },
    }),
    db.assignmentSubmission.count({
      where: { assignmentId, userId: preDraft!.userId },
    }),
  ]);

  // ── Étape 1 · SUBMIT ─────────────────────────────────────────────────
  await page.goto(`/fr/student/submissions/${draftId}`);
  const textarea = page.locator("textarea").first();
  await expect(textarea).toBeVisible();
  await textarea.fill("Contenu final v2 pour submission E2E Gate.");
  page.once("dialog", (d) => d.accept());
  const submitReq = page.waitForRequest(
    (r) => r.method() === "POST" && r.url().endsWith(`/api/student/submissions/${draftId}/submit`),
    { timeout: 30_000 },
  );
  await page.getByRole("button", { name: /Soumettre|Submit/i }).click();
  await submitReq;
  // Poll DB pour la transition SUBMITTED (évite les races Next 16 RSC).
  let afterSubmit: { status: string; version: number; submittedAt: Date | null } | null = null;
  const submitDeadline = Date.now() + 20_000;
  while (Date.now() < submitDeadline) {
    const row = await db.assignmentSubmission.findUnique({
      where: { id: draftId },
      select: { status: true, version: true, submittedAt: true },
    });
    if (row && row.status === "SUBMITTED") { afterSubmit = row; break; }
    await new Promise((r) => setTimeout(r, 250));
  }
  expect(afterSubmit, "v2 doit atteindre SUBMITTED").not.toBeNull();
  expect(afterSubmit!.status).toBe("SUBMITTED");
  expect(afterSubmit!.version, "version conservée").toBe(2);
  expect(afterSubmit!.submittedAt, "submittedAt renseigné").not.toBeNull();
  await page.waitForLoadState("networkidle", { timeout: 15_000 });

  // ── Étape 2 · Nouvelle version ───────────────────────────────────────
  await page.goto(`/fr/student/assignments/${assignmentId}`);
  const newVersionTextarea = page.getByPlaceholder(/Écrivez votre nouvelle version|Write your new version/i);
  await expect(newVersionTextarea).toBeVisible();
  const newContent = `E2E-Gate · v3 draft · ${Date.now()}`;
  await newVersionTextarea.fill(newContent);

  const newVersionBtn = page.getByRole("button", { name: /^Rédiger une nouvelle version$|^Write a new version$/i });
  const versionsReq = page.waitForRequest(
    (r) => r.method() === "POST" && r.url().endsWith(`/api/student/submissions/${draftId}/versions`),
    { timeout: 30_000 },
  );
  await newVersionBtn.click();
  await versionsReq;
  // Poll DB · attendre l'apparition v3 + transition v2 vers SUPERSEDED.
  const newVerDeadline = Date.now() + 20_000;
  while (Date.now() < newVerDeadline) {
    const [v2, count] = await Promise.all([
      db.assignmentSubmission.findUnique({ where: { id: draftId }, select: { status: true } }),
      db.assignmentSubmission.count({ where: { assignmentId, userId: preDraft!.userId } }),
    ]);
    if (v2?.status === "SUPERSEDED" && count > preSubCount) break;
    await new Promise((r) => setTimeout(r, 250));
  }
  await page.waitForLoadState("networkidle", { timeout: 15_000 });

  // ── Étape 3 · Assertions DB ──────────────────────────────────────────
  const [afterDraft, allVersions, postSubmittedCount, postCreatedCount] = await Promise.all([
    db.assignmentSubmission.findUnique({
      where: { id: draftId },
      select: { status: true, version: true },
    }),
    db.assignmentSubmission.findMany({
      where: { assignmentId, userId: preDraft!.userId },
      orderBy: { version: "asc" },
      select: { id: true, status: true, version: true, writtenContent: true },
    }),
    db.auditEvent.count({
      where: { action: "SUBMISSION_SUBMITTED", targetId: draftId },
    }),
    db.auditEvent.count({
      where: {
        action: "SUBMISSION_CREATED",
        scopeId: assignmentId,
        actorUserId: preDraft!.userId,
      },
    }),
  ]);

  expect(afterDraft!.status, "v2 doit être SUPERSEDED après création v3").toBe("SUPERSEDED");
  expect(afterDraft!.version, "v2 conservée").toBe(2);
  expect(allVersions.length, "nouvelle row créée pour v3").toBe(preSubCount + 1);
  const v3 = allVersions[allVersions.length - 1];
  expect(v3.version, "v3 = latest + 1").toBe(3);
  expect(v3.status, "v3 status = DRAFT").toBe("DRAFT");
  expect(v3.writtenContent, "v3 contenu appliqué").toContain(newContent);
  expect(postSubmittedCount, "AuditEvent SUBMISSION_SUBMITTED +1").toBe(preSubmittedCount + 1);
  expect(postCreatedCount, "AuditEvent SUBMISSION_CREATED +1 (avec supersededSubmissionId)").toBe(preCreatedCount + 1);

  // Vérifier metadata supersededSubmissionId de l'AuditEvent SUBMISSION_CREATED le plus récent.
  const latestCreatedAudit = await db.auditEvent.findFirst({
    where: {
      action: "SUBMISSION_CREATED",
      scopeId: assignmentId,
      actorUserId: preDraft!.userId,
    },
    orderBy: { createdAt: "desc" },
    select: { metadata: true, targetId: true },
  });
  expect(latestCreatedAudit!.targetId, "audit cible v3").toBe(v3.id);
  const meta = latestCreatedAudit!.metadata as Record<string, unknown>;
  expect(meta.supersededSubmissionId, "metadata.supersededSubmissionId = v2").toBe(draftId);
  expect(meta.version, "metadata.version = 3").toBe(3);

  await db.$disconnect();
});
