import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const layout = readFileSync(resolve(REPO, "src/app/[locale]/beta/layout.tsx"), "utf8");

describe("beta search visibility", () => {
  it("keeps invitation mode private while allowing the open-beta entry point to be indexed", () => {
    expect(layout).toContain("export function generateMetadata");
    expect(layout).toContain("isClosedBetaEnabled()");
    expect(layout).toContain("robots:");
    expect(layout).toContain("index: false");
    expect(layout).toContain("follow: false");
    expect(layout).toContain("nocache: true");
    expect(layout).toContain("robots: { index: true, follow: true }");
  });
});
