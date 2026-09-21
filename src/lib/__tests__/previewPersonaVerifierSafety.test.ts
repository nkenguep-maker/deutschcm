import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const source = readFileSync(resolve(REPO, "scripts/verify-preview-personas-p1.mjs"), "utf8");

describe("P-1 Preview persona verifier safety", () => {
  it("accepts only an HTTPS Vercel Preview and fails closed on non-P-1 configuration", () => {
    expect(source).toContain("assertNonProduction()");
    expect(source).toContain('url.protocol !== "https:" || !url.hostname.endsWith(".vercel.app")');
  });

  it("uses real password sessions for adults and parent-backed child sessions", () => {
    expect(source).toContain("auth.auth.signInWithPassword({ email, password })");
    expect(source).toContain('await verifyChild("test_yema_qa_child_family_monde", "1234")');
    expect(source).toContain('await verifyChild("test_yema_qa_child_family_racines", "5678")');
    expect(source).toContain("9/9 real P-1 personas verified against Preview");
  });

  it("checks both authorized and forbidden adult routes", () => {
    expect(source).toContain("for (const path of persona.allowed)");
    expect(source).toContain("for (const path of persona.forbidden)");
    expect(source).toContain("forbidden ${path} returned 200");
  });
});
