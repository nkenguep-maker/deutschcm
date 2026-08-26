import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "src/app/[locale]/register/page.tsx"),
  "utf8",
);

describe("registration confirmation resend cooldown", () => {
  it("blocks repeat requests for one minute after a send or rate limit", () => {
    expect(source).toContain("const RESEND_COOLDOWN_SECONDS = 60");
    expect(source).toContain('if (resendCooldown > 0 || resendState === "sending") return');
    expect(source).toContain("setResendCooldown(RESEND_COOLDOWN_SECONDS)");
    expect(source).toContain('disabled={resendState === "sending" || resendCooldown > 0}');
  });

  it("shows the countdown and clears it when the email is corrected", () => {
    expect(source).toContain("resendCooldown: (seconds: number)");
    expect(source).toContain("setResendCooldown((seconds) => Math.max(0, seconds - 1))");
    expect(source).toContain("setResendCooldown(0)");
  });
});
