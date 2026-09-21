import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

describe("study group product surfaces", () => {
  it("keeps group, create and join routes bilingual without runtime Google Fonts imports", () => {
    const groupRoute = read("src/app/[locale]/group/page.tsx");
    const group = read("src/features/groups/StudyGroupPage.tsx");
    const create = read("src/app/[locale]/group/create/page.tsx");
    const join = read("src/app/[locale]/group/join/page.tsx");

    expect(groupRoute).toContain("StudyGroupPage");
    for (const source of [group, create, join]) {
      expect(source).toContain("useLocale");
      expect(source).toContain('locale === "en"');
      expect(source).not.toContain("fonts.googleapis.com");
      expect(source).not.toContain("@import url(");
    }

    expect(group).toContain('"Members"');
    expect(group).toContain('"Membres"');
    expect(create).toContain('"Create a study group"');
    expect(create).toContain('"Créer un groupe d\'étude"');
    expect(join).toContain('"Join a group"');
    expect(join).toContain('"Rejoindre un groupe"');
  });
});
