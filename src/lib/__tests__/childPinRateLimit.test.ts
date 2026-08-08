import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

describe("P4.7 · child PIN brute-force protection", () => {
  it("uses durable audit events instead of an in-memory serverless counter", () => {
    const limiter = read("src/lib/security/childPinRateLimit.ts");

    expect(limiter).toContain("prisma.auditEvent.count");
    expect(limiter).toContain("tx.auditEvent.create");
    expect(limiter).toContain('action: "CHILD_ACCESS_DENIED"');
    expect(limiter).toContain('scopeType: "child_session_pin"');
    expect(limiter).toContain("createdAt: { gte: windowStart() }");
    expect(limiter).toContain("YEMA_CHILD_PIN_MAX_ATTEMPTS");
    expect(limiter).toContain("YEMA_CHILD_PIN_WINDOW_MINUTES");
  });

  it("serializes parallel failures with a transaction-scoped advisory lock", () => {
    const limiter = read("src/lib/security/childPinRateLimit.ts");

    expect(limiter).toContain("prisma.$transaction");
    expect(limiter).toContain("pg_advisory_xact_lock");
    expect(limiter).toContain("hashtext");
  });

  it("checks the quota before PIN verification and records only invalid attempts", () => {
    const route = read("src/app/api/child-session/route.ts");

    const precheck = route.indexOf("isChildPinRateLimited(actor.userId, child.id)");
    const verify = route.indexOf("verifyChildPin(pin, child.pinHash)");
    const record = route.indexOf("recordInvalidChildPinAttempt(actor.userId, child.id)");

    expect(precheck).toBeGreaterThan(-1);
    expect(verify).toBeGreaterThan(precheck);
    expect(record).toBeGreaterThan(verify);
    expect(route).toContain('error: "PIN_RATE_LIMITED"');
    expect(route).toContain("status: 429");
    expect(route).toContain('"Retry-After": String(retryAfter)');
  });

  it("never stores PIN material in the audit metadata", () => {
    const limiter = read("src/lib/security/childPinRateLimit.ts");

    expect(limiter).not.toContain("pinHash");
    expect(limiter).not.toMatch(/metadata\s*:\s*\{\s*pin\s*:/);
    expect(limiter).toMatch(/metadata\s*:\s*\{[\s\S]*?reason\s*:\s*"pin_invalid"[\s\S]*?\}/);
  });
});
