// P4.5-A · vérification directe des objets DB après migrate deploy sur P-1.
// Read-only. Exige P1_BASELINE_CONFIRMED_NOT_PRODUCTION=true.

import { assertNonProduction } from "./_common.mjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

assertNonProduction();
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
  log: ["error"],
});

async function q(label, sql, expectedMin = 1) {
  const rows = await db.$queryRawUnsafe(sql);
  const arr = Array.isArray(rows) ? rows : [];
  const ok = arr.length >= expectedMin;
  process.stderr.write(`  ${ok ? "✓" : "✗"} ${label} · ${arr.length} row(s)\n`);
  return { label, ok, rows: arr };
}

async function main() {
  process.stderr.write("═══ P4.5-A · schema verification (P-1) ═══\n\n");
  const results = {};

  results.tables = await q("6 tables P4.5 present",
    `SELECT tablename FROM pg_tables WHERE schemaname='public'
     AND tablename IN ('circle_assignments','circle_assignment_targets','circle_submissions','circle_feedbacks','circle_submission_replies','assignment_feedbacks')
     ORDER BY tablename`, 6);

  results.enums = await q("9 enums P4.5 present",
    `SELECT t.typname FROM pg_type t
     WHERE t.typname IN ('AssignmentType','AssignmentStatus','SubmissionStatus','FeedbackStatus','CircleAssignmentType','CircleAssignmentStatus','CircleSubmissionStatus','CircleFeedbackStatus','CircleSubmissionReplyRole')
     ORDER BY t.typname`, 9);

  results.triggers = await q("4 triggers immutability present",
    `SELECT tgname FROM pg_trigger
     WHERE tgname IN ('circle_feedbacks_immutable_publish','assignment_feedbacks_immutable_publish','circle_submissions_immutable_submit','assignment_submissions_immutable_submit')
       AND NOT tgisinternal
     ORDER BY tgname`, 4);

  results.functions = await q("2 immutability functions present",
    `SELECT proname FROM pg_proc
     WHERE proname IN ('p4_5_enforce_feedback_immutability','p4_5_enforce_submission_immutability')
     ORDER BY proname`, 2);

  results.checkBodyLen = await q("body length CHECK on replies (1..1000)",
    `SELECT conname FROM pg_constraint WHERE conname='circle_submission_replies_body_length_chk'`, 1);

  results.uniqDraft = await q("partial UNIQUE indexes for active DRAFT (3 tables)",
    `SELECT indexname FROM pg_indexes WHERE schemaname='public'
     AND indexname IN ('assignment_submissions_active_draft_uniq','assignment_feedbacks_active_draft_uniq','circle_submissions_active_draft_uniq','circle_feedbacks_active_draft_uniq')`, 4);

  results.selfFkAddendum = await q("self-FK supersedesFeedbackId (Monde + Racines)",
    `SELECT conname FROM pg_constraint
     WHERE conname IN ('circle_feedbacks_supersedesFeedbackId_fkey','assignment_feedbacks_supersedesFeedbackId_fkey')`, 2);

  results.rls = await q("RLS enabled on 8 tables",
    `SELECT relname FROM pg_class WHERE relrowsecurity=true
     AND relname IN ('circle_assignments','circle_assignment_targets','circle_submissions','circle_feedbacks','circle_submission_replies','assignment_feedbacks','assignments','assignment_submissions')
     ORDER BY relname`, 8);

  results.auditCount = await q("24 AuditAction P4.5 values in enum",
    `SELECT e.enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid
     WHERE t.typname='AuditAction' AND e.enumlabel IN
     ('ASSIGNMENT_CREATED','ASSIGNMENT_PUBLISHED','ASSIGNMENT_CLOSED','ASSIGNMENT_ACCESS_DENIED',
      'SUBMISSION_CREATED','SUBMISSION_SUBMITTED','SUBMISSION_WITHDRAWN','SUBMISSION_ACCESS_DENIED',
      'FEEDBACK_DRAFTED','FEEDBACK_PUBLISHED','FEEDBACK_ADDENDUM_CREATED','FEEDBACK_ACCESS_DENIED',
      'STORAGE_UPLOAD_DENIED',
      'CIRCLE_ASSIGNMENT_CREATED','CIRCLE_ASSIGNMENT_PUBLISHED','CIRCLE_ASSIGNMENT_CLOSED',
      'CIRCLE_SUBMISSION_CREATED','CIRCLE_SUBMISSION_SUBMITTED','CIRCLE_SUBMISSION_WITHDRAWN',
      'CIRCLE_FEEDBACK_DRAFTED','CIRCLE_FEEDBACK_PUBLISHED','CIRCLE_FEEDBACK_ADDENDUM_CREATED',
      'PRODUCTION_LIMIT_REACHED','PARENT_REPLY_CREATED')`, 24);

  await db.$disconnect();

  const allOk = Object.values(results).every((r) => r.ok);
  process.stderr.write(`\n${allOk ? "PASS" : "FAIL"} · schema verification\n`);
  process.exit(allOk ? 0 : 1);
}

main().catch(async (e) => {
  console.error(e);
  await db.$disconnect().catch(() => {});
  process.exit(1);
});
