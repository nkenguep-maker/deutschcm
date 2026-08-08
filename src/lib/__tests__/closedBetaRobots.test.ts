import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const layout = readFileSync(resolve(REPO, "src/app/[locale]/beta/layout.tsx"), "utf8");

describe("closed beta search visibility", () => {
  it("keeps beta and invitation routes out of search indexes", () => {
    expect(layout).toContain("export const metadata");
    expect(layout).toContain("robots:");
    expect(layout).toContain("index: false");
    expect(layout).toContain("follow: false");
    expect(layout).toContain("nocache: true");
  });
});
