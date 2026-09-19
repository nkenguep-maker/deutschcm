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

  it("keeps the P-1 environment contract disabled-by-default", () => {
    const env = read(".env.p1-baseline.example");
    expect(env).toContain("YEMA_MVP_TRIAL_ENABLED=false");
    expect(env).toContain("YEMA_MVP_TRIAL_COHORT=beta-sept26");
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


describe("P0.21 · canonical factory and onboarding integration", () => {
  const grants = read("src/lib/entitlements/grants.ts");
  const onboarding = read("src/app/api/onboarding/complete/route.ts");
  const gate = read("scripts/test-baseline/p0-21-mvp-trial-gate.mjs");

  it("issues only the two launch-persona trial products", () => {
    expect(grants).toContain("grantMvpTrialForLearningPath");
    expect(grants).toContain('path.universe === "MONDE"');
    expect(grants).toContain('path.language === "DEUTSCH"');
    expect(grants).toContain('path.currentLevel === null || path.currentLevel === "A1"');
    expect(grants).toContain('path.universe === "RACINES"');
    expect(grants).toContain('path.language === "BASSA"');
    expect(grants).toContain('const productCode = isMondeA1 ? "PASSAGE" : "ROOTS_SOLO"');
    expect(grants).toContain('sourceType: "PROMO"');
    expect(grants).toContain('beneficiaryType: "LEARNING_PATH"');
  });

  it("derives trial provenance server-side and serializes duplicate issuance", () => {
    expect(grants).toContain('const sourceId = `mvp-trial:${config.cohort}:${params.userId}:${productCode}`');
    expect(grants).toContain("pg_advisory_xact_lock");
    expect(grants).toContain("kind: MVP_TRIAL_KIND");
    expect(grants).toContain("trialDays: MVP_TRIAL_DAYS");
    expect(grants).toContain('reason: "already_issued"');
  });

  it("hooks trial issuance only into learner onboarding", () => {
    expect(onboarding).toContain(
      'effectivePersona === "student_monde" || effectivePersona === "student_racines"',
    );
    expect(onboarding).toContain("grantMvpTrialForLearningPath({");
    expect(onboarding).toContain("learningPathId: trialPath.id");
    expect(onboarding).not.toContain('effectivePersona === "family" ||');
  });

  it("ships a read-only P-1 runtime gate for trial provenance", () => {
    expect(gate).toContain("access_grants_one_mvp_trial_per_source_idx");
    expect(gate).toContain("metadata->>'kind'='MVP_TRIAL'");
    expect(gate).toContain("invalid MVP trial grant(s)");
    expect(gate).not.toMatch(/\b(?:insert|update|delete|alter|grant|revoke)\s+(?:into\s+|from\s+|table\s+)?public\./i);
  });
});
