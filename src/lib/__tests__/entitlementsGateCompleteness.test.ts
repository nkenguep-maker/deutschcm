import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../../..");
const orchestrator = readFileSync(
  resolve(ROOT, "scripts/orchestrate-entitlements-p1.mjs"),
  "utf8",
);
const credentialAligner = readFileSync(
  resolve(ROOT, "scripts/test-baseline/align-yema-qa-passwords-p1.mjs"),
  "utf8",
);

describe("P-1 entitlements gate completeness", () => {
  it("stops immediately on failures instead of printing a false ALL OK", () => {
    expect(orchestrator).toMatch(/function fail[\s\S]*throw new Error\(msg\)/);
  });

  it("runs the canonical adult-seat scenario instead of deferring it", () => {
    expect(orchestrator).toContain('"tsx", "scripts/test-roots-adult-seats-p1.ts"');
    expect(orchestrator).not.toContain("test actif 3e adulte différé");
  });

  it("does not forge browser Origin or Host headers in its server-side HTTP harness", () => {
    expect(orchestrator).not.toMatch(/const (H|sH|f2H) = \{[^\n]*(Origin|Host):/);
    expect(orchestrator).toContain('const H = { Cookie: familyCookie, "Content-Type": "application/json" };');
  });

  it("aligns and verifies the isolated family account before entitlement checks", () => {
    expect(credentialAligner).toContain('"test_yema_qa_family2@example.com"');
    expect(credentialAligner).toContain("signInWithPassword");
    expect(orchestrator).toContain('"scripts/test-baseline/align-yema-qa-passwords-p1.mjs"');
    expect(orchestrator.indexOf("P-1 QA credential alignment")).toBeLessThan(
      orchestrator.indexOf("STEP 1 · catalogue produits présent"),
    );
  });
});
