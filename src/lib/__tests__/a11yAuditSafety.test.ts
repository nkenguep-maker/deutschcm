import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const audit = readFileSync(resolve(REPO, "scripts/audit-a11y.mjs"), "utf8");

describe("public axe audit safety", () => {
  it("fails when a configured public page returns a non-2xx response", () => {
    expect(audit).toContain('const response = await page.goto(url');
    expect(audit).toContain("!response || !response.ok()");
    expect(audit).toContain("expected a public 2xx response");
  });
});
