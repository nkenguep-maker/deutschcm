import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const migration = readFileSync(
  resolve(
    REPO,
    "prisma/migrations/20260919000003_p0_3_family_ownership_rls_baseline/migration.sql",
  ),
  "utf8",
);
const executableSql = migration
  .split("\n")
  .filter((line) => !line.trimStart().startsWith("--"))
  .join("\n");

const TABLES = ["households", "household_memberships", "dependent_profiles"];

describe("P0.3 · family ownership RLS baseline", () => {
  it("enables RLS on the three family ownership tables", () => {
    for (const table of TABLES) {
      expect(executableSql).toContain(
        `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`,
      );
    }
  });

  it("keeps family ownership data deny-by-default for clients", () => {
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
