import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const DASHBOARDS_ROOT = resolve(__dirname, "..");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "__tests__" || name === "node_modules") continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (p.endsWith(".tsx")) out.push(p);
  }
  return out;
}

function countMatches(re: RegExp, s: string): number {
  const m = s.match(re);
  return m ? m.length : 0;
}

// Un dashboard rendu ne doit contenir qu'un seul <h1>. Il provient exclusivement
// de DashboardHeader (shell partagé). Les rubriques utilisent <h2> (via
// DashboardSectionHeader) et les sous-blocs utilisent <h3> inline.
function countStaticH1(src: string): number {
  return countMatches(/<h1[\s>]/g, src);
}

function countStaticH3(src: string): number {
  return countMatches(/<h3[\s>]/g, src);
}

describe("YEMA dashboards heading hierarchy", () => {
  const files = walk(DASHBOARDS_ROOT);

  it("scanne au moins les 3 arbres attendus (shared/student-monde/student-racines)", () => {
    const paths = files.map((f) => f.replace(DASHBOARDS_ROOT, ""));
    expect(paths.some((p) => p.startsWith("/shared/"))).toBe(true);
    expect(paths.some((p) => p.startsWith("/student-monde/"))).toBe(true);
    expect(paths.some((p) => p.startsWith("/student-racines/"))).toBe(true);
  });

  it("aucun composant de student-monde ni student-racines ne contient <h1", () => {
    const offenders = files
      .filter((f) => f.includes("/student-monde/") || f.includes("/student-racines/"))
      .filter((f) => countStaticH1(readFileSync(f, "utf-8")) > 0);
    expect(offenders).toEqual([]);
  });

  it("le shell partagé ne contient qu'un unique <h1 (dans DashboardHeader.tsx)", () => {
    const sharedFiles = files.filter((f) => f.includes("/shared/"));
    const total = sharedFiles.reduce(
      (n, f) => n + countStaticH1(readFileSync(f, "utf-8")),
      0,
    );
    expect(total).toBe(1);
    const withH1 = sharedFiles.filter((f) => countStaticH1(readFileSync(f, "utf-8")) > 0);
    expect(withH1).toHaveLength(1);
    expect(withH1[0].endsWith("DashboardHeader.tsx")).toBe(true);
  });

  it("les sous-blocs de la rubrique 'Mon tableau de bord' utilisent bien <h3>", () => {
    const mondeOverview = readFileSync(
      join(DASHBOARDS_ROOT, "student-monde/sections/OverviewSection.tsx"),
      "utf-8",
    );
    expect(countStaticH3(mondeOverview)).toBeGreaterThanOrEqual(2);

    const racinesOverview = readFileSync(
      join(DASHBOARDS_ROOT, "student-racines/sections/OverviewSection.tsx"),
      "utf-8",
    );
    expect(countStaticH3(racinesOverview)).toBeGreaterThanOrEqual(3);
  });

  it("chaque dashboard Élève (Monde/Racines) réutilise DashboardHeader", () => {
    for (const path of ["student-monde/StudentMondeDashboard.tsx", "student-racines/StudentRacinesDashboard.tsx"]) {
      const src = readFileSync(join(DASHBOARDS_ROOT, path), "utf-8");
      const count = countMatches(/<DashboardHeader[\s/>]/g, src);
      // Le composant peut apparaître dans plusieurs branches exclusives
      // (loading / error / no-lp / ok) mais un seul est rendu par requête.
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });
});
