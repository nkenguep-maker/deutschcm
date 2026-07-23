// P4.3b · Gardes structurelles · aucun mock rendu, resolver strict, RLS
// migration présente, APIs gated, projections minimales.

import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

function read(rel: string) {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

describe("P4.3b · pages Teacher · aucun mock rendu", () => {
  const pages = [
    "src/app/[locale]/teacher/page.tsx",
    "src/app/[locale]/teacher/classes/page.tsx",
    "src/app/[locale]/teacher/classes/[classroomId]/page.tsx",
    "src/app/[locale]/teacher/students/page.tsx",
    "src/app/[locale]/teacher/schedule/page.tsx",
    "src/app/[locale]/teacher/assignments/page.tsx",
    "src/app/[locale]/teacher/activities/page.tsx",
  ];
  it.each(pages)("%s · aucun const MOCK_/CLASSES/STUDENTS hardcoded", (file) => {
    const s = read(file);
    expect(s).not.toMatch(/const MOCK_\w+\s*=\s*\[/);
    expect(s).not.toMatch(/^const (CLASSES|STUDENTS|ASSIGNMENTS|ACTIVITIES|TOP_STUDENTS|WEEKLY_DEMO)\s*=/m);
    for (const name of [
      "Marie Tchamba", "Sophie Tanda", "Alain Nkolo", "Jean Mbarga",
      "Esther Fouda", "Sophie Beti", "Marie Nguemo", "Olivia Tchamba",
    ]) {
      expect(s, `${file} · leak "${name}"`).not.toContain(name);
    }
  });
  it.each(pages)("%s · flag-gated via isTeacherWorkspaceActive", (file) => {
    const s = read(file);
    expect(s).toMatch(/isTeacherWorkspaceActive\(\)/);
  });
  it.each(pages)("%s · résout Teacher serveur, aucun teacherId/centerId client", (file) => {
    const s = read(file);
    expect(s).toMatch(/resolveTeacherActor/);
    expect(s).not.toMatch(/searchParams\.\s*teacherId/);
    expect(s).not.toMatch(/searchParams\.\s*centerId/);
    expect(s).not.toMatch(/body\.\s*teacherId/);
    expect(s).not.toMatch(/body\.\s*centerId/);
    expect(s).not.toMatch(/searchParams\.get\(["'](teacherId|centerId)["']\)/);
  });
  it.each(pages)("%s · pas 'use client' au top", (file) => {
    const s = read(file);
    expect(s).not.toMatch(/^"use client"/);
  });
});

describe("P4.3b · resolver Teacher · invariants", () => {
  const src = read("src/lib/permissions/teacher.ts");
  it("Utilise findMany({take:2}) défensif", () => {
    expect(src).toMatch(/prisma\.teacher\.findMany\(/);
    expect(src).toMatch(/take:\s*2/);
    expect(src).not.toMatch(/prisma\.teacher\.findFirst\(/);
    expect(src).not.toMatch(/orderBy:\s*\{/);
  });
  it("Refuse rôle absent (403 FORBIDDEN)", () => {
    expect(src).toMatch(/teacher access required/);
    expect(src).toMatch(/"FORBIDDEN"/);
  });
  it("Refuse binding absent (404 NOT_FOUND)", () => {
    expect(src).toMatch(/no teacher membership resolved/);
  });
  it("Refuse binding ambigu (409 CONFLICT)", () => {
    expect(src).toMatch(/teacher scope ambiguous/);
    expect(src).toMatch(/"CONFLICT"/);
    expect(src).toMatch(/teacherRows\.length > 1/);
  });
  it("Ne lit jamais teacherId/centerId/classroomId client", () => {
    expect(src).not.toMatch(/searchParams/);
    expect(src).not.toMatch(/body\./);
  });
  it("assertTeacherOwnsClassroom filtre teacherId", () => {
    expect(src).toMatch(/teacherId: actor\.teacherId/);
  });
});

describe("P4.3b · queries · scope teacherId + pagination", () => {
  const src = read("src/lib/teacher/queries.ts");
  it("Toutes les fonctions reçoivent teacherId", () => {
    for (const fn of [
      "getTeacherDashboard",
      "getTeacherClasses",
      "getTeacherClass",
      "getTeacherClassStudents",
      "getTeacherStudents",
    ]) {
      expect(src).toMatch(new RegExp(`export async function ${fn}\\(`));
    }
  });
  it("Filtres Prisma incluent teacherId", () => {
    expect(src).toMatch(/prisma\.classroom\.(count|findMany|findFirst)\({[\s\S]*?teacherId/);
    expect(src).toMatch(/classroom:\s*\{\s*teacherId/);
  });
  it("Pagination · MAX_PAGE_SIZE = 100", () => {
    expect(src).toMatch(/MAX_PAGE_SIZE = 100/);
  });
  it("Projections · aucun email/phone/hourlyRate/address", () => {
    expect(src).not.toMatch(/email:\s*true/);
    expect(src).not.toMatch(/phone:\s*true/);
    expect(src).not.toMatch(/hourlyRate:\s*true/);
    expect(src).not.toMatch(/address:\s*true/);
    expect(src).not.toMatch(/dateOfBirth/);
  });
  it("Schedule LOCK_HONESTLY (available: false)", () => {
    expect(src).toMatch(/getTeacherSchedule/);
    expect(src).toMatch(/available:\s*false/);
  });
});

describe("P4.3b · APIs · flag-gated + resolver + no client teacherId", () => {
  const routes = [
    "src/app/api/teacher/me/route.ts",
    "src/app/api/teacher/dashboard/route.ts",
    "src/app/api/teacher/classes/route.ts",
    "src/app/api/teacher/classes/[classroomId]/route.ts",
    "src/app/api/teacher/classes/[classroomId]/students/route.ts",
    "src/app/api/teacher/students/route.ts",
    "src/app/api/teacher/schedule/route.ts",
  ];
  it.each(routes)("%s · isTeacherWorkspaceActive gate", (file) => {
    const s = read(file);
    expect(s).toMatch(/isTeacherWorkspaceActive\(\)/);
    expect(s).toMatch(/status:\s*404/);
  });
  it.each(routes)("%s · resolveTeacherActor · jamais teacherId/centerId client", (file) => {
    const s = read(file);
    expect(s).toMatch(/resolveTeacherActor/);
    expect(s).not.toMatch(/searchParams\.get\(["'](teacherId|centerId)["']\)/);
    expect(s).not.toMatch(/body\.\s*(teacherId|centerId)/);
    expect(s).not.toMatch(/headers\.get\(["']x-(teacher|center)-id["']\)/);
  });
});

describe("P4.3b · legacy /api/teacher · 404 stable", () => {
  const src = read("src/app/api/teacher/route.ts");
  it("Aucun accès Prisma client-controlled", () => {
    expect(src).not.toMatch(/prisma\.teacher\.findFirst\(\{[\s\S]*?supabaseId/);
    expect(src).not.toMatch(/prisma\.assignment\.create/);
    expect(src).not.toMatch(/prisma\.classroom\.create/);
    expect(src).not.toMatch(/prisma\.assignmentSubmission\.upsert/);
  });
  it("Retourne 404 teacher_endpoint_deprecated", () => {
    expect(src).toMatch(/teacher_endpoint_deprecated/);
    expect(src).toMatch(/status:\s*404/);
  });
});

describe("P4.3b · feature flags", () => {
  const src = read("src/lib/flags.ts");
  it("TEACHER_WORKSPACE_ENABLED et TEACHER_RLS_CONFIRMED déclarés", () => {
    expect(src).toMatch(/"TEACHER_WORKSPACE_ENABLED"/);
    expect(src).toMatch(/"TEACHER_RLS_CONFIRMED"/);
  });
  it("isTeacherWorkspaceActive combine les deux en prod", () => {
    expect(src).toMatch(/export function isTeacherWorkspaceActive/);
    expect(src).toMatch(/NODE_ENV === "production"/);
    expect(src).toMatch(/getFlag\("TEACHER_RLS_CONFIRMED"\)/);
  });
});

describe("P4.3b · RLS migration présente", () => {
  const migrationsDir = "prisma/migrations";
  it("Migration p4_3b_teacher_rls existe", () => {
    const dirs = readdirSync(join(process.cwd(), migrationsDir));
    const match = dirs.find((d) => d.endsWith("p4_3b_teacher_rls"));
    expect(match, "no migration matching p4_3b_teacher_rls").toBeTruthy();
    const sqlPath = join(migrationsDir, match!, "migration.sql");
    expect(existsSync(join(process.cwd(), sqlPath))).toBe(true);
    const sql = read(sqlPath);
    // Helpers requis
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.is_teacher\(/);
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.is_teacher_for_classroom\(/);
    // Policies requises
    expect(sql).toMatch(/ALTER TABLE public\.teachers ENABLE ROW LEVEL SECURITY/);
    expect(sql).toMatch(/ALTER TABLE public\.classrooms ENABLE ROW LEVEL SECURITY/);
    expect(sql).toMatch(/ALTER TABLE public\.classroom_enrollments ENABLE ROW LEVEL SECURITY/);
    // Grants minimaux
    expect(sql).toMatch(/REVOKE ALL ON FUNCTION public\.is_teacher\(TEXT\) FROM PUBLIC/);
    expect(sql).toMatch(/GRANT EXECUTE ON FUNCTION public\.is_teacher\(TEXT\) TO authenticated/);
    // search_path verrouillé
    expect(sql).toMatch(/SET search_path = public, pg_temp/);
    // Auditing enum values
    expect(sql).toMatch(/TEACHER_ACCESS_DENIED/);
    expect(sql).toMatch(/TEACHER_SCOPE_AMBIGUOUS/);
  });
  it("Migration p4_3b_teacher_rls_fix existe (helpers SECURITY DEFINER)", () => {
    const dirs = readdirSync(join(process.cwd(), migrationsDir));
    const match = dirs.find((d) => d.endsWith("p4_3b_teacher_rls_fix"));
    expect(match, "no migration matching p4_3b_teacher_rls_fix").toBeTruthy();
    const sql = read(join(migrationsDir, match!, "migration.sql"));
    expect(sql).toMatch(/SECURITY DEFINER/);
    expect(sql).toMatch(/is_teacher_for_classroom/);
  });
  it("Migration p4_3b_teacher_rls_admin_fix retire is_yema_admin des 4 policies", () => {
    const dirs = readdirSync(join(process.cwd(), migrationsDir));
    const match = dirs.find((d) => d.endsWith("p4_3b_teacher_rls_admin_fix"));
    expect(match, "no migration matching p4_3b_teacher_rls_admin_fix").toBeTruthy();
    const sql = read(join(migrationsDir, match!, "migration.sql"));
    // Les 4 policies doivent être recréées SANS bypass is_yema_admin.
    expect(sql).toMatch(/DROP POLICY IF EXISTS teachers_select_self/);
    expect(sql).toMatch(/DROP POLICY IF EXISTS classrooms_select_teacher_scope/);
    expect(sql).toMatch(/DROP POLICY IF EXISTS enrollments_select_owner_or_teacher/);
    expect(sql).toMatch(/DROP POLICY IF EXISTS class_join_requests_select_scope/);
    expect(sql).toMatch(/CREATE POLICY teachers_select_self/);
    expect(sql).toMatch(/CREATE POLICY classrooms_select_teacher_scope/);
    expect(sql).toMatch(/CREATE POLICY enrollments_select_owner_or_teacher/);
    expect(sql).toMatch(/CREATE POLICY class_join_requests_select_scope/);
    // Aucun bypass is_yema_admin dans les USING clauses des 4 nouvelles
    // policies · on inspecte chaque bloc CREATE POLICY individuellement.
    const createBlocks = sql.match(/CREATE POLICY [\s\S]*?USING \([\s\S]*?\);/g) ?? [];
    expect(createBlocks.length).toBeGreaterThanOrEqual(4);
    for (const block of createBlocks) {
      expect(block, `bypass in policy: ${block.slice(0, 100)}`).not.toMatch(/is_yema_admin/);
    }
    // Student self-view et fromUser self-view préservés.
    expect(sql).toMatch(/"userId" = public\.current_app_user_id\(\)/);
    expect(sql).toMatch(/"fromUserId" = public\.current_app_user_id\(\)/);
  });
});

describe("P4.3b hardening · AuditEvents wiring (permissions/teacher.ts)", () => {
  const src = read("src/lib/permissions/teacher.ts");
  it("Émet TEACHER_ACCESS_DENIED sur rôle absent", () => {
    expect(src).toMatch(/action:\s*"TEACHER_ACCESS_DENIED"/);
    expect(src).toMatch(/reasonCode:\s*"role_missing"/);
  });
  it("Émet TEACHER_SCOPE_AMBIGUOUS sur multi-binding", () => {
    expect(src).toMatch(/action:\s*"TEACHER_SCOPE_AMBIGUOUS"/);
    expect(src).toMatch(/reasonCode:\s*"multi_teacher_row"/);
  });
  it("Émet TEACHER_CLASS_ACCESS_DENIED sur classroom étranger", () => {
    expect(src).toMatch(/action:\s*"TEACHER_CLASS_ACCESS_DENIED"/);
    expect(src).toMatch(/reasonCode:\s*"cross_teacher"/);
  });
  it("Émet TEACHER_STUDENT_ACCESS_DENIED sur étudiant hors scope", () => {
    expect(src).toMatch(/action:\s*"TEACHER_STUDENT_ACCESS_DENIED"/);
    expect(src).toMatch(/reasonCode:\s*"student_not_in_teacher_class"/);
  });
  it("Aucun email/phone/nom complet passé dans metadata", () => {
    // La lecture inclut les 4 blocs metadata · aucun ne doit exposer un champ
    // sensible.
    for (const forbidden of ["email:", "phone:", "fullName:", "dateOfBirth:", "token:", "cookie:"]) {
      expect(src, `metadata leak: ${forbidden}`).not.toMatch(new RegExp(`\\bmetadata:[^}]*${forbidden}`));
    }
  });
});

describe("P4.3b hardening · YEMA_ADMIN rule", () => {
  const src = read("src/lib/permissions/teacher.ts");
  it("Documente la règle · rôle global ne suffit pas", () => {
    // Le header docstring doit mentionner explicitement le contrat YEMA_ADMIN.
    expect(src).toMatch(/YEMA_ADMIN/);
    // "rôle global" peut être scindé sur deux lignes de comment · on cherche
    // dans le fichier normalisé (retire les préfixes // et compresse les blancs).
    const normalized = src.replace(/\/\/\s*/g, "").replace(/\s+/g, " ");
    expect(normalized).toMatch(/rôle global/i);
    expect(normalized).toMatch(/ZERO_BINDING|zero binding|rôle global.*(?:ne|pas)/i);
  });
  it("actorRole retourne YEMA_ADMIN ou TEACHER selon appRoles", () => {
    expect(src).toMatch(/actorRole:\s*appRoles\.has\("YEMA_ADMIN"\)\s*\?\s*"YEMA_ADMIN"/);
  });
});
