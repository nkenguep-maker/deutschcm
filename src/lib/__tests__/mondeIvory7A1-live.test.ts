import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Lot 7A.1 · invariants live · projection API + composition unique +
// retrait override query.

const ROOT = resolve(__dirname, "../..");
function read(rel: string): string {
  return readFileSync(resolve(ROOT, rel), "utf-8");
}

describe("API /api/me/monde-dashboard · projection onboarding minimale", () => {
  const src = read("app/api/me/monde-dashboard/route.ts");

  it("select Prisma inclut learningGoal + city (uniquement)", () => {
    // Le select doit contenir learningGoal + city dans la projection User.
    const selectBlock = src.match(/dbUser = await prisma\.user\.findUnique\([\s\S]*?\}\);/);
    expect(selectBlock).toBeTruthy();
    expect(selectBlock![0]).toMatch(/learningGoal:\s*true/);
    expect(selectBlock![0]).toMatch(/city:\s*true/);
  });

  it("aucune fuite d'objet User complet · pas de spread ...dbUser dans la réponse", () => {
    // On ne doit pas retourner ...dbUser ou dbUser directement · uniquement
    // les champs sélectionnés explicitement.
    expect(src).not.toMatch(/\.\.\.dbUser/);
    expect(src).not.toMatch(/user:\s*dbUser\b/);
  });

  it("réponse expose onboarding.learningGoal + onboarding.targetCity", () => {
    // 2 payloads · avec LP et sans LP · les deux doivent inclure onboarding.
    const payloads = src.match(/NextResponse\.json\(\{[\s\S]*?\}\)/g) ?? [];
    expect(payloads.length).toBeGreaterThanOrEqual(2);
    for (const p of payloads) {
      // ne pas exiger onboarding dans les payloads d'erreur (err())
      if (p.includes("universe")) {
        expect(p).toMatch(/onboarding:\s*\{[\s\S]*?learningGoal:[\s\S]*?targetCity:/);
      }
    }
  });
});

describe("Type MondeDashboardData · onboarding présent", () => {
  const src = read("features/dashboards/student-monde/types.ts");
  it("interface expose onboarding?: { learningGoal · targetCity }", () => {
    expect(src).toMatch(/onboarding\?\s*:\s*\{[\s\S]*?learningGoal:\s*string \| null[\s\S]*?targetCity:\s*string \| null[\s\S]*?\}/);
  });
});

describe("MondeIvoryOverview · aucun override query en production", () => {
  const rawSrc = read("features/dashboards/student-monde/ivory/MondeIvoryOverview.tsx");
  // Strip comments · les mentions du feature retiré restent tolérées.
  const src = rawSrc
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

  it("readQaOverride RETIRÉ · aucune fonction de bypass", () => {
    expect(src).not.toMatch(/function readQaOverride|const readQaOverride/);
    expect(src).not.toMatch(/URLSearchParams/);
    expect(src).not.toMatch(/window\.location\.search/);
  });

  it("effectivePath vient UNIQUEMENT de resolveMondePath()", () => {
    expect(src).toMatch(/const effectivePath = resolveMondePath\(/);
  });

  it("aucun NEXT_PUBLIC toggle · aucun process.env dans le composant", () => {
    expect(src).not.toMatch(/NEXT_PUBLIC/);
    expect(src).not.toMatch(/process\.env\./);
  });
});

describe("Composition unique · duplications retirées", () => {
  const src = read("features/dashboards/student-monde/StudentMondeDashboard.tsx");

  it("OverviewSection retiré (hero + CTA + progression duplicated)", () => {
    expect(src).not.toMatch(/import \{ OverviewSection \}/);
    expect(src).not.toMatch(/<OverviewSection/);
  });

  it("JourneySection retiré (progression duplicated)", () => {
    expect(src).not.toMatch(/import \{ JourneySection \}/);
    expect(src).not.toMatch(/<JourneySection/);
  });

  it("MondeIvoryOverview reçoit onboarding live · pas de valeurs hardcodées null", () => {
    // 7A hardcodait learningGoal: null · 7A.1 branche data.onboarding?.learningGoal
    expect(src).toMatch(/learningGoal:\s*data\.onboarding\?\.learningGoal/);
    expect(src).toMatch(/targetCity:\s*data\.onboarding\?\.targetCity/);
    expect(src).toMatch(/progressPct:\s*data\.overallPct/);
  });

  it("AssignmentsSection + CourseSection + ClassSection conservés", () => {
    expect(src).toMatch(/<AssignmentsSection/);
    expect(src).toMatch(/<CourseSection/);
    expect(src).toMatch(/<ClassSection/);
  });

  it("Order · MondeIvory → Assignments → Course → Class · brief §5", () => {
    const idxIvory  = src.indexOf("<MondeIvoryOverview");
    const idxAssig  = src.indexOf("<AssignmentsSection");
    const idxCourse = src.indexOf("<CourseSection");
    const idxClass  = src.indexOf("<ClassSection");
    expect(idxIvory).toBeGreaterThan(0);
    expect(idxIvory).toBeLessThan(idxAssig);
    expect(idxAssig).toBeLessThan(idxCourse);
    expect(idxCourse).toBeLessThan(idxClass);
  });
});

describe("Non-régression · Racines / messagerie / entitlements intacts", () => {
  it("Racines dashboard non modifié par 7A.1", () => {
    const racines = read("features/dashboards/student-racines/StudentRacinesDashboard.tsx");
    expect(racines).not.toMatch(/Lot 7A\.1|MondeIvory|MondePath/);
  });

  it("messagerie non touchée", () => {
    const msg = read("lib/messaging/messages.ts");
    expect(msg).not.toMatch(/Lot 7A\.1|MondePath|learningGoal/);
  });

  it("route monde-dashboard · pas de nouvelle dépendance entitlements/permissions", () => {
    const src = read("app/api/me/monde-dashboard/route.ts");
    expect(src).not.toMatch(/isMessaging|hasFlag|Entitlement/);
  });
});
