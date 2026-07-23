// P4.5-B1 · verrous structurels sur services / mapper / migration RLS WRITE.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ConcurrentUpdateError } from "../db/retry";
import { P4_5_STABLE_ERROR_CODES } from "../assignments/errors";

const REPO = join(__dirname, "..", "..", "..");
function read(rel: string): string {
  return readFileSync(join(REPO, rel), "utf-8");
}

describe("P4.5-B1 · migration RLS WRITE Monde", () => {
  const rls = read("prisma/migrations/20260724000002_p4_5_b_monde_rls_writes/migration.sql");

  it("declares helper is_teacher_for_classroom_v2", () => {
    expect(rls).toMatch(/CREATE OR REPLACE FUNCTION public\.is_teacher_for_classroom_v2/);
    expect(rls).toMatch(/SECURITY DEFINER\s+SET search_path = public, pg_temp/);
  });

  it("assignments · INSERT/UPDATE teacher own, aucun student", () => {
    expect(rls).toMatch(/CREATE POLICY "p4_5_b_assignments_insert_teacher_own"[\s\S]*FOR INSERT/);
    expect(rls).toMatch(/CREATE POLICY "p4_5_b_assignments_update_teacher_own"[\s\S]*FOR UPDATE/);
    // Aucune policy INSERT/UPDATE student sur assignments.
    expect(rls).not.toMatch(/CREATE POLICY[^"]*"[^"]*assignments[^"]*student[^"]*"[\s\S]*FOR (INSERT|UPDATE)/);
  });

  it("assignment_submissions · INSERT student own + UPDATE draft-only", () => {
    expect(rls).toMatch(/CREATE POLICY "p4_5_b_assignment_submissions_insert_student_own"[\s\S]*FOR INSERT/);
    expect(rls).toMatch(/CREATE POLICY "p4_5_b_assignment_submissions_update_student_draft"[\s\S]*FOR UPDATE/);
    // Le UPDATE student est contraint status = DRAFT.
    expect(rls).toMatch(/p4_5_b_assignment_submissions_update_student_draft[\s\S]*status = 'DRAFT'/);
    // Aucun INSERT/UPDATE teacher sur submissions (teacher ne touche pas au contenu).
    expect(rls).not.toMatch(/CREATE POLICY[^"]*"[^"]*assignment_submissions[^"]*teacher[^"]*"[\s\S]*FOR (INSERT|UPDATE)/);
  });

  it("assignment_feedbacks · INSERT teacher own + UPDATE draft-only", () => {
    expect(rls).toMatch(/CREATE POLICY "p4_5_b_assignment_feedbacks_insert_teacher_own"[\s\S]*FOR INSERT/);
    expect(rls).toMatch(/CREATE POLICY "p4_5_b_assignment_feedbacks_update_teacher_draft"[\s\S]*FOR UPDATE/);
    expect(rls).toMatch(/p4_5_b_assignment_feedbacks_update_teacher_draft[\s\S]*status = 'DRAFT'/);
  });

  it("aucun bypass is_yema_admin() global", () => {
    expect(rls).not.toMatch(/is_yema_admin\s*\(/);
  });

  it("aucune policy DELETE (feedback publié / submission SUBMITTED immuable)", () => {
    expect(rls).not.toMatch(/FOR DELETE/);
  });

  it("est additive · aucun DROP", () => {
    expect(rls).not.toMatch(/DROP TABLE|DROP POLICY|DROP COLUMN|TRUNCATE/i);
  });
});

describe("P4.5-B1 · services Monde structurels", () => {
  const teacher = read("src/lib/assignments/teacher.ts");
  const student = read("src/lib/assignments/student.ts");
  const transitions = read("src/lib/assignments/transitions.ts");

  it("teacher.ts · 12 fonctions exportées minimum", () => {
    for (const fn of [
      "listTeacherAssignments", "getTeacherAssignment",
      "createTeacherAssignmentDraft", "updateTeacherAssignmentDraft",
      "publishTeacherAssignment", "closeTeacherAssignment",
      "listAssignmentSubmissions", "getTeacherSubmission",
      "createAssignmentFeedbackDraft", "updateAssignmentFeedbackDraft",
      "publishAssignmentFeedback", "createAssignmentFeedbackAddendum",
    ]) {
      expect(teacher).toMatch(new RegExp(`export async function ${fn}\\b`));
    }
  });

  it("student.ts · 8 fonctions exportées minimum", () => {
    for (const fn of [
      "listStudentAssignments", "getStudentAssignment",
      "getStudentSubmission", "createStudentSubmissionDraft",
      "updateStudentSubmissionDraft", "submitStudentSubmission",
      "createStudentSubmissionVersion", "listStudentFeedback",
    ]) {
      expect(student).toMatch(new RegExp(`export async function ${fn}\\b`));
    }
  });

  it("teacher services · audits in-tx (writeAuditEvent(..., tx))", () => {
    // Chaque appel writeAuditEvent doit être in-tx · pas de void fire-and-forget.
    expect(teacher).not.toMatch(/void\s+writeAuditEvent/);
    // 5 changements d'état émettent un audit ·
    // ASSIGNMENT_CREATED / PUBLISHED / CLOSED / FEEDBACK_DRAFTED / PUBLISHED / ADDENDUM.
    for (const action of [
      "ASSIGNMENT_CREATED", "ASSIGNMENT_PUBLISHED", "ASSIGNMENT_CLOSED",
      "FEEDBACK_DRAFTED", "FEEDBACK_PUBLISHED", "FEEDBACK_ADDENDUM_CREATED",
    ]) {
      expect(teacher).toMatch(new RegExp(`action:\\s*"${action}"`));
    }
  });

  it("student services · audits in-tx pour SUBMISSION_CREATED + SUBMITTED", () => {
    expect(student).not.toMatch(/void\s+writeAuditEvent/);
    for (const action of ["SUBMISSION_CREATED", "SUBMISSION_SUBMITTED"]) {
      expect(student).toMatch(new RegExp(`action:\\s*"${action}"`));
    }
  });

  it("transitions.ts · MAX_MONDE_SUBMISSION_WORDS = 1000 (distinct 250 Racines)", () => {
    expect(transitions).toMatch(/MAX_MONDE_SUBMISSION_WORDS\s*=\s*1000/);
  });

  it("services · aucun audio / storageObjectId accepté en input", () => {
    // Guards texte-only présents dans teacher.
    expect(teacher).toMatch(/assertMondeTextOnlyProductionType|assertMondeTextOnlyFeedback/);
  });
});

describe("P4.5-B1 · mapper assignmentErrors sans leak Prisma", () => {
  const mapper = read("src/lib/api/assignmentErrors.ts");

  it("mappe P2034 / 40001 / TransactionWriteConflict → concurrent_assignment_update 409", () => {
    expect(mapper).toMatch(/40001|P2034|TransactionWriteConflict/);
    expect(mapper).toMatch(/concurrent_assignment_update/);
  });

  it("ne réponse jamais avec err(\"P2034\") ni \"TransactionWriteConflict\"", () => {
    expect(mapper).not.toMatch(/err\("P2034"/);
    expect(mapper).not.toMatch(/err\("TransactionWriteConflict"/);
  });

  it("ne retourne pas de stack Prisma en fallback", () => {
    expect(mapper).toMatch(/return err\("INTERNAL"/);
  });

  it("trigger immutabilité DB remonte code stable submission_immutable / feedback_immutable", () => {
    expect(mapper).toMatch(/submission_immutable/);
    expect(mapper).toMatch(/feedback_immutable/);
  });
});

describe("P4.5-B1 · codes d'erreur stables (§11 brief)", () => {
  it("liste blanche complète · codes B ajoutés à P4_5_STABLE_ERROR_CODES", () => {
    for (const code of [
      // Assignments
      "assignment_immutable",
      "invalid_assignment_transition",
      "audio_feedback_disabled",
      // Submissions
      "submission_too_long",
      "invalid_submission_transition",
      "student_access_required",
      // Feedback
      "invalid_feedback_transition",
      // Concurrence
      "concurrent_feedback_update",
    ]) {
      expect(P4_5_STABLE_ERROR_CODES).toContain(code);
    }
  });

  it("ConcurrentUpdateError accepte concurrent_feedback_update", () => {
    const e = new ConcurrentUpdateError("concurrent_feedback_update", "msg");
    expect(e.code).toBe("concurrent_feedback_update");
    expect(e.message).not.toMatch(/P2034|TransactionWriteConflict|40001/);
  });
});

describe("P4.5-B1 · resolver Student patterns", () => {
  const r = read("src/lib/permissions/student.ts");

  it("exporte resolveStudentActor + resolveStudentActorOrNull", () => {
    expect(r).toMatch(/export async function resolveStudentActor\b/);
    expect(r).toMatch(/export async function resolveStudentActorOrNull\b/);
  });

  it("exporte assertStudentCanAccessAssignment + assertStudentOwnsSubmission", () => {
    expect(r).toMatch(/export async function assertStudentCanAccessAssignment\b/);
    expect(r).toMatch(/export async function assertStudentOwnsSubmission\b/);
  });

  it("rôles acceptés · V1 STUDENT + V2 LEARNER (aucun autre)", () => {
    expect(r).toMatch(/role === "STUDENT"/);
    expect(r).toMatch(/appRoles.has\("LEARNER"\)/);
    // Teacher / Coach / Admin ne suffisent pas.
    expect(r).not.toMatch(/appRoles.has\("YEMA_ADMIN"\)/);
    expect(r).not.toMatch(/appRoles.has\("TEACHER"\)/);
  });

  it("émet ASSIGNMENT_ACCESS_DENIED en fire-and-forget sur refus rôle", () => {
    expect(r).toMatch(/ASSIGNMENT_ACCESS_DENIED/);
  });

  it("émet SUBMISSION_ACCESS_DENIED sur assertStudentOwnsSubmission refus", () => {
    expect(r).toMatch(/SUBMISSION_ACCESS_DENIED/);
  });
});

describe("P4.5-B1 · audit helper assignmentEvents", () => {
  const h = read("src/lib/audit/assignmentEvents.ts");

  it("exporte emitAssignmentAccessDeniedAudit + emitAssignmentAuditFromError", () => {
    expect(h).toMatch(/export async function emitAssignmentAccessDeniedAudit\b/);
    expect(h).toMatch(/export async function emitAssignmentAuditFromError\b/);
  });

  it("route les 3 codes vers 3 audit actions distincts", () => {
    expect(h).toMatch(/ASSIGNMENT_ACCESS_DENIED/);
    expect(h).toMatch(/SUBMISSION_ACCESS_DENIED/);
    expect(h).toMatch(/FEEDBACK_ACCESS_DENIED/);
  });
});
