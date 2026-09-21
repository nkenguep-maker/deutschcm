import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

const migration = read(
  "prisma/migrations/20260919000008_p0_8_classes_centres_rls_baseline/migration.sql",
);
const executableSql = migration
  .split("\n")
  .filter((line) => !line.trimStart().startsWith("--"))
  .join("\n");

const TABLES = [
  "classes",
  "class_memberships",
  "class_assignments",
  "submissions",
  "class_feedback",
  "provider_profiles",
  "language_centers",
  "center_applications",
  "teacher_applications",
  "level_history",
];

describe("P0.8 · classes/centres RLS baseline", () => {
  it("enables RLS on all ten target tables", () => {
    for (const table of TABLES) {
      expect(executableSql).toContain(
        `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`,
      );
    }
  });

  it("keeps direct client table access deny-by-default", () => {
    for (const table of TABLES) {
      expect(executableSql).toContain(
        `REVOKE ALL PRIVILEGES ON TABLE public.${table} FROM PUBLIC, anon, authenticated;`,
      );
      expect(executableSql).not.toMatch(
        new RegExp(`CREATE\\s+POLICY[\\s\\S]*?ON\\s+public\\.${table}\\b`, "i"),
      );
    }
  });

  it("preserves the trusted Prisma server path", () => {
    expect(executableSql).not.toContain("FORCE ROW LEVEL SECURITY");
    expect(executableSql).not.toMatch(
      /GRANT\s+.+\s+TO\s+(?:anon|authenticated)\b/i,
    );
  });
});

describe("level-history authorization hardening", () => {
  const route = read("src/app/api/level-history/route.ts");

  it("requires same-origin for mutations", () => {
    expect(route).toContain("isSameOriginRequest(request)");
    expect(route).toContain('status: 403');
  });

  it("allows self/admin reads and scopes teacher reads to owned active classrooms", () => {
    expect(route).toContain("if (actor.id === studentUserId) return true");
    expect(route).toContain('if (actor.role === "ADMIN") return true');
    expect(route).toContain('if (actor.role !== "TEACHER") return false');
    expect(route).toContain("teacherOwnsStudent(actor.id, studentUserId)");
    expect(route).toContain("classroom: {");
    expect(route).toContain("teacherId: teacher.id");
    expect(route).toContain("isActive: true");
  });

  it("scopes teacher writes to their own enrolled students", () => {
    expect(route).toContain(
      'actor.role === "TEACHER" && !(await teacherOwnsStudent(actor.id, studentId))',
    );
    expect(route).toContain('return NextResponse.json({ error: "Not found" }, { status: 404 })');
  });

  it("bounds level and reason input before writing", () => {
    expect(route).toContain('const LEVELS = new Set(["A1", "A2", "B1", "B2", "C1", "C2"])');
    expect(route).toContain("MAX_REASON_CHARS = 500");
    expect(route).toContain("LEVELS.has(newLevel)");
    expect(route).toContain("reason.length > MAX_REASON_CHARS");
  });
});
