import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

describe("closed beta · public pricing gate", () => {
  it("routes the neutral threshold directly to universe registration", () => {
    const threshold = read("src/app/[locale]/pricing/page.tsx");

    expect(threshold).toContain('href={`/${locale}/register?universe=monde`}');
    expect(threshold).toContain('href={`/${locale}/register?universe=racines`}');
    expect(threshold).not.toContain('href={`/${locale}/pricing/monde`}');
    expect(threshold).not.toContain('href={`/${locale}/pricing/racines`}');
  });

  it.each(["monde", "racines"])(
    "keeps /pricing/%s closed until the commercial phase",
    (universe) => {
      const page = read(`src/app/[locale]/pricing/${universe}/page.tsx`);

      expect(page).toContain('import { redirect } from "next/navigation"');
      expect(page).toContain('redirect(`/${locale}/pricing`)');
      expect(page).not.toContain("WORLD_PASSAGE_PRICES");
      expect(page).not.toContain("AFRICAN_SOLO");
      expect(page).not.toContain("RACINES_COACH_ADDON");
      expect(page).not.toContain("Mobile Money");
      expect(page).not.toContain("fmtPrice");
    },
  );

  it("retains the commercial model for a later explicitly launched phase", () => {
    const pricingModel = read("src/lib/pricing.ts");

    expect(pricingModel).toContain("WORLD_PASSAGE_PRICES");
    expect(pricingModel).toContain("AFRICAN_SOLO");
    expect(pricingModel).toContain("AFRICAN_FAMILY");
    expect(pricingModel).toContain("RACINES_COACH_ADDON");
  });
});
