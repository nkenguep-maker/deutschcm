import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

describe("landing hero performance budget", () => {
  it("reveals the first-visit conversion content without a cinematic delay", () => {
    const seuil = read("src/components/seuil/Seuil.tsx");
    const css = read("src/app/globals.css");
    const revealMs = Number(seuil.match(/FIRST_VISIT_REVEAL_MS = (\d+)/)?.[1]);
    const staggerMs = [...seuil.matchAll(/--stagger[^\n]+"(\d+)ms"/g)]
      .map((match) => Number(match[1]));

    expect(revealMs).toBeLessThanOrEqual(250);
    expect(Math.max(...staggerMs)).toBeLessThanOrEqual(800);
    expect(css).toContain("transition: opacity 700ms var(--ease-enter) var(--stagger, 0ms)");
    expect(css).not.toContain("var(--ease-enter) 4200ms");
  });
});
