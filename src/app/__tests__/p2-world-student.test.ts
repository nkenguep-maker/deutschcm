// P2 · Garde-fous des nouvelles pages Monde étudiant.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function read(rel: string) {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

describe("/dashboard · aiguillage par univers (P2)", () => {
  const src = read("src/app/[locale]/dashboard/page.tsx");
  it("route Monde → DashboardMonde et Racines → DashboardRacines (P3)", () => {
    expect(src).toMatch(/DashboardMonde/);
    expect(src).toMatch(/DashboardRacines/);
    expect(src).toMatch(/lp\.universe === "MONDE"/);
  });
  it("redirige vers /onboarding si aucun LP", () => {
    expect(src).toMatch(/redirect\(\{\s*href:\s*"\/onboarding"/);
  });
});

describe("DashboardMonde · rend uniquement données réelles", () => {
  const src = read("src/components/monde/DashboardMonde.tsx");
  it("consomme /api/me/monde-dashboard", () => {
    expect(src).toMatch(/\/api\/me\/monde-dashboard/);
  });
  it("aucune donnée mock hardcodée (Sophie Tanda etc.)", () => {
    expect(src).not.toMatch(/Sophie Tanda|Prof\. Sophie|Marie N\./);
  });
  it("aucun classement / streak fictif", () => {
    expect(src).not.toMatch(/streak|leaderboard|classement fictif/i);
  });
  it("affiche un StateBlock loading + error + noAccess honnête", () => {
    expect(src).toMatch(/kind="loading"/);
    expect(src).toMatch(/kind="error"/);
    expect(src).toMatch(/kind="empty"/);
  });
});

describe("/courses · catalogue Monde P2", () => {
  const src = read("src/app/[locale]/courses/page.tsx");
  it("est un server component Prisma-backed (pas de use client)", () => {
    expect(src).not.toMatch(/^"use client"/m);
  });
  it("utilise buildA1CourseList + computeMondeAccess du seam", () => {
    expect(src).toMatch(/buildA1CourseList/);
    expect(src).toMatch(/computeMondeAccess/);
    expect(src).toMatch(/canAccessModule/);
  });
  it("affiche A2-C1 comme bientôt disponible", () => {
    expect(src).toMatch(/OTHER_LEVELS[\s\S]*A2[\s\S]*B1[\s\S]*B2[\s\S]*C1/);
    expect(src).toMatch(/othersSoon/);
  });
  it("bannière verrou renvoie sur /activation-intent", () => {
    expect(src).toMatch(/\/activation-intent/);
  });
});

describe("/progress · uniquement données réelles", () => {
  const src = read("src/app/[locale]/progress/page.tsx");
  it("est un server component (pas de use client)", () => {
    expect(src).not.toMatch(/^"use client"/m);
  });
  it("charge ModuleProgress réels · pas de graphs vides", () => {
    expect(src).toMatch(/moduleProgress\.findMany/);
    expect(src).not.toMatch(/LineChart|RadarChart|BarChart/);
  });
  it("aucune donnée fictive · classement, streak, comparaison", () => {
    expect(src).not.toMatch(/streak|classement|leaderboard|comparaison/i);
  });
});

describe("Module page layout · access enforcement", () => {
  const src = read("src/app/[locale]/courses/[courseId]/modules/[moduleId]/layout.tsx");
  it("server component (pas de use client)", () => {
    expect(src).not.toMatch(/^"use client"/m);
  });
  it("check session + StateBlock kind=locked si pas d'accès", () => {
    expect(src).toMatch(/kind="locked"/);
    expect(src).toMatch(/canAccessModule/);
  });
  it("renvoie sur /activation-intent en CTA principal", () => {
    expect(src).toMatch(/\/activation-intent/);
  });
});

describe("API /api/me/monde-dashboard", () => {
  const src = read("src/app/api/me/monde-dashboard/route.ts");
  it("refuse anonyme (401)", () => {
    expect(src).toMatch(/UNAUTHORIZED/);
  });
  it("refuse non-STUDENT (403)", () => {
    expect(src).toMatch(/FORBIDDEN_NOT_STUDENT/);
  });
  it("charge le grant via user OU learning-path", () => {
    expect(src).toMatch(/beneficiaryType:\s*"USER"/);
    expect(src).toMatch(/beneficiaryType:\s*"LEARNING_PATH"/);
  });
});

describe("Regression · P0.A cleanups toujours honorés", () => {
  const dashboardMonde = read("src/components/monde/DashboardMonde.tsx");
  const coursesPage = read("src/app/[locale]/courses/page.tsx");
  it("Aucune référence à ClassroomChat fake", () => {
    expect(dashboardMonde).not.toMatch(/Prof\. Sophie|Marie N\./);
    expect(coursesPage).not.toMatch(/Prof\. Sophie|Marie N\./);
  });
  it("Aucun appel IA ou coach IA", () => {
    expect(dashboardMonde).not.toMatch(/coach ia|ai coach|assistant ia/i);
    expect(coursesPage).not.toMatch(/coach ia|ai coach/i);
  });
});
