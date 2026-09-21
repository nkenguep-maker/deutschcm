import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const src = readFileSync(
  resolve(REPO, "scripts/test-auth-confirmation-p1.mjs"),
  "utf8",
);

describe("P0.12 · fresh-account confirmation P-1 smoke safety", () => {
  it("hard-locks Supabase to P-1 and rejects Production Vercel", () => {
    expect(src).toContain('const P1_REF = "kzzagbojjkivdzzcrmxn"');
    expect(src).toContain('"sbjhvlrkbyjckdxujjsk"');
    expect(src).toContain('"deutschcm.vercel.app"');
    expect(src).toContain("P1_BASELINE_CONFIRMED_NOT_PRODUCTION");
  });

  it("uses a real signup confirmation link and verifies callback reconciliation", () => {
    expect(src).toContain('type: "signup"');
    expect(src).toContain("admin.auth.admin.generateLink");
    expect(src).toContain("/auth/callback?next=");
    expect(src).toContain('finalUrl.pathname !== "/fr/onboarding/persona"');
    expect(src).toContain('page.request.get(previewOrigin + "/api/me")');
    expect(src).toContain("email_confirmed_at");
    expect(src).toContain('public.users where "supabaseId" = $1');
  });

  it("cleans both the app identity and P-1 Auth user", () => {
    expect(src).toContain('delete from public.users where "supabaseId" = $1');
    expect(src).toContain("admin.auth.admin.deleteUser(authUserId)");
    expect(src).toContain("temporary P-1 Auth cleanup failed");
  });

  it("never logs credentials", () => {
    expect(src).not.toMatch(/console\.(?:log|error|info)\([^)]*(?:serviceRole|password)/i);
    expect(src).not.toMatch(/sbp_[A-Za-z0-9_-]+/);
  });
});
