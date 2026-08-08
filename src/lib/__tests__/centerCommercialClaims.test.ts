import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

describe("center commercial surface before payment integration", () => {
  it("does not promise payment rails, response SLAs or guaranteed learner outcomes", () => {
    const page = read("src/app/[locale]/landing/page.tsx");

    expect(page).toContain("Sans paiement en ligne");
    expect(page).toContain("No online payment yet");
    expect(page).toContain("moyens de paiement seront connectés dans un lot ultérieur");
    expect(page).toContain("payment methods will be connected in a later delivery");

    expect(page).not.toMatch(/sous 48 heures/i);
    expect(page).not.toMatch(/within 48 hours/i);
    expect(page).not.toMatch(/trente jours gratuits/i);
    expect(page).not.toMatch(/thirty days free/i);
    expect(page).not.toMatch(/progressent pas plus vite/i);
    expect(page).not.toMatch(/don't progress faster/i);
    expect(page).not.toMatch(/Mobile Money/i);
    expect(page).not.toMatch(/MTN MoMo/i);
    expect(page).not.toMatch(/Orange Money/i);
  });

  it("keeps the commercial entry useful without executable payment plumbing", () => {
    const page = read("src/app/[locale]/landing/page.tsx");

    expect(page).toContain("/api/apply/center");
    expect(page).toContain("Réserver une démo");
    expect(page).toContain("Book a demo");
    expect(page).not.toContain("paymentIntent");
    expect(page).not.toContain("transactionId");
    expect(page).not.toContain("createCheckoutSession");
  });
});
