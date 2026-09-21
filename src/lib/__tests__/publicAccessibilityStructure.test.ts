import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

describe("public accessibility structure", () => {
  it("keeps decorative spine bars out of semantic lists", () => {
    const cefr = read("src/components/landing/CefrSpine.tsx");
    const yema = read("src/components/landing/YemaSpine.tsx");
    const item = read("src/components/landing/SpineItem.tsx");
    const css = read("src/app/globals.css");

    expect(cefr).not.toContain('className="spine-bar"');
    expect(yema).not.toContain('className="spine-bar"');
    expect(item).toContain('className="spine-item-button"');
    expect(item).not.toContain('role={interactive ? "button" : undefined}');
    expect(css).toContain(".spine-list::before");
    expect(css).toContain(".spine-list::after");
  });

  it("uses valid language subtags only for the greeting words", () => {
    const greeting = read("src/components/seuil/SeuilGreeting.tsx");

    expect(greeting).toContain('className="seuil-greeting-word" lang={item.langTag}');
    expect(greeting).not.toContain('lang={item.langTag}\n            >');
    for (const obsoleteTag of ["wol", "lin", "swa", "yor", "hau", "twi", "kin", "amh", "zul"]) {
      expect(greeting).not.toContain(`langTag: "${obsoleteTag}"`);
    }
  });

  it("keeps the language catalogue heading hierarchy continuous", () => {
    const catalogue = read("src/app/[locale]/langues/page.tsx");

    expect(catalogue).toContain('headingLevel: 2 | 3');
    expect(catalogue).toContain('headingLevel={2}');
    expect(catalogue).toContain('headingLevel={3}');
    expect(catalogue).toContain('const Heading = headingLevel === 2 ? "h2" : "h3"');
    expect(catalogue).not.toContain('<h1 className="maison-h">\n                {t(c.sourcesTitle)}');
  });

  it("keeps authentication links distinguishable and readable", () => {
    const css = read("src/app/globals.css");

    expect(css).toContain(".porte-seuil-footer a {");
    expect(css).toContain("text-decoration: underline;");
    expect(css).toContain(".ens-form-error-link {");
    expect(css).toContain("color: var(--brass);");
  });

  it("keeps the visible landing scroll hint readable", () => {
    const css = read("src/app/globals.css");
    const scrollHint = css.match(/\.seuil-scroll-hint \{[\s\S]*?\n\}/)?.[0];

    expect(scrollHint).toContain("color: var(--creme-mute);");
    expect(scrollHint).not.toContain("color: var(--creme-faint);");
  });

  it("keeps decorative greetings either readable or hidden", () => {
    const css = read("src/app/globals.css");
    const greetingAnimation = css.match(/@keyframes seuil-greeting-breath \{[\s\S]*?\n\}/)?.[0];

    expect(greetingAnimation).toContain("10%, 45% {");
    expect(greetingAnimation).toContain("opacity: 0.85;");
    expect(greetingAnimation).toContain("visibility: hidden;");
    expect(greetingAnimation).not.toContain("opacity: 0.04;");
    expect(greetingAnimation).not.toContain("opacity: 0.10;");
  });
});
