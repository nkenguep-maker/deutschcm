import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

describe("dashboard messaging surfaces", () => {
  it("uses the real inbox availability component instead of stale soon placeholders", () => {
    for (const path of [
      "src/features/dashboards/family/sections/FamilyMessagesSection.tsx",
      "src/features/dashboards/teacher/sections/TeacherMessagesSection.tsx",
      "src/features/dashboards/coach-racines/sections/CoachMessagesSection.tsx",
    ]) {
      const source = read(path);
      expect(source).toContain("MessagesInboxLink");
      expect(source).not.toContain('t("soon")');
    }

    const inbox = read("src/features/messaging/MessagesInboxLink.tsx");
    expect(inbox).toContain('t("featureDisabled")');
    expect(inbox).toContain('t("openMessages")');
    expect(inbox).toContain("if (!r.ok) throw new Error");
  });
});
