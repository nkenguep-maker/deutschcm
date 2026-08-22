import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { toMinorUnits } from "@/lib/payments/money";

const seed = readFileSync(resolve(__dirname, "../../../prisma/seed.ts"), "utf8");
const paymentSimulator = readFileSync(
  resolve(__dirname, "../../app/api/internal-test/simulate-payment/route.ts"),
  "utf8",
);

describe("payment money contract", () => {
  it("stores EUR catalogue amounts in cents", () => {
    expect(toMinorUnits("75", "EUR")).toBe(7_500);
    expect(toMinorUnits("9.90", "EUR")).toBe(990);
    expect(toMinorUnits("149", "EUR")).toBe(14_900);
  });

  it("stores zero-decimal XAF catalogue amounts in whole francs", () => {
    expect(toMinorUnits("49000", "XAF")).toBe(49_000);
    expect(() => toMinorUnits("9.90", "XAF")).toThrow("invalid_xaf_amount");
  });

  it("rejects ambiguous or unsafe payment amounts", () => {
    expect(() => toMinorUnits("9.999", "EUR")).toThrow("invalid_eur_amount");
    expect(() => toMinorUnits("-1", "EUR")).toThrow("invalid_eur_amount");
    expect(() => toMinorUnits("0", "EUR")).toThrow("invalid_eur_amount");
  });

  it("seeds Passage and teacher prices from the public pricing source of truth", () => {
    expect(seed).toContain("WORLD_PASSAGE_PRICES");
    expect(seed).toContain("WORLD_TEACHER_ADD");
    expect(seed).toMatch(/PASSAGE_LEVELS[^=]*= LEVELS\.map/);
    expect(seed).toMatch(/TEACHER_ADDON_LEVELS[^=]*= LEVELS\.map/);
    expect(seed).not.toContain('{ level: "A2", xaf:');
  });

  it("keeps Roots offers aligned and blocks coach checkout until operational", () => {
    expect(seed).toContain("AFRICAN_SOLO");
    expect(seed).toContain("AFRICAN_FAMILY");
    expect(seed).toContain("RACINES_COACH_ADDON");
    expect(seed).toMatch(/code: "ROOTS_FOLLOWUP_ADDON"[\s\S]*isActive: RACINES_COACH_OPERATIONAL/);
  });

  it("uses the same minor-unit conversion in internal payment simulations", () => {
    expect(paymentSimulator).toContain('import { toMinorUnits } from "@/lib/payments/money"');
    expect(paymentSimulator).toMatch(/WORLD_PASSAGE_PRICES[\s\S]*toMinorUnits|toMinorUnits[\s\S]*WORLD_PASSAGE_PRICES/);
    expect(paymentSimulator).toMatch(/WORLD_TEACHER_ADD[\s\S]*toMinorUnits|toMinorUnits[\s\S]*WORLD_TEACHER_ADD/);
    expect(paymentSimulator).not.toContain("Math.round(value * 100)");
  });
});
