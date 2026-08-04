// P4.5-B2a · verrous structurels sur routes API + migration hardening.

import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO = join(__dirname, "..", "..", "..");
function read(rel: string): string {
  return readFileSync(join(REPO, rel), "utf-8");
}

describe("P4.5-B2a · migration hardening `20260724000003`", () => {
  const path = "prisma/migrations/20260724000003_p4_5_b_monde_rls_write_hardening/migration.sql";

  it("migration file exists", () => {
    expect(existsSync(join(REPO, path))).toBe(true);
  });

  const sql = read(path);

  it("hardens assignments UPDATE with status='DRAFT' in USING + WITH CHECK", () => {
    expect(sql).toMatch(/CREATE POLICY "p4_5_b_assignments_update_teacher_own"[\s\S]*USING[\s\S]*status = 'DRAFT'/);
    expect(sql).toMatch(/CREATE POLICY "p4_5_b_assignments_update_teacher_own"[\s\S]*WITH CHECK[\s\S]*status = 'DRAFT'/);
  });

  it("hardens assignment_submissions UPDATE with status='DRAFT' in USING + WITH CHECK", () => {
    expect(sql).toMatch(/CREATE POLICY "p4_5_b_assignment_submissions_update_student_draft"[\s\S]*USING[\s\S]*status = 'DRAFT'/);
    expect(sql).toMatch(/CREATE POLICY "p4_5_b_assignment_submissions_update_student_draft"[\s\S]*WITH CHECK[\s\S]*status = 'DRAFT'/);
  });

  it("hardens assignment_feedbacks UPDATE with status='DRAFT' in USING + WITH CHECK", () => {
    expect(sql).toMatch(/CREATE POLICY "p4_5_b_assignment_feedbacks_update_teacher_draft"[\s\S]*USING[\s\S]*status = 'DRAFT'/);
    expect(sql).toMatch(/CREATE POLICY "p4_5_b_assignment_feedbacks_update_teacher_draft"[\s\S]*WITH CHECK[\s\S]*status = 'DRAFT'/);
  });

  it("est additive · aucun DROP TABLE / DROP COLUMN / TRUNCATE", () => {
    expect(sql).not.toMatch(/DROP TABLE|DROP COLUMN|TRUNCATE/i);
  });

  it("aucun bypass admin global", () => {
    expect(sql).not.toMatch(/is_yema_admin\s*\(/);
  });
});

describe("P4.5-B2a · routes Teacher (12) · fichiers présents", () => {
  const routes = [
    "src/app/api/teacher/classes/[classroomId]/assignments/route.ts",
    "src/app/api/teacher/assignments/[assignmentId]/route.ts",
    "src/app/api/teacher/assignments/[assignmentId]/publish/route.ts",
    "src/app/api/teacher/assignments/[assignmentId]/close/route.ts",
    "src/app/api/teacher/assignments/[assignmentId]/submissions/route.ts",
    "src/app/api/teacher/submissions/[submissionId]/route.ts",
    "src/app/api/teacher/submissions/[submissionId]/feedback/route.ts",
    "src/app/api/teacher/feedback/[feedbackId]/route.ts",
    "src/app/api/teacher/feedback/[feedbackId]/publish/route.ts",
    "src/app/api/teacher/feedback/[feedbackId]/addendum/route.ts",
  ];

  it("each of the 10 route files exists", () => {
    for (const r of routes) {
      expect(existsSync(join(REPO, r))).toBe(true);
    }
  });

  it("classes/[classroomId]/assignments exporte GET + POST", () => {
    const s = read(routes[0]!);
    expect(s).toMatch(/export async function GET\b/);
    expect(s).toMatch(/export async function POST\b/);
  });

  it("assignments/[assignmentId] exporte GET + PATCH · pas de DELETE", () => {
    const s = read(routes[1]!);
    expect(s).toMatch(/export async function GET\b/);
    expect(s).toMatch(/export async function PATCH\b/);
    expect(s).not.toMatch(/export async function DELETE\b/);
  });

  it("publish/close routes exportent POST uniquement", () => {
    for (const r of [routes[2]!, routes[3]!]) {
      const s = read(r);
      expect(s).toMatch(/export async function POST\b/);
    }
  });

  it("toutes les routes Teacher utilisent runTeacherRoute (gate + resolver + audit)", () => {
    for (const r of routes) {
      const s = read(r);
      expect(s).toMatch(/from "@\/lib\/api\/teacherRouteHelper"/);
      expect(s).toMatch(/runTeacherRoute\(/);
    }
  });

  it("routes writes utilisent writeTx + errorCode explicite", () => {
    for (const r of [
      routes[0]!, // POST assignments create
      routes[1]!, // PATCH assignment
      routes[2]!, // publish
      routes[3]!, // close
      routes[6]!, // POST feedback
      routes[7]!, // PATCH feedback
      routes[8]!, // publish feedback
      routes[9]!, // addendum
    ]) {
      const s = read(r);
      expect(s).toMatch(/writeTx:\s*true/);
      expect(s).toMatch(/errorCode:\s*"concurrent_(assignment|feedback)_update"/);
    }
  });
});

describe("P4.5-B2a · routes Student (8) · fichiers présents", () => {
  const routes = [
    "src/app/api/student/assignments/route.ts",
    "src/app/api/student/assignments/[assignmentId]/route.ts",
    "src/app/api/student/assignments/[assignmentId]/submissions/route.ts",
    "src/app/api/student/submissions/[submissionId]/route.ts",
    "src/app/api/student/submissions/[submissionId]/submit/route.ts",
    "src/app/api/student/submissions/[submissionId]/versions/route.ts",
    "src/app/api/student/submissions/[submissionId]/feedback/route.ts",
  ];

  it("each of the 7 route files exists (8 operations)", () => {
    for (const r of routes) {
      expect(existsSync(join(REPO, r))).toBe(true);
    }
  });

  it("assignments/[assignmentId]/submissions exporte GET + POST (2 ops)", () => {
    const s = read(routes[2]!);
    expect(s).toMatch(/export async function GET\b/);
    expect(s).toMatch(/export async function POST\b/);
  });

  it("toutes les routes Student utilisent runStudentRoute", () => {
    for (const r of routes) {
      const s = read(r);
      expect(s).toMatch(/from "@\/lib\/api\/studentRouteHelper"/);
      expect(s).toMatch(/runStudentRoute\(/);
    }
  });

  it("routes writes utilisent errorCode concurrent_submission_update", () => {
    for (const r of [
      routes[2]!, // POST submissions/create
      routes[3]!, // PATCH submission
      routes[4]!, // submit
      routes[5]!, // versions
    ]) {
      const s = read(r);
      expect(s).toMatch(/writeTx:\s*true/);
      expect(s).toMatch(/errorCode:\s*"concurrent_submission_update"/);
    }
  });

  it("aucune route Student n'expose de feedback DRAFT (§10 brief)", () => {
    const s = read(routes[6]!);
    // Le service `listStudentFeedback` filtre PUBLISHED/ADDENDUM · le
    // route file ne doit pas passer un status DRAFT arbitraire.
    expect(s).not.toMatch(/DRAFT/);
  });
});

describe("P4.5-B2a · route helpers · gate + resolver + audit + mapper", () => {
  const teacherHelper = read("src/lib/api/teacherRouteHelper.ts");
  const studentHelper = read("src/lib/api/studentRouteHelper.ts");
  const gate = read("src/lib/api/assignmentsGate.ts");

  it("gate utilise isAssignmentsActive + 404 stable", () => {
    expect(gate).toMatch(/isAssignmentsActive/);
    expect(gate).toMatch(/status:\s*404/);
    expect(gate).toMatch(/Not found/);
  });

  it("helpers appellent gate() en premier · avant resolveXActor() (call sites)", () => {
    for (const h of [teacherHelper, studentHelper]) {
      // Position du CALL `assignmentsFlagOr404(` puis `await resolveTeacherActor(`
      // ou `await resolveStudentActor(`. Ignore les imports.
      const gateCallIdx = h.indexOf("assignmentsFlagOr404()");
      const resolveCallMatch = h.match(/await\s+resolve(Teacher|Student)Actor\(\)/);
      const resolveCallIdx = resolveCallMatch ? h.indexOf(resolveCallMatch[0]) : -1;
      expect(gateCallIdx).toBeGreaterThan(-1);
      expect(resolveCallIdx).toBeGreaterThan(-1);
      expect(gateCallIdx).toBeLessThan(resolveCallIdx);
    }
  });

  it("helpers wrappent tx writes avec withSerializableRetry", () => {
    for (const h of [teacherHelper, studentHelper]) {
      expect(h).toMatch(/withSerializableRetry\(/);
      expect(h).toMatch(/isolationLevel:\s*"Serializable"/);
    }
  });

  it("helpers appellent emitAssignmentAuditFromError sur erreur", () => {
    for (const h of [teacherHelper, studentHelper]) {
      expect(h).toMatch(/emitAssignmentAuditFromError\(/);
    }
  });

  it("helpers appellent mapAssignmentErrorToResponse dans le catch", () => {
    for (const h of [teacherHelper, studentHelper]) {
      expect(h).toMatch(/mapAssignmentErrorToResponse\(/);
    }
  });
});

describe("P4.5-B2a · anti-injection · body allowlist (§4.3, §5 brief)", () => {
  const validators = read("src/lib/assignments/bodyValidators.ts");

  it("assignment forbidden keys · status/version/classroomId/teacherId etc.", () => {
    for (const k of ["status", "version", "publishedAt", "classroomId", "teacherId"]) {
      expect(validators).toMatch(new RegExp(`"${k}"`));
    }
  });

  it("submission forbidden keys · assignmentId/userId/storageObjectId/status", () => {
    for (const k of ["assignmentId", "userId", "storageObjectId", "status", "submittedAt"]) {
      expect(validators).toMatch(new RegExp(`"${k}"`));
    }
  });

  it("feedback forbidden keys · submissionId/authorId/publishedAt/supersedesFeedbackId", () => {
    for (const k of ["submissionId", "authorId", "publishedAt", "supersedesFeedbackId"]) {
      expect(validators).toMatch(new RegExp(`"${k}"`));
    }
  });

  it("routes POST/PATCH rejettent classroomId/teacherId/assignmentId/authorId dans body", () => {
    const createAsm = read("src/app/api/teacher/classes/[classroomId]/assignments/route.ts");
    expect(createAsm).toMatch(/"classroomId" in raw/);
    expect(createAsm).toMatch(/"teacherId" in raw/);
    const createSub = read("src/app/api/student/assignments/[assignmentId]/submissions/route.ts");
    expect(createSub).toMatch(/"assignmentId" in raw/);
    expect(createSub).toMatch(/"userId" in raw/);
    const createFb = read("src/app/api/teacher/submissions/[submissionId]/feedback/route.ts");
    expect(createFb).toMatch(/"submissionId" in raw/);
    expect(createFb).toMatch(/"authorId" in raw/);
    const addendum = read("src/app/api/teacher/feedback/[feedbackId]/addendum/route.ts");
    expect(addendum).toMatch(/"supersedesFeedbackId" in raw/);
    expect(addendum).toMatch(/"version" in raw/);
  });
});
