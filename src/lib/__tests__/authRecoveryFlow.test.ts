import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

describe("authentication recovery experience", () => {
  it("keeps mixed Monde and Racines greetings on both shared recovery pages", () => {
    const forgot = read("src/app/[locale]/auth/forgot-password/page.tsx");
    const reset = read("src/app/[locale]/auth/reset-password/page.tsx");

    for (const page of [forgot, reset]) {
      expect(page).toContain('import { SeuilGreetings }');
      expect(page).toContain('<SeuilGreetings locale={loc} visibleCount={3} pool="all" variant="entry" />');
    }
  });

  it("preserves the intended destination through reset and back to login", () => {
    const forgot = read("src/app/[locale]/auth/forgot-password/page.tsx");
    const reset = read("src/app/[locale]/auth/reset-password/page.tsx");

    expect(forgot).toContain("sanitizeInternalNext");
    expect(forgot).toContain("/auth/callback?next=");
    expect(forgot).toContain("encodeURIComponent(safeNext)");
    expect(reset).toContain("sanitizeInternalNext");
    expect(reset).toContain("router.replace(safeNext)");
  });
});
