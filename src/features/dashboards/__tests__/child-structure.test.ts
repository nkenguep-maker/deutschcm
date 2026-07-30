import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import fr from "../../../../messages/fr.json";
import en from "../../../../messages/en.json";
import { buildChildMondeNav, buildChildMondeMobileTabs } from "@/features/dashboards/child-monde/nav";
import { buildChildRacinesNav, buildChildRacinesMobileTabs } from "@/features/dashboards/child-racines/nav";

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

const cmFiles = walk(join(ROOT, "child-monde"));
const crFiles = walk(join(ROOT, "child-racines"));

describe("Child navs (Lot 5)", () => {
  it("Monde desktop = 6 rubriques ; mobile = 4 tabs", () => {
    const desk = buildChildMondeNav(
      { home: "Maison", games: "Jeux", stories: "Histoires", badges: "Badges", progression: "Progression", adultActivities: "Adulte" },
      "/fr/dashboard",
    );
    expect(desk[0].items).toHaveLength(6);
    const tabs = buildChildMondeMobileTabs(
      { home: "Maison", games: "Jeux", stories: "Histoires", badges: "Badges" },
      "/fr/dashboard",
    );
    expect(tabs).toHaveLength(4);
    expect(tabs.map((t) => t.key)).toEqual(["home", "games", "stories", "badges"]);
  });

  it("Racines desktop = 6 rubriques ; mobile = 4 tabs", () => {
    const desk = buildChildRacinesNav(
      { home: "Case", tales: "Contes", songs: "Chansons", badges: "Badges", oralProgress: "Oral", familyActivities: "Famille" },
      "/fr/dashboard",
    );
    expect(desk[0].items).toHaveLength(6);
    const tabs = buildChildRacinesMobileTabs(
      { home: "Case", tales: "Contes", songs: "Chansons", badges: "Badges" },
      "/fr/dashboard",
    );
    expect(tabs).toHaveLength(4);
    expect(tabs.map((t) => t.key)).toEqual(["home", "tales", "songs", "badges"]);
  });
});

