import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

describe("P0.21 · MVP trial grant contract", () => {
  it("requires an explicit feature flag plus auditable cohort id", () => {
    const source = read("src/lib/release/mvpTrial.ts");
    expect(source).toContain('YEMA_MVP_TRIAL_ENABLED !== "true"');
    expect(source).toContain("YEMA_MVP_TRIAL_COHORT");
    expect(source).toContain("MVP_TRIAL_DAYS = 30");
  });

  it("locks one MVP trial per canonical source in the database", () => {
    const migration = read(
      "prisma/migrations/20260919000021_p0_21_mvp_trial_uniqueness/migration.sql",
    );
    expect(migration).toContain("access_grants_one_mvp_trial_per_source_idx");
    expect(migration).toContain('ON public.access_grants ("sourceId")');
    expect(migration).toContain('"sourceType" = \'PROMO\'::"GrantSourceType"');
    expect(migration).toContain("metadata->>'kind' = 'MVP_TRIAL'");
  });
});
