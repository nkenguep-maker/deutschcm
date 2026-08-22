import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

describe("public accessibility gate", () => {
  it("can audit a deployed Preview without starting a second local server", () => {
    const config = read("playwright.lot-3m-mobile.config.ts");

    expect(config).toContain("process.env.PLAYWRIGHT_BASE_URL");
    expect(config).toContain("CUSTOM_BASE ||");
    expect(config).toContain("...(!CUSTOM_BASE ? {");
  });

  it("waits for rendered fonts without requiring persistent connections to become idle", () => {
    const smoke = read("tests/e2e/lot-3m-mobile/mobile-viewport-smoke.spec.ts");

    expect(smoke).toContain('waitUntil: "load"');
    expect(smoke).toContain("document.fonts.ready");
    expect(smoke).not.toContain('waitUntil: "networkidle"');
  });
});
