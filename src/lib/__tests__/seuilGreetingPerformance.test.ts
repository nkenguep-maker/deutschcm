import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { greetingAnimationDelay } from "@/components/seuil/SeuilGreeting";

describe("Seuil greeting initial animation phase", () => {
  it("starts the first entry greeting inside the visible part of the cycle", () => {
    expect(greetingAnimationDelay(0, 2)).toBe(-4_000);
    expect(greetingAnimationDelay(0, 3)).toBe(-3_000);
    expect(greetingAnimationDelay(0, 4)).toBe(-2_400);
  });

  it("keeps the remaining slots distributed across the cycle", () => {
    expect([0, 1].map((slot) => greetingAnimationDelay(slot, 2))).toEqual([-4_000, -8_000]);
    expect([0, 1, 2].map((slot) => greetingAnimationDelay(slot, 3))).toEqual([-3_000, -6_000, -9_000]);
  });

  it("keeps entry greetings off the deferred display-font path", () => {
    const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");

    expect(css).toMatch(
      /\.seuil-greetings-entry \.seuil-greeting-word\s*{[^}]*font-family:\s*Georgia,\s*serif;/,
    );
  });
});
