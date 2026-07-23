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
    const match = dirs.find((d) => d.includes("p4_3b_teacher_rls"));
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
});
