// P4.5-B2b3b-b3 · nouvelle version depuis l'UI Student.
// Spec AUTONOME · utilise la lignée dédiée `test_p4_5_b_e2e_new_version_*`
// (assignment PUBLISHED + submission v1 SUBMITTED pré-créés par les
// fixtures). Aucune dépendance à l'ordre alphabétique Playwright ni au
// succès préalable d'une autre spec.
//
// Parcours ·
//   1. Student A ouvre /fr/student/assignments/{asmE2ENewVersion} · voit
//      le bouton "Rédiger une nouvelle version" (v1 SUBMITTED, aucun
//      DRAFT courant).
//   2. Saisit contenu, valide → POST /versions.
//   3. Assertions DB · v1 SUBMITTED → SUPERSEDED, v2 DRAFT créée,
//      AuditEvent SUBMISSION_CREATED avec metadata.supersededSubmissionId
//      = v1.id et metadata.version = 2.

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

test("Student A · crée une nouvelle version depuis lignée E2E dédiée + assertions DB & audit", async ({ page }) => {
  const db = newDb();
  const assignmentId = FIXTURE_IDS.asmE2ENewVersion;
  const v1Id = FIXTURE_IDS.subE2ENewVersion;

  // Snapshot initial · v1 SUBMITTED, aucune autre version.
  const preV1 = await db.assignmentSubmission.findUnique({
    where: { id: v1Id },
    select: { status: true, version: true, userId: true },
  });
  expect(preV1, "fixture E2E new-version v1 doit exister").not.toBeNull();
  expect(preV1!.status, "fixture E2E new-version v1 doit être SUBMITTED").toBe("SUBMITTED");
  expect(preV1!.version).toBe(1);

  const [preCreatedCount, preSubCount] = await Promise.all([
    db.auditEvent.count({
      where: {
        action: "SUBMISSION_CREATED",
        scopeId: assignmentId,
        actorUserId: preV1!.userId,
      },
    }),
    db.assignmentSubmission.count({
      where: { assignmentId, userId: preV1!.userId },
    }),
  ]);
  expect(preSubCount, "1 seule submission au départ").toBe(1);

  // ── Nouvelle version depuis /student/assignments/{asmE2ENewVersion} ─
  await page.goto(`/fr/student/assignments/${assignmentId}`);
  await expect(page.getByRole("heading", { level: 1, name: /Devoir E2E/ })).toBeVisible();

  const newVersionTextarea = page.getByPlaceholder(/Écrivez votre nouvelle version|Write your new version/i);
  await expect(newVersionTextarea).toBeVisible();
  const newContent = `E2E-b3 · v2 draft · ${Date.now()}`;
  await newVersionTextarea.fill(newContent);

  const newVersionBtn = page.getByRole("button", { name: /^Rédiger une nouvelle version$|^Write a new version$/i });
  const versionsReq = page.waitForRequest(
    (r) => r.method() === "POST" && r.url().endsWith(`/api/student/submissions/${v1Id}/versions`),
    { timeout: 30_000 },
  );
  await newVersionBtn.click();
  await versionsReq;
  // Poll DB · attendre transition v1 → SUPERSEDED + apparition v2 DRAFT.
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    const [v1, count] = await Promise.all([
      db.assignmentSubmission.findUnique({ where: { id: v1Id }, select: { status: true } }),
      db.assignmentSubmission.count({ where: { assignmentId, userId: preV1!.userId } }),
    ]);
    if (v1?.status === "SUPERSEDED" && count > preSubCount) break;
    await new Promise((r) => setTimeout(r, 250));
  }

  // ── Assertions DB finales ────────────────────────────────────────────
  const [afterV1, allVersions, postCreatedCount] = await Promise.all([
    db.assignmentSubmission.findUnique({
      where: { id: v1Id },
      select: { status: true, version: true },
    }),
    db.assignmentSubmission.findMany({
      where: { assignmentId, userId: preV1!.userId },
      orderBy: { version: "asc" },
      select: { id: true, status: true, version: true, writtenContent: true },
    }),
    db.auditEvent.count({
      where: {
        action: "SUBMISSION_CREATED",
        scopeId: assignmentId,
        actorUserId: preV1!.userId,
      },
    }),
  ]);

  expect(afterV1!.status, "v1 doit être SUPERSEDED après création v2").toBe("SUPERSEDED");
  expect(afterV1!.version, "v1 conservée").toBe(1);
  expect(allVersions.length, "nouvelle row créée pour v2").toBe(preSubCount + 1);
  const v2 = allVersions[allVersions.length - 1];
  expect(v2.version, "v2 = latest + 1").toBe(2);
  expect(v2.status, "v2 status = DRAFT").toBe("DRAFT");
  expect(v2.writtenContent, "v2 contenu appliqué").toContain(newContent);
  expect(postCreatedCount, "AuditEvent SUBMISSION_CREATED +1 (avec supersededSubmissionId)").toBe(preCreatedCount + 1);

  // Vérifier metadata supersededSubmissionId de l'AuditEvent SUBMISSION_CREATED le plus récent.
  const latestCreatedAudit = await db.auditEvent.findFirst({
    where: {
      action: "SUBMISSION_CREATED",
      scopeId: assignmentId,
      actorUserId: preV1!.userId,
    },
    orderBy: { createdAt: "desc" },
    select: { metadata: true, targetId: true },
  });
  expect(latestCreatedAudit!.targetId, "audit cible v2").toBe(v2.id);
  const meta = latestCreatedAudit!.metadata as Record<string, unknown>;
  expect(meta.supersededSubmissionId, "metadata.supersededSubmissionId = v1").toBe(v1Id);
  expect(meta.version, "metadata.version = 2").toBe(2);

  await db.$disconnect();
});
