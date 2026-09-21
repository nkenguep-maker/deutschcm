import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const script = readFileSync(resolve(REPO, "scripts/verify-persona-accounts-p1.mjs"), "utf8");
const envExample = readFileSync(resolve(REPO, ".env.p1-baseline.example"), "utf8");
const pkg = readFileSync(resolve(REPO, "package.json"), "utf8");

describe("P-1 real persona account verifier", () => {
  it("models seven distinct adult emails and two child profiles under Family", () => {
    for (const name of [
      "P1_PERSONA_STUDENT_MONDE_EMAIL",
      "P1_PERSONA_STUDENT_RACINES_EMAIL",
      "P1_PERSONA_FAMILY_EMAIL",
      "P1_PERSONA_TEACHER_EMAIL",
      "P1_PERSONA_COACH_EMAIL",
      "P1_PERSONA_CENTER_EMAIL",
      "P1_PERSONA_ADMIN_EMAIL",
    ]) {
      expect(script).toContain(name);
      expect(envExample).toContain(name);
    }
    expect(script).toContain("the seven adult persona emails must be distinct");
    expect(script).toContain("public.child_profiles");
    expect(script).toContain('row.universe === "MONDE"');
    expect(script).toContain('row.universe === "RACINES"');
    expect(script).toContain('"parentUserId" = $1');
  });

  it("refuses Production and targets only the canonical P-1 project", () => {
    expect(script).toContain('P1_REF = "kzzagbojjkivdzzcrmxn"');
    expect(script).toContain('process.env.VERCEL_ENV === "production"');
    expect(script).toContain("P1_BASELINE_CONFIRMED_NOT_PRODUCTION");
    expect(script).toContain("FORBIDDEN_REFS");
  });

  it("is read-only and verifies role/path/Teacher/Center bindings", () => {
    expect(script).toContain("select id, email");
    expect(script).toContain("public.user_roles");
    expect(script).toContain("public.user_app_roles");
    expect(script).toContain("public.learning_paths");
    expect(script).toContain("public.teachers");
    expect(script).toContain("public.language_centers");
    expect(script).not.toMatch(/\b(insert|update|delete)\s+(into\s+)?public\./i);
  });

  it("is exposed through the strict P-1 wrapper", () => {
    expect(pkg).toContain('"verify:persona-accounts:p1"');
    expect(pkg).toContain("run-p4-5-b2-p1.mjs --flag on -- node scripts/verify-persona-accounts-p1.mjs");
  });
});
