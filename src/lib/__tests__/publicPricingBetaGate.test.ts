import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

describe("commercial surfaces · offers visible, payments deferred", () => {
  it("routes the pricing threshold to the two commercial universes", () => {
    const threshold = read("src/app/[locale]/pricing/page.tsx");
    expect(threshold).toContain('href={`/${locale}/pricing/monde`}');
    expect(threshold).toContain('href={`/${locale}/pricing/racines`}');
  });

  it("renders Monde prices and carries Passage + optional add-ons into registration", () => {
    const page = read("src/app/[locale]/pricing/monde/page.tsx");
    expect(page).toContain("WORLD_PASSAGE_PRICES");
    expect(page).toContain("WORLD_TEACHER_ADD");
    expect(page).toContain('const passagePlan = `passage-${level.toLowerCase()}`');
    expect(page).toContain("plan=${passagePlan}");
    expect(page).toContain("prof=1");
    expect(page).toContain('data-addon="roots-solo"');
    expect(page).toContain("addon=roots-solo");
    expect(page).toContain("AFRICAN_SOLO");
    expect(page).toContain("no charge is made today");
    expect(page).not.toContain("stripe");
    expect(page).not.toContain("checkout");
  });

  it("renders Racines Solo, Family and coach pricing without triggering payment", () => {
    const page = read("src/app/[locale]/pricing/racines/page.tsx");
    expect(page).toContain("AFRICAN_SOLO");
    expect(page).toContain("AFRICAN_FAMILY");
    expect(page).toContain("RACINES_COACH_ADDON");
    expect(page).toContain("racines-solo");
    expect(page).toContain("racines-famille");
    expect(page).toContain("No payment is triggered today");
    expect(page).not.toContain("stripe");
    expect(page).not.toContain("checkout");
  });

  it("keeps the centralized pricing model intact", () => {
    const pricingModel = read("src/lib/pricing.ts");
    expect(pricingModel).toContain("WORLD_PASSAGE_PRICES");
    expect(pricingModel).toContain("AFRICAN_SOLO");
    expect(pricingModel).toContain("AFRICAN_FAMILY");
    expect(pricingModel).toContain("RACINES_COACH_ADDON");
  });
});
