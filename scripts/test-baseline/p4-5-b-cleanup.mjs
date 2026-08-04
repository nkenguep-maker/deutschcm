// P4.5-B2b1 · cleanup fixtures P-1 · idempotent, refuse cible autre que P-1.
//
// Ordre de suppression · relations enfants d'abord, parents ensuite.
// Sortie `BASELINE DATA CLEANED` si zéro fixture résiduelle.

import { assertNonProduction } from "./_common.mjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

assertNonProduction();
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
  log: ["error"],
});

const PREFIX = "test_p4_5_b_";

async function main() {
  process.stderr.write("═══ P4.5-B cleanup P-1 ═══\n\n");

  // Enfants d'abord. Doctrine · les rows créées par les tests E2E via l'UI
  // ont un id AUTO-généré (cuid) hors PREFIX. On les repère par leur scope
  // parent (submissionId/assignmentId préfixé) et on les supprime AVANT la
  // suppression des parents pour éviter les triggers d'immutabilité RLS/FK.
  await db.assignmentFeedback.deleteMany({
    where: {
      OR: [
        { id: { startsWith: PREFIX } },
        { submissionId: { startsWith: PREFIX } },
      ],
    },
  });
  await db.assignmentSubmission.deleteMany({
    where: {
      OR: [
        { id: { startsWith: PREFIX } },
        { assignmentId: { startsWith: PREFIX } },
      ],
    },
  });
  await db.assignment.deleteMany({ where: { id: { startsWith: PREFIX } } });
  await db.classroomEnrollment.deleteMany({
    where: { OR: [{ classroomId: { startsWith: PREFIX } }, { userId: { startsWith: PREFIX } }] },
  });
  await db.classroom.deleteMany({ where: { id: { startsWith: PREFIX } } });
  await db.teacher.deleteMany({ where: { id: { startsWith: PREFIX } } });
  await db.userAppRole.deleteMany({ where: { userId: { startsWith: PREFIX } } });
  await db.auditEvent.deleteMany({
    where: {
      OR: [
        { actorUserId: { startsWith: PREFIX } },
        { targetId: { startsWith: PREFIX } },
        { scopeId: { startsWith: PREFIX } },
      ],
    },
  });
  await db.user.deleteMany({ where: { email: { contains: PREFIX } } });

  const [
    users, teachers, classrooms, enrollments, assignments,
    submissions, feedbacks, audits, appRoles,
  ] = await Promise.all([
    db.user.count({ where: { email: { contains: PREFIX } } }),
    db.teacher.count({ where: { id: { startsWith: PREFIX } } }),
    db.classroom.count({ where: { id: { startsWith: PREFIX } } }),
    db.classroomEnrollment.count({ where: { classroomId: { startsWith: PREFIX } } }),
    db.assignment.count({ where: { id: { startsWith: PREFIX } } }),
    db.assignmentSubmission.count({ where: { id: { startsWith: PREFIX } } }),
    db.assignmentFeedback.count({ where: { id: { startsWith: PREFIX } } }),
    db.auditEvent.count({ where: { targetId: { startsWith: PREFIX } } }),
    db.userAppRole.count({ where: { userId: { startsWith: PREFIX } } }),
  ]);
  const total = users + teachers + classrooms + enrollments + assignments + submissions + feedbacks + audits + appRoles;
  const residuals = {
    users, teachers, classrooms, enrollments, assignments,
    submissions, feedbacks, audits, appRoles, total,
  };
  process.stderr.write(`residuals: ${JSON.stringify(residuals)}\n`);
  if (total === 0) {
    process.stderr.write("\nBASELINE DATA CLEANED\n");
  } else {
    process.stderr.write("\nCLEANUP FAILED · residual fixtures detected\n");
  }
  await db.$disconnect();
  return residuals;
}

main().catch(async (e) => {
  console.error(e);
  try { await db.$disconnect(); } catch {}
  process.exit(1);
});
