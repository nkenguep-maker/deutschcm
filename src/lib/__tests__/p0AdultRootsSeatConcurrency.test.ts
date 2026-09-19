import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

describe("P0.20 · adult ROOTS_FAMILY seat concurrency", () => {
  const seats = read("src/lib/family/adultSeats.ts");
  const grants = read("src/lib/entitlements/grants.ts");
  const migration = read(
    "prisma/migrations/20260919000020_p0_20_adult_roots_seat_uniqueness/migration.sql",
  );

  it("serializes assignments on the household row before counting seats", () => {
    const tx = seats.indexOf("prisma.$transaction");
    const lock = seats.indexOf('SELECT id FROM "households"');
    const count = seats.indexOf("listAssignedAdultRootsSeatsWithDb(householdId, tx)");

    expect(tx).toBeGreaterThan(-1);
    expect(lock).toBeGreaterThan(tx);
    expect(seats).toContain("FOR UPDATE");
    expect(count).toBeGreaterThan(lock);
  });

  it("uses the same transaction for entitlement issuance", () => {
    expect(seats).toContain("grantAdultRootsSeatFromHouseholdGrant(");
    expect(seats).toContain("productVariantId: variantId },\n      tx");
    expect(grants).toContain("db: GrantDb = prisma");
    expect(grants).toContain("return db.accessGrant.create({");
  });

  it("adds DB defense against duplicate active adult seats", () => {
    expect(migration).toContain(
      "access_grants_one_active_adult_roots_seat_per_household_user_idx",
    );
    expect(migration).toContain('ON public.access_grants ("sourceId", "beneficiaryId")');
    expect(migration).toContain('\"sourceType\" = \'SUBSCRIPTION\'::\"GrantSourceType\"');
    expect(migration).toContain('\"beneficiaryType\" = \'USER\'::\"BeneficiaryType\"');
    expect(migration).toContain('status = \'ACTIVE\'::\"GrantStatus\"');
    expect(migration).toContain("metadata->>'seatType' = 'ADULT_ROOTS'");
  });
});
