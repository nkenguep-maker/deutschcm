import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

describe("P0.11 · P-1 Auth hardening runbook", () => {
  const apply = read("scripts/apply-p1-auth-hardening.mjs");
  const verify = read("scripts/verify-p1-auth-hardening.mjs");

  it("hard-locks both scripts to canonical P-1 and blocks known non-P1 refs", () => {
    for (const source of [apply, verify]) {
      expect(source).toContain('const P1_REF = "kzzagbojjkivdzzcrmxn"');
      expect(source).toContain('"sbjhvlrkbyjckdxujjsk"');
      expect(source).toContain('"mamofhrurksyuuolucea"');
      expect(source).toContain('"qggwvonfumuimjfsgpdz"');
      expect(source).toContain('P1_REF !== "kzzagbojjkivdzzcrmxn"');
    }
  });

  it("changes only leaked-password protection in the apply payload", () => {
    expect(apply).toContain('body: JSON.stringify({ password_hibp_enabled: true })');
    expect(apply).not.toMatch(/password_min_length\s*:/);
    expect(apply).not.toMatch(/password_required_characters\s*:/);
    expect(apply).not.toMatch(/disable_signup\s*:/);
  });

  it("verifies the Management API state after the patch", () => {
    expect(apply).toContain("after?.password_hibp_enabled !== true");
    expect(verify).toContain("config?.password_hibp_enabled !== true");
  });

  it("requires a local PAT without logging its value", () => {
    for (const source of [apply, verify]) {
      expect(source).toContain('required("SUPABASE_ACCESS_TOKEN")');
      expect(source).not.toMatch(/console\.(?:log|error|info)\([^)]*token/i);
      expect(source).not.toMatch(/sbp_[A-Za-z0-9_-]+/);
    }
  });
});
