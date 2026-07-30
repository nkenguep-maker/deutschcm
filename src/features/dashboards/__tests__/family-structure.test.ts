import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import fr from "../../../../messages/fr.json";
import en from "../../../../messages/en.json";
import { buildFamilyNav, buildFamilyMobileTabs } from "@/features/dashboards/family/nav";

const DASHBOARDS_ROOT = resolve(__dirname, "..");
const FAMILY_ROOT = join(DASHBOARDS_ROOT, "family");

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

const familyFiles = walk(FAMILY_ROOT);

const NAV_LABELS = {
  overview: "Accueil",
  children: "Mes enfants",
  progression: "Progression",
  sessions: "Séances",
  messages: "Messages",
  payments: "Paiements",
  settings: "Paramètres",
  sectionLabel: "Ma famille",
};

const MOBILE_LABELS = {
  overview: "Accueil",
  children: "Enfants",
  progression: "Progression",
  payments: "Paiements",
  messages: "Messages",
};

describe("Family nav (Lot 4A)", () => {
  it("desktop expose exactement 7 rubriques", () => {
    const groups = buildFamilyNav(NAV_LABELS, "/fr/family");
    expect(groups).toHaveLength(1);
    expect(groups[0].items).toHaveLength(7);
  });

  it("desktop items ordonnés : overview → children → progression → sessions → messages → payments → settings", () => {
    const [g] = buildFamilyNav(NAV_LABELS, "/fr/family");
    expect(g.items.map((i) => i.key)).toEqual([
      "overview",
      "children",
      "progression",
      "sessions",
      "messages",
      "payments",
      "settings",
    ]);
  });

  it("mobile expose exactement 5 tabs", () => {
    const tabs = buildFamilyMobileTabs(MOBILE_LABELS, "/fr/family");
    expect(tabs).toHaveLength(5);
  });

  it("mobile tabs sans « Paramètres » (accessible via header/action secondaire)", () => {
    const tabs = buildFamilyMobileTabs(MOBILE_LABELS, "/fr/family");
    expect(tabs.map((t) => t.key)).toEqual([
      "overview",
      "children",
      "progression",
      "payments",
      "messages",
    ]);
  });

  it("respecte la locale EN", () => {
    const tabs = buildFamilyMobileTabs(MOBILE_LABELS, "/en/family");
    expect(tabs[0].href).toBe("/en/family");
  });
});

describe("Family dashboard structure (Lot 4A)", () => {
  it("aucun composant Family ne contient <h1", () => {
    const offenders = familyFiles.filter((f) => /<h1[\s>]/.test(readFileSync(f, "utf-8")));
    expect(offenders).toEqual([]);
  });

  it("aucun composant Family ne rend {child.id}, {c.id} ou {parentUserId} en texte nu", () => {
    const forbidden = [
      />\s*\{child\.id\s*\}\s*</,
      />\s*\{c\.id\s*\}\s*</,
      />\s*\{parentUserId\s*\}\s*</,
      />\s*\{[a-zA-Z_$][\w.]*\.parentUserId\s*\}\s*</,
    ];
    const offenders: string[] = [];
    for (const f of familyFiles) {
      const src = readFileSync(f, "utf-8");
      if (forbidden.some((re) => re.test(src))) offenders.push(f);
    }
    expect(offenders).toEqual([]);
  });

  it("aucun composant Family ne fait référence à un champ pinHash dans le code exécutable", () => {
    // Strip commentaires pour tolérer les auto-mentions du type
    // "aucun pinHash jamais exposé" (self-référentielles).
    const stripComments = (src: string) =>
      src.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
    const offenders = familyFiles.filter((f) =>
      /\bpinHash\b/.test(stripComments(readFileSync(f, "utf-8"))),
    );
    expect(offenders).toEqual([]);
  });

  it("aucun composant Family n'importe une route legacy /famille", () => {
    const offenders = familyFiles.filter((f) => /["']\/famille/.test(readFileSync(f, "utf-8")));
    expect(offenders).toEqual([]);
  });
});

describe("Family i18n parity + shape (Lot 4A)", () => {
  it("namespace family présent FR et EN", () => {
    const frF = (fr as { yemaDashboards: { family?: unknown } }).yemaDashboards.family;
    const enF = (en as { yemaDashboards: { family?: unknown } }).yemaDashboards.family;
    expect(frF).toBeDefined();
    expect(enF).toBeDefined();
  });

  it("nav et mobileNav ont les bons compteurs", () => {
    const f = (fr as {
      yemaDashboards: { family: { nav: Record<string, string>; mobileNav: Record<string, string> } };
    }).yemaDashboards.family;
    expect(Object.keys(f.nav).sort()).toEqual([
      "children",
      "messages",
      "overview",
      "payments",
      "progression",
      "sessions",
      "settings",
    ]);
    expect(Object.keys(f.mobileNav).sort()).toEqual([
      "children",
      "messages",
      "overview",
      "payments",
      "progression",
    ]);
  });
});

describe("Family route + QA persona (Lot 4A)", () => {
  it("route /[locale]/family/page.tsx existe et importe FamilyDashboard", () => {
    const p = resolve(__dirname, "../../../app/[locale]/family/page.tsx");
    const src = readFileSync(p, "utf-8");
    expect(src).toMatch(/FamilyDashboard/);
    expect(src).toMatch(/resolveFamilyGuardianActorOrNull/);
  });

  it("QA persona 'family' est ajouté avec destination /family", () => {
    const p = resolve(__dirname, "../../../lib/qa/personas.ts");
    const src = readFileSync(p, "utf-8");
    expect(src).toMatch(/id:\s*["']family["']/);
    expect(src).toMatch(/\/\$\{locale\}\/family/);
    expect(src).toMatch(/"family"/); // dans isQaPersonaId whitelist
  });
});
