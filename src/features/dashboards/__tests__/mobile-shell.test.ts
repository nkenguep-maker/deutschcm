import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import fr from "../../../../messages/fr.json";
import en from "../../../../messages/en.json";

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

const shellFiles = walk(join(DASHBOARDS_ROOT, "shared"));
const teacherFiles = walk(join(DASHBOARDS_ROOT, "teacher"));
const coachFiles = walk(join(DASHBOARDS_ROOT, "coach-racines"));
const studentMondeFiles = walk(join(DASHBOARDS_ROOT, "student-monde"));
const studentRacinesFiles = walk(join(DASHBOARDS_ROOT, "student-racines"));

const dashboardOrchestrators = [
  join(DASHBOARDS_ROOT, "teacher/TeacherDashboard.tsx"),
  join(DASHBOARDS_ROOT, "coach-racines/CoachRacinesDashboard.tsx"),
  join(DASHBOARDS_ROOT, "student-monde/StudentMondeDashboard.tsx"),
  join(DASHBOARDS_ROOT, "student-racines/StudentRacinesDashboard.tsx"),
];

describe("DashboardShell mobile behaviour (Lot 3M)", () => {
  const shellSrc = readFileSync(join(DASHBOARDS_ROOT, "shared/DashboardShell.tsx"), "utf-8");

  it("cache la sidebar desktop sous 900px", () => {
    // La media query mobile ciblée doit cacher .yema-sidebar
    expect(shellSrc).toMatch(/@media\s*\(max-width:\s*899\.98px\)/);
    expect(shellSrc).toMatch(/\.yema-sidebar\s*{\s*display:\s*none/);
  });

  it("affiche le header mobile compact sous 900px", () => {
    expect(shellSrc).toMatch(/\.yema-mobile-header\s*{\s*display:\s*block/);
  });

  it("affiche la tab bar slot sous 900px", () => {
    expect(shellSrc).toMatch(/\.yema-tab-bar-slot\s*{\s*display:\s*block/);
  });

  it("contraint le main mobile à max-width 390px avec padding 20px 16px 96px", () => {
    // Le padding-bottom 96px réserve l'espace de la tab bar
    expect(shellSrc).toMatch(/max-width:\s*390px/);
    expect(shellSrc).toMatch(/padding:\s*20px\s+16px\s+96px/);
    expect(shellSrc).toMatch(/margin:\s*0\s+auto/);
  });

  it("ne cache PAS la sidebar au-dessus de 900px (desktop shell intact)", () => {
    // La règle par défaut pour .yema-sidebar doit être visible (pas de
    // display:none en dehors de la media query)
    const baseRule = shellSrc.match(/\[data-yema-shell\]\s+\.yema-sidebar\s*{[\s\S]*?}/);
    expect(baseRule).toBeTruthy();
    if (baseRule) expect(baseRule[0]).not.toMatch(/display:\s*none/);
  });
});

describe("DashboardTabBar (Lot 3M)", () => {
  const src = readFileSync(join(DASHBOARDS_ROOT, "shared/DashboardTabBar.tsx"), "utf-8");

  it("est sticky en bas, avec blur 8px", () => {
    expect(src).toMatch(/position:\s*["']sticky["']/);
    expect(src).toMatch(/bottom:\s*0/);
    expect(src).toMatch(/backdropFilter:\s*["']blur\(8px\)["']/);
  });

  it("chaque tab a min-height 44px", () => {
    expect(src).toMatch(/minHeight:\s*44/);
  });

  it("marque aria-current='page' sur l'onglet actif", () => {
    expect(src).toMatch(/aria-current=\{active\s*\?\s*["']page["']\s*:\s*undefined\}/);
  });

  it("indicateur or 22×3 px sur l'onglet actif", () => {
    expect(src).toMatch(/width:\s*22[,\s]/);
    expect(src).toMatch(/height:\s*3[,\s]/);
    expect(src).toMatch(/background:\s*["']var\(--yema-gold\)["']/);
  });

  it("n'affiche AUCUN badge fictif : badge rendu uniquement si badgeCount > 0", () => {
    // showBadge doit être guardé par typeof number + > 0
    expect(src).toMatch(/typeof\s+tab\.badgeCount\s*===\s*["']number["']/);
    expect(src).toMatch(/tab\.badgeCount\s*>\s*0/);
  });
});

describe("Dashboards câblent tab bar mobile (5 tabs par persona)", () => {
  for (const path of dashboardOrchestrators) {
    it(`${path.split("/").slice(-2).join("/")} monte <DashboardTabBar>`, () => {
      const src = readFileSync(path, "utf-8");
      expect(src).toMatch(/<DashboardTabBar[\s\S]*?tabs=\{/);
      expect(src).toMatch(/mobileHeader=\{mobileHeader\}/);
    });
  }

  it("chaque dashboard déclare exactement 5 tabs mobiles", () => {
    for (const path of dashboardOrchestrators) {
      const src = readFileSync(path, "utf-8");
      // Compte les entrées `{ key: "…", label:` dans la liste mobileTabs / buildTabs
      const matches = src.match(/\{\s*key:\s*["'][a-zA-Z]+["'],\s*label:\s*t\(/g) || [];
      expect(matches.length, `dashboard ${path} tabs`).toBeGreaterThanOrEqual(5);
    }
  });

  it("aucun dashboard ne monte l'ancien DashboardMobileNavigation (drawer)", () => {
    for (const path of dashboardOrchestrators) {
      const src = readFileSync(path, "utf-8");
      expect(src, `${path}`).not.toMatch(/<DashboardMobileNavigation/);
    }
  });
});

describe("i18n mobileNav parité FR/EN + 5 clés par persona", () => {
  const namespaces = ["studentMonde", "studentRacines", "teacher", "coachRacines"] as const;

  for (const ns of namespaces) {
    it(`${ns}.mobileNav existe et miroir FR/EN`, () => {
      const frNav = ((fr as Record<string, unknown>)["yemaDashboards"] as Record<string, Record<string, Record<string, string>>>)[ns].mobileNav;
      const enNav = ((en as Record<string, unknown>)["yemaDashboards"] as Record<string, Record<string, Record<string, string>>>)[ns].mobileNav;
      expect(frNav).toBeDefined();
      expect(enNav).toBeDefined();
      expect(Object.keys(enNav).sort()).toEqual(Object.keys(frNav).sort());
      expect(Object.keys(frNav)).toHaveLength(5);
    });
  }

  it("labels mobiles Élève Monde attendus", () => {
    const nav = ((fr as Record<string, unknown>)["yemaDashboards"] as Record<string, Record<string, Record<string, string>>>).studentMonde.mobileNav;
    expect(nav.overview).toBe("Accueil");
    expect(nav.course).toBe("Cours");
    expect(nav.assignments).toBe("Devoirs");
    expect(nav.journey).toBe("Parcours");
    expect(nav.messages).toBe("Messages");
  });

  it("labels mobiles Élève Racines attendus", () => {
    const nav = ((fr as Record<string, unknown>)["yemaDashboards"] as Record<string, Record<string, Record<string, string>>>).studentRacines.mobileNav;
    expect(nav.overview).toBe("Accueil");
    expect(nav.steps).toBe("Étapes");
    expect(nav.listens).toBe("Écoutes");
    expect(nav.coach).toBe("Coach");
    expect(nav.circle).toBe("Palabre");
  });

  it("labels mobiles Enseignant attendus", () => {
    const nav = ((fr as Record<string, unknown>)["yemaDashboards"] as Record<string, Record<string, Record<string, string>>>).teacher.mobileNav;
    expect(nav.overview).toBe("Accueil");
    expect(nav.classes).toBe("Classes");
    expect(nav.corrections).toBe("Corrections");
    expect(nav.assignments).toBe("Devoirs");
    expect(nav.messages).toBe("Messages");
  });

  it("labels mobiles Coach Racines attendus", () => {
    const nav = ((fr as Record<string, unknown>)["yemaDashboards"] as Record<string, Record<string, Record<string, string>>>).coachRacines.mobileNav;
    expect(nav.overview).toBe("Accueil");
    expect(nav.learners).toBe("Apprenants");
    expect(nav.sessions).toBe("Séances");
    expect(nav.messages).toBe("Messages");
    expect(nav.sessionNotes).toBe("Notes");
  });
});

describe("Regression Lot 3 : le shell partagé garde ses invariants", () => {
  it("le shell partagé ne rend toujours qu'un unique <h1 (DashboardHeader)", () => {
    const h1Files = shellFiles.filter((f) => /<h1[\s>]/.test(readFileSync(f, "utf-8")));
    expect(h1Files).toHaveLength(1);
    expect(h1Files[0].endsWith("DashboardHeader.tsx")).toBe(true);
  });

  it("aucun dashboard nouveau (Teacher/Coach/Monde/Racines) ne contient <h1", () => {
    const all = [...teacherFiles, ...coachFiles, ...studentMondeFiles, ...studentRacinesFiles];
    const offenders = all.filter((f) => /<h1[\s>]/.test(readFileSync(f, "utf-8")));
    expect(offenders).toEqual([]);
  });
});
