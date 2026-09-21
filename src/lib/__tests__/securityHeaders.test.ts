import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const config = readFileSync(resolve(REPO, "next.config.ts"), "utf8");

describe("browser security headers", () => {
  it("blocks framing and MIME sniffing globally", () => {
    expect(config).toContain('{ key: "X-Content-Type-Options", value: "nosniff" }');
    expect(config).toContain('{ key: "X-Frame-Options", value: "DENY" }');
    expect(config).toContain('source: "/:path*"');
  });

  it("limits referrer leakage", () => {
    expect(config).toContain('value: "strict-origin-when-cross-origin"');
  });

  it("disables unused sensitive browser capabilities while preserving YEMA audio", () => {
    expect(config).toContain("camera=()");
    expect(config).toContain("geolocation=()");
    expect(config).toContain("microphone=(self)");
    expect(config).toContain("payment=()");
    expect(config).toContain("usb=()");
    expect(config).not.toContain("microphone=()");
  });
});
