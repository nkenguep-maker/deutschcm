import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const runner = readFileSync(resolve(REPO, "scripts/test-open-beta-signup-p1.mjs"), "utf8");
const pkg = JSON.parse(readFileSync(resolve(REPO, "package.json"), "utf8"));

describe("open beta signup P-1 runner safety", () => {
  it("fails closed on project and deployment identity before signup", () => {
    expect(runner).toContain('const P1_REF = "kzzagbojjkivdzzcrmxn"');
    expect(runner).toContain('option("--base-url")');
    expect(runner).toContain('createSignupAlias(option("--inbox"), runId)');
    expect(runner).toContain('page.route("**/*"');
    expect(runner).toContain('target.pathname === "/auth/v1/signup"');
    expect(runner).toContain('target.hostname !== `${P1_REF}.supabase.co`');
    expect(runner).toContain("await route.abort()");
    expect(runner).toContain("signupRequestP1Verified");
    expect(runner).toContain("PRODUCTION_HOSTS.has(target.hostname)");
    expect(runner).toContain("for (const ref of FORBIDDEN_REFS)");
  });

  it("always removes the temporary P-1 Auth user without logging credentials", () => {
    expect(runner).toContain("finally {");
    expect(runner).toContain("admin.auth.admin.deleteUser(authUserId)");
    expect(runner).toContain("temporary P-1 Auth user cleanup failed");
    expect(runner).not.toMatch(/console\.(?:log|error)\([^\n]*(?:email|password|serviceRole)/);
    expect(runner).not.toContain("@example.com");
  });

  it("is exposed only through the strict P-1 wrapper", () => {
    expect(pkg.scripts["test:open-beta-signup:p1"]).toBe(
      "node scripts/test-baseline/run-p4-5-b2-p1.mjs --flag off -- node scripts/test-open-beta-signup-p1.mjs",
    );
  });
});
