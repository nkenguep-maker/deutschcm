import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import fr from "../../../../messages/fr.json";
import en from "../../../../messages/en.json";
import { buildCenterNav, buildCenterMobileTabs } from "@/features/dashboards/center/nav";
import { buildAdminNav, buildAdminMobileTabs } from "@/features/dashboards/admin/nav";

const ROOT = resolve(__dirname, "..");

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
function stripComments(src: string): string {
  return src.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
}

const centerFiles = walk(join(ROOT, "center"));
const adminFiles = walk(join(ROOT, "admin"));

describe("Center nav (Lot 4B · bêta technique)", () => {
  const labels = {
    overview: "Vue", students: "Élèves", teachers: "Enseignants",
    classes: "Classes", messages: "Messages",
    settings: "Paramètres", sectionLabel: "Mon centre",
  };
  it("desktop expose exactement 6 rubriques sans facturation", () => {
    const [g] = buildCenterNav(labels, "/fr/center");
    expect(g.items).toHaveLength(6);
    expect(g.items.map((i) => i.key)).toEqual(["overview", "students", "teachers", "classes", "messages", "settings"]);
    expect(g.items.map((i) => i.key)).not.toContain("billing");
  });
  it("mobile expose exactement 4 tabs (Centre/Élèves/Classes/Messages)", () => {
    const tabs = buildCenterMobileTabs(
      { overview: "Centre", students: "Élèves", classes: "Classes", messages: "Messages" },
      "/fr/center",
    );
    expect(tabs).toHaveLength(4);
    expect(tabs.map((t) => t.key)).toEqual(["overview", "students", "classes", "messages"]);
  });
});

describe("Admin nav (Lot 4B)", () => {
  const labels = { console: "Console", accounts: "Comptes", audit: "Audit", environment: "Env." };
  it("desktop expose exactement 4 rubriques (Console/Comptes/Audit/Environnement)", () => {
    const [g] = buildAdminNav(labels, "/fr/admin");
    expect(g.items.map((i) => i.key)).toEqual(["console", "accounts", "audit", "environment"]);
  });
  it("mobile expose exactement 4 tabs", () => {
    const tabs = buildAdminMobileTabs(labels, "/fr/admin");
    expect(tabs).toHaveLength(4);
  });
});

describe("Center dashboard structure (Lot 4B · sécurité)", () => {
  it("aucun composant Center ne contient <h1", () => {
    const off = centerFiles.filter((f) => /<h1[\s>]/.test(readFileSync(f, "utf-8")));
    expect(off).toEqual([]);
  });
  it("aucun composant Center ne rend {c.id} ou {s.id} en texte nu", () => {
    const forbidden = [
      />\s*\{c\.id\s*\}\s*</,
      />\s*\{s\.id\s*\}\s*</,
      />\s*\{tt\.id\s*\}\s*</,
      />\s*\{classroomId\s*\}\s*</,
    ];
    const off = centerFiles.filter((f) => forbidden.some((re) => re.test(readFileSync(f, "utf-8"))));
    expect(off).toEqual([]);
  });
  it("aucune fausse messagerie ni faux compteur non lu", () => {
    const off = centerFiles.filter((f) => /unreadCount|fakeMessages|<audio[\s>]|MediaRecorder|getUserMedia/i.test(readFileSync(f, "utf-8")));
    expect(off).toEqual([]);
  });
});

describe("Admin dashboard structure (Lot 4B · secrets)", () => {
  it("aucun composant Admin ne contient <h1", () => {
    const off = adminFiles.filter((f) => /<h1[\s>]/.test(readFileSync(f, "utf-8")));
    expect(off).toEqual([]);
  });
  it("aucun composant Admin ne rend un mot-clef secret dans le code exécutable", () => {
    const forbidden = /\bSUPABASE_SERVICE_ROLE_KEY\b|\bSUPABASE_ANON_KEY\b|\bDATABASE_URL\b|\bpassword\b/i;
    const off = adminFiles.filter((f) => forbidden.test(stripComments(readFileSync(f, "utf-8"))));
    expect(off).toEqual([]);
  });
  it("consoleData.ts hash l'acteur audit via sha-256 tronqué", () => {
    const src = readFileSync(resolve(__dirname, "../../../lib/admin/consoleData.ts"), "utf-8");
    expect(src).toMatch(/createHash\(["']sha256["']\)/);
    expect(src).toMatch(/\.slice\(0,\s*12\)/);
  });
  it("consoleData.ts ne matche que le projectRef P-1 autorisé", () => {
    const src = readFileSync(resolve(__dirname, "../../../lib/admin/consoleData.ts"), "utf-8");
    expect(src).toMatch(/ALLOWED_PROJECT_REF\s*=\s*["']kzzagbojjkivdzzcrmxn["']/);
  });
});

describe("Center/Admin i18n parité + shape (Lot 4B)", () => {
  it("center + admin namespaces présents FR et EN", () => {
    const y1 = (fr as { yemaDashboards: { center?: unknown; admin?: unknown } }).yemaDashboards;
    const y2 = (en as { yemaDashboards: { center?: unknown; admin?: unknown } }).yemaDashboards;
    expect(y1.center).toBeDefined();
    expect(y1.admin).toBeDefined();
    expect(y2.center).toBeDefined();
    expect(y2.admin).toBeDefined();
  });
  it("center.nav a 6 clés · center.mobileNav a 4 clés", () => {
    const nav = (fr as { yemaDashboards: { center: { nav: Record<string, string>; mobileNav: Record<string, string> } } })
      .yemaDashboards.center;
    expect(Object.keys(nav.nav)).toHaveLength(6);
    expect(Object.keys(nav.mobileNav)).toHaveLength(4);
    expect(nav.nav).not.toHaveProperty("billing");
    expect(nav.mobileNav).not.toHaveProperty("billing");
  });
  it("admin.nav a 4 clés · admin.mobileNav a 4 clés", () => {
    const nav = (fr as { yemaDashboards: { admin: { nav: Record<string, string>; mobileNav: Record<string, string> } } })
      .yemaDashboards.admin;
    expect(Object.keys(nav.nav)).toHaveLength(4);
    expect(Object.keys(nav.mobileNav)).toHaveLength(4);
  });
});

describe("Dispatch flag Center/Admin (Lot 4B)", () => {
  it("src/app/[locale]/center/page.tsx utilise isYemaDashboardRedesignActive", () => {
    const src = readFileSync(resolve(__dirname, "../../../app/[locale]/center/page.tsx"), "utf-8");
    expect(src).toMatch(/isYemaDashboardRedesignActive/);
    expect(src).toMatch(/CenterDashboard/);
    expect(src).toMatch(/CenterDashboardView/); // legacy fallback intact
  });
  it("src/app/[locale]/admin/page.tsx utilise isYemaDashboardRedesignActive", () => {
    const src = readFileSync(resolve(__dirname, "../../../app/[locale]/admin/page.tsx"), "utf-8");
    expect(src).toMatch(/isYemaDashboardRedesignActive/);
    expect(src).toMatch(/AdminDashboard/);
    expect(src).toMatch(/LegacyAdminDashboard/); // legacy fallback intact
  });
});
