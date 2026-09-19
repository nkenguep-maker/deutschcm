import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, relative } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

function runtimeSourceFiles(root: string): string[] {
  const absolute = resolve(REPO, root);
  const out: string[] = [];

  function walk(dir: string) {
    for (const name of readdirSync(dir)) {
      const full = resolve(dir, name);
      const rel = relative(REPO, full).replaceAll("\\", "/");
      if (rel.includes("/__tests__/")) continue;
      const stat = statSync(full);
      if (stat.isDirectory()) {
        walk(full);
      } else if (/\.(?:ts|tsx|js|mjs)$/.test(name)) {
        out.push(rel);
      }
    }
  }

  walk(absolute);
  return out;
}

describe("P0.17 · AccessGrant provenance", () => {
  it("requires an exact confirmed payment before issuing an ORDER grant", () => {
    const source = read("src/lib/entitlements/grants.ts");

    expect(source).toContain('item.order.status !== "PAID"');
    expect(source).toContain('payment.status === "CONFIRMED"');
    expect(source).toContain("payment.confirmedAt !== null");
    expect(source).toContain("payment.currency === item.order.currency");
    expect(source).toContain("payment.amount === item.order.total");
    expect(source).toContain('sourceType: "ORDER"');
    expect(source).toContain("sourceId: item.order.id");
    expect(source).toContain("orderItemId: item.id");
  });

  it("makes the low-level seed helper test-only", () => {
    const source = read("src/lib/entitlements/grants.ts");

    expect(source).toContain('process.env.NODE_ENV !== "test"');
    expect(source).toContain(
      "createGrant is test-only; use a provenance-specific grant factory",
    );
  });

  it("routes runtime AccessGrant creation through the canonical factory", () => {
    const offenders = [...runtimeSourceFiles("src/app"), ...runtimeSourceFiles("src/lib")]
      .filter((path) => path !== "src/lib/entitlements/grants.ts")
      .filter((path) => {
        const source = read(path);
        return /\.accessGrant\.(?:create|createMany)\s*\(/.test(source);
      });

    expect(offenders, `direct runtime AccessGrant writes: ${offenders.join(", ")}`).toEqual([]);
  });

  it("gates simulated payments to canonical P-1 before parsing or writes", () => {
    const source = read("src/app/api/internal-test/simulate-payment/route.ts");
    const envGate = source.indexOf("isInternalTestEnvironment()");
    const originGate = source.indexOf("isSameOriginRequest(req)");
    const formParse = source.indexOf("req.formData()");

    expect(envGate).toBeGreaterThan(-1);
    expect(originGate).toBeGreaterThan(envGate);
    expect(formParse).toBeGreaterThan(originGate);
    expect(source).toContain("grantFromOrderItem(item.id, tx)");
    expect(source).toContain("grantFromOrderItem(teacherItem.id, tx)");
    expect(source).not.toContain("tx.accessGrant.create(");
  });

  it("keeps the legacy dev simulator P-1-only and same-origin", () => {
    const source = read("src/app/api/dev/simulate-order/route.ts");

    expect(source).toContain('process.env.NODE_ENV !== "development"');
    expect(source).toContain("!isInternalTestEnvironment()");
    expect(source).toContain("isSameOriginRequest(request)");
    expect(source).toContain("grantFromOrderItem(item.id)");
  });

  it("ships a read-only P-1 provenance gate", () => {
    const source = read("scripts/test-baseline/p0-17-grant-provenance-gate.mjs");

    expect(source).toContain("g.\"sourceType\"::text = 'ORDER'");
    expect(source).toContain('g.\"productVariantId\" <> oi.\"productVariantId\"');
    expect(source).toContain("p.status::text = 'CONFIRMED'");
    expect(source).toContain("p.amount = o.total");
    expect(source).toContain("\"sourceId\" !~ '^test[_-]'");
    expect(source).not.toMatch(/\b(?:insert|update|delete|alter|grant|revoke)\s+(?:into\s+|from\s+|table\s+)?public\./i);
  });

  it("locks ORDER/orderItem provenance and one-grant-per-item in the database", () => {
    const migration = read(
      "prisma/migrations/20260919000017_p0_17_access_grant_provenance_invariants/migration.sql",
    );

    expect(migration).toContain("access_grants_order_source_consistency");
    expect(migration).toContain('\"sourceType\"::text = \'ORDER\'');
    expect(migration).toContain('\"orderItemId\" IS NOT NULL');
    expect(migration).toContain('\"sourceType\"::text <> \'ORDER\'');
    expect(migration).toContain('\"orderItemId\" IS NULL');
    expect(migration).toContain("access_grants_one_grant_per_order_item_idx");
    expect(migration).toContain('WHERE \"orderItemId\" IS NOT NULL');
  });

});
