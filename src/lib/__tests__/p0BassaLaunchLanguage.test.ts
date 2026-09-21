import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

describe("Racines launch language · Bassa first", () => {
  it("makes Bassa a first-class Prisma language with reproducible migrations", () => {
    const schema = read("prisma/schema.prisma");
    const enumMigration = read(
      "prisma/migrations/20260919000022_p0_21_bassa_language_enum/migration.sql",
    );
    const catalogueMigration = read(
      "prisma/migrations/20260919000023_p0_21_bassa_catalog_variants/migration.sql",
    );

    expect(schema).toMatch(/enum LanguageCode\s*{[\s\S]*?\bBASSA\b/);
    expect(enumMigration).toContain("ALTER TYPE \"LanguageCode\" ADD VALUE IF NOT EXISTS 'BASSA'");
    expect(catalogueMigration).toContain("'BASSA'::\"LanguageCode\"");
    expect(catalogueMigration).toContain("p.universe = 'RACINES'::\"Universe\"");
  });

  it("defaults Racines self-service onboarding to Bassa, not Wolof", () => {
    const persona = read("src/app/api/onboarding/persona/route.ts");
    const onboarding = read("src/app/[locale]/onboarding/racines/OnboardingRacinesForm.tsx");

    expect(persona).toContain('rawLanguageId ?? "bassa"');
    expect(persona).toContain('requestedLanguage !== "bassa"');
    expect(onboarding).toContain('onboarding: { language: "bassa"');
    expect(onboarding).toContain('language: "BASSA"');
    expect(onboarding).toContain('activeLanguage: "bassa"');
    expect(onboarding).not.toContain('language: "WOLOF"');
  });

  it("uses Bassa for the Racines MVP trial", () => {
    const grants = read("src/lib/entitlements/grants.ts");
    const gate = read("scripts/test-baseline/p0-21-mvp-trial-gate.mjs");

    expect(grants).toContain('path.language === "BASSA"');
    expect(grants).not.toContain('path.language === "WOLOF"');
    expect(gate).toContain("pv.language::text='BASSA'");
  });

  it("marks integrated Bassa content PARTIAL until native review and audio are complete", () => {
    const racines = read("src/lib/racines.ts");
    const discovery = read("src/lib/discovery.ts");
    const registry = read("src/content/racines-e1-solo/index.ts");

    expect(racines).toContain('bassa:   "PARTIAL"');
    expect(registry).toContain('"racines-solo-bas-e1": bassaE1');
    expect(discovery).toContain('{ id: "bassa",    code: "BASSA"');
    expect(discovery).toContain('status: "soon"');
  });
});
