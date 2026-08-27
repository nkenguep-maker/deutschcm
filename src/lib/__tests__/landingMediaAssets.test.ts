import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const SOURCES = [
  "src/components/maison/MaisonVisages.tsx",
  "src/lib/voix/stories.ts",
];

function declaredLocalMedia(source: string) {
  return [...source.matchAll(/(?:portraitSrc|audioSrc):\s*"([^\"]+)"/g)]
    .map((match) => match[1])
    .filter((path) => path.startsWith("/"));
}

describe("landing voice media", () => {
  it("only declares portrait and audio assets that are shipped in public", () => {
    const media = SOURCES.flatMap((path) =>
      declaredLocalMedia(readFileSync(resolve(REPO, path), "utf8")),
    );

    for (const asset of media) {
      expect(existsSync(resolve(REPO, "public", `.${asset}`))).toBe(true);
    }
  });
});