describe("Child dashboards structure (Lot 5)", () => {
  it("aucun composant enfant ne contient <h1", () => {
    const off = [...cmFiles, ...crFiles].filter((f) => /<h1[\s>]/.test(readFileSync(f, "utf-8")));
    expect(off).toEqual([]);
  });

  it("aucun composant enfant ne rend {parentUserId} ou {householdId} en texte nu", () => {
    const forbidden = [/>\s*\{[a-zA-Z_$.]*parentUserId\s*\}\s*</, />\s*\{[a-zA-Z_$.]*householdId\s*\}\s*</];
    const off = [...cmFiles, ...crFiles].filter((f) => {
      const src = readFileSync(f, "utf-8");
      return forbidden.some((re) => re.test(src));
    });
    expect(off).toEqual([]);
  });

  it("aucun composant enfant ne référence pinHash dans le code exécutable", () => {
    const off = [...cmFiles, ...crFiles].filter((f) => /\bpinHash\b/.test(stripComments(readFileSync(f, "utf-8"))));
    expect(off).toEqual([]);
  });

  it("child dashboard expose le bouton Quitter le mode enfant (DELETE /api/child-session)", () => {
    const cm = readFileSync(join(ROOT, "child-monde/ChildMondeDashboard.tsx"), "utf-8");
    const cr = readFileSync(join(ROOT, "child-racines/ChildRacinesDashboard.tsx"), "utf-8");
    for (const s of [cm, cr]) {
      expect(s).toMatch(/method:\s*["']DELETE["']/);
      expect(s).toMatch(/\/api\/child-session/);
      expect(s).toMatch(/exitChildMode/);
    }
  });

  it("aucune fausse messagerie ni <audio> dans les composants enfants", () => {
    const off = [...cmFiles, ...crFiles].filter((f) => {
      const src = stripComments(readFileSync(f, "utf-8"));
      return /<audio[\s>]|MediaRecorder|getUserMedia|conversation/i.test(src);
    });
    expect(off).toEqual([]);
  });
});

describe("Child i18n parité (Lot 5)", () => {
  it("namespaces childMonde + childRacines présents FR/EN", () => {
    const y1 = (fr as { yemaDashboards: Record<string, unknown> }).yemaDashboards;
    const y2 = (en as { yemaDashboards: Record<string, unknown> }).yemaDashboards;
    expect(y1.childMonde).toBeDefined();
    expect(y1.childRacines).toBeDefined();
    expect(y2.childMonde).toBeDefined();
    expect(y2.childRacines).toBeDefined();
  });
  it("nav et mobileNav ont les bons compteurs", () => {
    const f = (fr as { yemaDashboards: { childMonde: { nav: Record<string, string>; mobileNav: Record<string, string> } } }).yemaDashboards.childMonde;
    expect(Object.keys(f.nav)).toHaveLength(6);
    expect(Object.keys(f.mobileNav)).toHaveLength(4);
    const g = (fr as { yemaDashboards: { childRacines: { nav: Record<string, string>; mobileNav: Record<string, string> } } }).yemaDashboards.childRacines;
    expect(Object.keys(g.nav)).toHaveLength(6);
    expect(Object.keys(g.mobileNav)).toHaveLength(4);
  });
});

describe("QA personas 9-total + child endpoints (Lot 5)", () => {
  const personasSrc = readFileSync(resolve(__dirname, "../../../lib/qa/personas.ts"), "utf-8");

  it("QA_PERSONAS contient child_monde et child_racines", () => {
    expect(personasSrc).toMatch(/id:\s*["']child_monde["']/);
    expect(personasSrc).toMatch(/id:\s*["']child_racines["']/);
  });

  it("QaPersonaId union inclut child_monde et child_racines", () => {
    expect(personasSrc).toMatch(/\|\s*["']child_monde["']/);
    expect(personasSrc).toMatch(/\|\s*["']child_racines["']/);
  });

  it("isQaPersonaId whitelist a exactement les 9 personas", () => {
    // Doit contenir les 9 IDs sans en manquer.
    for (const id of [
      "super_admin", "teacher", "coach", "center_admin",
      "student_monde", "student_racines",
      "family", "child_monde", "child_racines",
    ]) {
      expect(personasSrc).toMatch(new RegExp(`"${id}"`));
    }
  });

  it("child personas destinations pointent vers /api/qa/child-session", () => {
    // Extrait le bloc child_monde
    const cmStart = personasSrc.indexOf('id: "child_monde"');
    const cmBlock = personasSrc.slice(cmStart, cmStart + 400);
    expect(cmBlock).toMatch(/\/api\/qa\/child-session\?child=monde/);

    const crStart = personasSrc.indexOf('id: "child_racines"');
    const crBlock = personasSrc.slice(crStart, crStart + 400);
    expect(crBlock).toMatch(/\/api\/qa\/child-session\?child=racines/);
  });

  it("endpoint /api/qa/child-session gate resolveQaConfig avant toute logique", () => {
    const src = readFileSync(resolve(__dirname, "../../../app/api/qa/child-session/route.ts"), "utf-8");
    const gateIdx = src.indexOf("resolveQaConfig()");
    const authIdx = src.indexOf("supabase.auth.getUser");
    expect(gateIdx).toBeGreaterThan(0);
    expect(authIdx).toBeGreaterThan(gateIdx);
  });
});

describe("Session enfant sécurité (Lot 5)", () => {
  it("route /api/child-session vérifie ownership avant PIN et set cookie HttpOnly", () => {
    const src = readFileSync(resolve(__dirname, "../../../app/api/child-session/route.ts"), "utf-8");
    // parentUserId résolu server-side depuis la session Supabase
    expect(src).toMatch(/resolveFamilyGuardianActorOrNull/);
    // Vérification que l'enfant appartient au parent (parentUserId: actor.userId)
    expect(src).toMatch(/parentUserId:\s*actor\.userId/);
    // verifyChildPin server-side
    expect(src).toMatch(/verifyChildPin/);
    // Cookie HttpOnly
    expect(src).toMatch(/httpOnly:\s*true/);
    // Rien ne retourne pinHash dans une NextResponse.json (leak client).
    // Note : pinHash apparaît dans un select Prisma interne pour dériver
    // la présence — non retourné au client, vérifié par les tests API
    // projections du Lot 4A.
    const jsonReturns = src.match(/NextResponse\.json\(\s*\{[\s\S]*?\}\s*(?:,\s*\{[^}]*\})?\s*\)/g) ?? [];
    for (const chunk of jsonReturns) expect(chunk).not.toMatch(/pinHash/);
  });

  it("resolveActiveChildSession lit le cookie et vérifie la signature", () => {
    const src = readFileSync(resolve(__dirname, "../../../lib/family/childResolvers.ts"), "utf-8");
    expect(src).toMatch(/verifyChildSession/);
    expect(src).toMatch(/CHILD_SESSION_COOKIE_NAME/);
    // Aucun pinHash dans la projection retournée
    const projectionMatch = src.match(/select:\s*\{[\s\S]*?\}/);
    if (projectionMatch) expect(projectionMatch[0]).not.toMatch(/pinHash/);
  });

  it("dispatch /[locale]/dashboard résout la session enfant AVANT la session adulte", () => {
    const src = readFileSync(resolve(__dirname, "../../../app/[locale]/dashboard/page.tsx"), "utf-8");
    const childIdx = src.indexOf("resolveActiveChildSession");
    const supabaseIdx = src.indexOf("supabase.auth.getUser");
    expect(childIdx).toBeGreaterThan(0);
    expect(supabaseIdx).toBeGreaterThan(0);
    expect(childIdx).toBeLessThan(supabaseIdx);
  });
});

describe("Universe seat counting (Lot 5)", () => {
  it("childSeatsUniverse : ROOTS_FAMILY donne 4 sièges Racines, aucun Monde par défaut", () => {
    const src = readFileSync(resolve(__dirname, "../../../lib/family/childSeatsUniverse.ts"), "utf-8");
    expect(src).toMatch(/ProductCode\.ROOTS_FAMILY/);
    expect(src).toMatch(/racinesMax \+= 4/);
    // Aucune mention d'un +=1 ou +=X sur mondeMax hors commentaires
    const noComments = src.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
    expect(noComments).not.toMatch(/mondeMax\s*\+=\s*\d+/);
  });
});
