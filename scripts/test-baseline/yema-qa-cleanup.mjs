// P4.5-QA · cleanup des fixtures + Auth users QA. Refuse toute cible non-P1.
//
// Ordre · enfants avant parents · Auth users purgés en dernier.

import { assertNonProduction } from "./_common.mjs";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

assertNonProduction();

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
  log: ["error"],
});

const PREFIX = "test_yema_qa_";

async function listAuthMatching(prefix) {
  const out = [];
  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ perPage: 200, page });
    if (error) throw new Error(`listUsers: ${error.message}`);
    for (const u of data.users) if (u.email?.includes(prefix)) out.push(u);
    if (!data.users.length || data.users.length < 200) break;
    page += 1;
  }
  return out;
}

async function main() {
  process.stderr.write("═══ YEMA QA cleanup P-1 ═══\n\n");

  // Enfants d'abord (feedback → submission → assignment → enrollment → classroom
  // → teacher → appRole → user → audit). Cibler AUSSI par scope pour les rows
  // avec id auto-cuid éventuelles (créées par les tests E2E QA à venir).
  await db.assignmentFeedback.deleteMany({
    where: { OR: [{ id: { startsWith: PREFIX } }, { submissionId: { startsWith: PREFIX } }] },
  });
  await db.assignmentSubmission.deleteMany({
    where: { OR: [{ id: { startsWith: PREFIX } }, { assignmentId: { startsWith: PREFIX } }] },
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

  // QA-b1.1 · purge des nonces bootstrap QA · CRITIQUE · toute row du
  // scope de test (deploymentHost préfixé `test-yema-qa-`, `localhost`,
  // `127.0.0.1`) est supprimée MÊME si active/non consommée. Les rows
  // Preview réelles (host preview.vercel.app) qui sont expirées OU
  // consommées sont également purgées. Une row Preview active + non
  // consommée reste (usage légitime en cours).
  const noncesDeleted = await db.qaBootstrapNonce.deleteMany({
    where: {
      OR: [
        // Scope de test · purge inconditionnelle (aussi les actives).
        { deploymentHost: { startsWith: "test-yema-qa-" } },
        { deploymentHost: { startsWith: "localhost" } },
        { deploymentHost: { startsWith: "127.0.0.1" } },
        // Hors scope de test · purge uniquement expirées ou consommées.
        { expiresAt: { lt: new Date() } },
        { consumedAt: { not: null } },
      ],
    },
  });
  process.stderr.write(`qa_bootstrap_nonces purged: ${noncesDeleted.count}\n`);

  // Auth users QA
  const users = await listAuthMatching(PREFIX);
  let deleted = 0;
  const failures = [];
  for (const u of users) {
    const { error } = await admin.auth.admin.deleteUser(u.id);
    if (error) failures.push({ email: u.email, err: error.message });
    else deleted += 1;
  }

  const residuals = {
    users: await db.user.count({ where: { email: { contains: PREFIX } } }),
    teachers: await db.teacher.count({ where: { id: { startsWith: PREFIX } } }),
    classrooms: await db.classroom.count({ where: { id: { startsWith: PREFIX } } }),
    enrollments: await db.classroomEnrollment.count({ where: { classroomId: { startsWith: PREFIX } } }),
    assignments: await db.assignment.count({ where: { id: { startsWith: PREFIX } } }),
    submissions: await db.assignmentSubmission.count({ where: { id: { startsWith: PREFIX } } }),
    feedbacks: await db.assignmentFeedback.count({ where: { id: { startsWith: PREFIX } } }),
    audits: await db.auditEvent.count({ where: { targetId: { startsWith: PREFIX } } }),
    appRoles: await db.userAppRole.count({ where: { userId: { startsWith: PREFIX } } }),
    // Nonces résiduels · rows non consommées et non expirées (usage
    // légitime en cours). Ne bloque pas la sortie stable.
    nonces_active: await db.qaBootstrapNonce.count({
      where: { consumedAt: null, expiresAt: { gt: new Date() } },
    }),
    // Nonces résiduels dans le scope de test (doit être 0 après cleanup).
    nonces_test_scope: await db.qaBootstrapNonce.count({
      where: {
        OR: [
          { deploymentHost: { startsWith: "test-yema-qa-" } },
          { deploymentHost: { startsWith: "localhost" } },
          { deploymentHost: { startsWith: "127.0.0.1" } },
        ],
      },
    }),
    authUsersDeleted: deleted,
    authUsersFailed: failures.length,
  };
  const totalResidualDb = residuals.users + residuals.teachers + residuals.classrooms
    + residuals.enrollments + residuals.assignments + residuals.submissions
    + residuals.feedbacks + residuals.audits + residuals.appRoles;
  process.stderr.write(`residuals: ${JSON.stringify(residuals)}\n`);
  // QA-b1.1 · la sortie stable n'est autorisée que si le résidu du scope
  // testé est ZÉRO (y compris les nonces test-scope actifs).
  const cleanOk = totalResidualDb === 0
    && failures.length === 0
    && residuals.nonces_test_scope === 0;
  if (cleanOk) {
    process.stderr.write("\nYEMA QA BASELINE CLEANED\n");
  } else {
    process.stderr.write("\nCLEANUP FAILED · residual QA data\n");
    if (failures.length) console.error(JSON.stringify(failures, null, 2));
    process.exit(1);
  }
  await db.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  try { await db.$disconnect(); } catch {}
  process.exit(1);
});
