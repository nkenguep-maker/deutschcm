import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const gate = readFileSync(
  resolve(REPO, "scripts/test-baseline/p0-10-rls-inventory-gate.mjs"),
  "utf8",
);

describe("P0.10 · RLS inventory closure guard", () => {
  it("permits only Prisma's internal migration ledger as the non-RLS exception", () => {
    expect(gate).toContain('const INTERNAL_EXCEPTIONS = new Set(["_prisma_migrations"])');
    expect(gate).toContain('remainingWithoutRls[0] !== "_prisma_migrations"');
    expect(gate).toContain("application tables without RLS");
  });

  it("requires the internal migration ledger to remain inaccessible to client DB roles", () => {
    expect(gate).toContain("information_schema.role_table_grants");
    expect(gate).toContain("table_name = '_prisma_migrations'");
    expect(gate).toContain("grantee in ('anon', 'authenticated')");
    expect(gate).toContain("internalClientGrants.rows.length !== 0");
  });

  it("is a read-only inventory gate", () => {
    expect(gate).not.toMatch(/\bALTER\s+TABLE\b/i);
    expect(gate).not.toMatch(/\bREVOKE\b/i);
    expect(gate).not.toMatch(/\bGRANT\b/i);
    expect(gate).not.toMatch(/\bUPDATE\s+public\./i);
    expect(gate).not.toMatch(/\bDELETE\s+FROM\s+public\./i);
    expect(gate).not.toMatch(/\bINSERT\s+INTO\s+public\./i);
  });
});
