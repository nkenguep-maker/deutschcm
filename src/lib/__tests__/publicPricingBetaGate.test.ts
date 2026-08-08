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
    expect(page).toContain("until checkout is enabled");
    expect(page).not.toContain("stripe");
    expect(page).not.toContain("/api/checkout");
    expect(page).not.toContain("createCheckout");
    expect(page).not.toContain("accessGrant.create");
    expect(page).not.toContain("order.create");
  });

  it("renders Racines Solo, Family and coach pricing with non-payment coach CTAs", () => {
    const page = read("src/app/[locale]/pricing/racines/page.tsx");
    expect(page).toContain("AFRICAN_SOLO");
    expect(page).toContain("AFRICAN_FAMILY");
    expect(page).toContain("RACINES_COACH_ADDON");
    expect(page).toContain("racines-solo");
    expect(page).toContain("racines-famille");
    expect(page).toContain("addon=roots-coach");
    expect(page).toContain("Solo + coach");
    expect(page).toContain("Family + coach");
    expect(page).toContain("no payment is triggered before payment methods are activated");
    expect(page).toContain("No payment is triggered today");
    expect(page).not.toContain("stripe");
    expect(page).not.toContain("/api/checkout");
    expect(page).not.toContain("createCheckout");
    expect(page).not.toContain("accessGrant.create");
    expect(page).not.toContain("order.create");
  });

  it("carries Roots coach interest through registration and filters it at persona selection", () => {
    const register = read("src/app/[locale]/register/page.tsx");
    const personaRoute = read("src/app/api/onboarding/persona/route.ts");
    expect(register).toContain('rootsCoachSelected = searchParams.get("addon") === "roots-coach"');
    expect(register).toContain('params.set("addon", "roots-coach")');
    expect(register).toContain('selectedAddon ? [selectedAddon] : []');
    expect(personaRoute).toContain('params.rawAddon === "roots-coach" ? "roots-coach" : null');
    expect(personaRoute).toContain("Professional personas never inherit learner/family commercial intent");
    expect(personaRoute).not.toContain("accessGrant.create");
    expect(personaRoute).not.toContain("order.create");
  });

  it("keeps the centralized pricing model intact", () => {
    const pricingModel = read("src/lib/pricing.ts");
    expect(pricingModel).toContain("WORLD_PASSAGE_PRICES");
    expect(pricingModel).toContain("AFRICAN_SOLO");
    expect(pricingModel).toContain("AFRICAN_FAMILY");
    expect(pricingModel).toContain("RACINES_COACH_ADDON");
  });
});
