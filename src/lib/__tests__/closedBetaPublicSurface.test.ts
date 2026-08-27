import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

describe("closed beta public surface", () => {
  it("keeps the public home CTA on the canonical signup funnel", () => {
    const page = read("src/app/[locale]/page.tsx");
    const nav = read("src/components/landing/LandingNav.tsx");
    expect(page).toContain('register: loc === "en" ? "Sign up" : "S’inscrire"');
    expect(nav).toContain('router.push(`/${locale}/register`)');
  });

  it("sends the final home CTA to register and lets the proxy own the optional beta wall", () => {
    const door = read("src/components/maison/MaisonPorte.tsx");
    const proxy = read("src/proxy.ts");

    expect(door).toContain('href={`/${locale}/register`}');
    expect(door).toContain('cta: "S’inscrire"');
    expect(door).toContain('cta: "Sign up"');
    expect(proxy).toContain('process.env.YEMA_CLOSED_BETA_ENABLED === "true"');
    expect(proxy).toContain('closedBeta && canonicalPath === "/register"');
    expect(proxy).toContain('new URL(`/${locale}/beta`, request.url)');
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
