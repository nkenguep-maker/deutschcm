import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

describe("closed beta public surface", () => {
  it("labels the public home entry as beta access instead of free signup", () => {
    const page = read("src/app/[locale]/page.tsx");
    expect(page).toContain('register: loc === "en" ? "Beta access" : "Accès bêta"');
    expect(page).not.toContain("tNav.register");
    expect(page).not.toContain("t.getStarted");
  });

  it("sends the final home CTA to the beta entrance", () => {
    const door = read("src/components/maison/MaisonPorte.tsx");
    expect(door).toContain('titleEm: "L’entrée est sur invitation."');
    expect(door).toContain('titleEm: "Entry is by invitation."');
    expect(door).toContain('href={`/${locale}/beta`}');
    expect(door).not.toContain('href={`/${locale}/register`}');
  });

  it("removes the B2B commercial landing from the closed-beta public surface", () => {
    const layout = read("src/app/[locale]/landing/layout.tsx");
    const flag = layout.indexOf('process.env.YEMA_CLOSED_BETA_ENABLED === "true"');
    const redirect = layout.indexOf('redirect(`/${safeLocale}/beta`)');

    expect(flag).toBeGreaterThan(-1);
    expect(redirect).toBeGreaterThan(flag);
    expect(layout).toContain("index: false");
    expect(layout).toContain("follow: false");
    expect(layout).toContain("nocache: true");
  });
});
