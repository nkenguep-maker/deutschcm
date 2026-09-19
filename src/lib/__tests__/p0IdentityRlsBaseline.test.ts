import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const migration = readFileSync(
  resolve(
    REPO,
    "prisma/migrations/20260919000001_p0_1_identity_rls_baseline/migration.sql",
  ),
  "utf8",
);

const TABLES = ["users", "user_roles", "user_app_roles", "learning_paths"];
const executableSql = migration
  .split("\n")
  .filter((line) => !line.trimStart().startsWith("--"))
  .join("\n");

describe("P0.1 · identity foundation RLS baseline", () => {
  it("enables RLS on the four identity foundation tables", () => {
    for (const table of TABLES) {
      expect(migration).toContain(
        `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`,
      );
    }
  });

  it("keeps the client boundary deny-by-default", () => {
    for (const table of TABLES) {
      expect(migration).toContain(
        `REVOKE ALL PRIVILEGES ON TABLE public.${table} FROM PUBLIC, anon, authenticated;`,
      );
      expect(migration).not.toMatch(
        new RegExp(`CREATE\\s+POLICY[\\s\\S]*?ON\\s+public\\.${table}\\b`, "i"),
      );
    }
  });

  it("does not force RLS on the trusted Prisma server path", () => {
    expect(executableSql).not.toContain("FORCE ROW LEVEL SECURITY");
    expect(executableSql).not.toMatch(/GRANT\s+.+\s+TO\s+(?:anon|authenticated)\b/i);
  });
});
