// P2 hardening · gardes-fous supplémentaires.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function read(rel: string) {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

describe("Dashboard Monde · 5 états distincts (hardening §5)", () => {
  const src = read("src/components/monde/DashboardMonde.tsx");
  it("expose ACTIVE_START, ACTIVE_RESUME, ACTIVE_DONE, EXPIRED, NO_ACCESS", () => {
    expect(src).toMatch(/"ACTIVE_START"/);
    expect(src).toMatch(/"ACTIVE_RESUME"/);
    expect(src).toMatch(/"ACTIVE_DONE"/);
    expect(src).toMatch(/"EXPIRED"/);
    expect(src).toMatch(/"NO_ACCESS"/);
  });
  it("EXPIRED n'affiche jamais Reprendre/Resume · CTA seeOffers uniquement", () => {
    // Le CTA c.resume apparaît uniquement dans le branch ACTIVE_RESUME.
    const activeResumeJsx = src.match(/heroState === "ACTIVE_RESUME" && data\.nextModule && \([\s\S]*?<\/Link>[\s\S]*?\)/);
    expect(activeResumeJsx).not.toBeNull();
    expect(activeResumeJsx![0]).toMatch(/c\.resume/);
    // Le branch EXPIRED/NO_ACCESS envoie sur /activation-intent.
    const expiredJsx = src.match(/heroState === "EXPIRED" \|\| heroState === "NO_ACCESS"[\s\S]*?<\/Link>[\s\S]*?\)/);
    expect(expiredJsx).not.toBeNull();
    expect(expiredJsx![0]).toMatch(/\/activation-intent/);
    expect(expiredJsx![0]).toMatch(/c\.seeOffers/);
    expect(expiredJsx![0]).not.toMatch(/c\.resume\b/);
  });
  it("ACTIVE_DONE affiche revoir mon parcours · pas de reprendre", () => {
    expect(src).toMatch(/heroState === "ACTIVE_DONE"[\s\S]*?c\.reviewJourney/);
  });
  it("EXPIRED gray out les cartes de cours (locked si !active)", () => {
    expect(src).toMatch(/locked = cs\.status === "LOCKED" \|\| !active/);
  });
});

describe("Fixtures p2-access-fixtures · 5 modes", () => {
  const src = read("scripts/test-baseline/p2-access-fixtures.mjs");
  it("accepte les 5 modes", () => {
    expect(src).toMatch(/\["active",\s*"expired",\s*"none",\s*"new",\s*"completed"\]/);
  });
  it("completed seed 25 ModuleProgress a1-beta-*", () => {
    expect(src).toMatch(/a1-beta-\$\{l\}-\$\{type\}/);
    expect(src).toMatch(/status:\s*"COMPLETED"/);
  });
  it("new efface les ModuleProgress a1-beta-* (aucune progression)", () => {
    expect(src).toMatch(/MODE === "new"[\s\S]{0,200}clearModuleProgress/);
  });
  it("refuse la production (assertNonProduction + getTestPassword guards)", () => {
    expect(src).toMatch(/assertNonProduction\(\)/);
    expect(src).toMatch(/getTestPassword\(\)/);
  });
  it("scoped au user monde uniquement", () => {
    expect(src).toMatch(/paul\+yema_test_monde@example\.com/);
  });
});

describe("Feedback exercice accessible (hardening §12)", () => {
  const adaptive = read("src/components/AdaptiveQuiz.tsx");
  const discovery = read("src/app/[locale]/decouverte/[n]/DiscoveryLessonClient.tsx");

  it("AdaptiveQuiz feedback wrappé role=status aria-live=polite", () => {
    expect(adaptive).toMatch(/role="status"[\s\S]*?aria-live="polite"/);
  });
  it("AdaptiveQuiz · texte 'Correct/Incorrect' ne dépend pas uniquement de la couleur", () => {
    expect(adaptive).toMatch(/Correct\.\s*✅/);
    expect(adaptive).toMatch(/Incorrect\.\s*❌/);
  });
  it("DiscoveryLessonClient · feedback wrappé role=status", () => {
    expect(discovery).toMatch(/role="status"[\s\S]*?aria-live="polite"/);
  });
});

describe("Régression · pas d'IA, pas de faux prof, pas de faux paiement", () => {
  const dash = read("src/components/monde/DashboardMonde.tsx");
  const courses = read("src/app/[locale]/courses/page.tsx");
  const progress = read("src/app/[locale]/progress/page.tsx");
  const api = read("src/app/api/me/monde-dashboard/route.ts");

  for (const [name, src] of [["Dashboard", dash], ["Courses", courses], ["Progress", progress], ["API", api]]) {
    it(`${name} · aucun coach IA / faux prof / faux paiement`, () => {
      expect(src).not.toMatch(/coach ia|ai coach|assistant ia/i);
      expect(src).not.toMatch(/Prof\. Sophie|Sophie Tanda|Marie N\./);
      expect(src).not.toMatch(/AccessGrant\.create|prisma\.order\.create/);
      expect(src).not.toMatch(/cinetpay|stripe|paypal/i);
    });
  }
});
