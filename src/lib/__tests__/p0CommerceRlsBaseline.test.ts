import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const migration = readFileSync(
  resolve(
    REPO,
    "prisma/migrations/20260919000002_p0_2_commerce_rls_baseline/migration.sql",
  ),
  "utf8",
);
const executableSql = migration
  .split("\n")
  .filter((line) => !line.trimStart().startsWith("--"))
  .join("\n");

const TABLES = [
  "products",
  "product_variants",
  "product_entitlement_rules",
  "orders",
  "order_items",
  "payments",
  "access_grants",
];

describe("P0.2 · commerce and entitlement RLS baseline", () => {
  it("enables RLS on the seven commerce/entitlement tables", () => {
    for (const table of TABLES) {
      expect(executableSql).toContain(
        `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`,
      );
    }
  });

  it("keeps catalogue, orders, payments and grants deny-by-default for clients", () => {
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
