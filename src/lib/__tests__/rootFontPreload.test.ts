import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "src/app/layout.tsx"), "utf8");

describe("root font loading", () => {
  it("lets CSS load self-hosted fonts without duplicate preload requests", () => {
    expect(source.match(/preload: false/g)).toHaveLength(3);
    expect(source.match(/display: "swap"/g)).toHaveLength(3);
  });
});
