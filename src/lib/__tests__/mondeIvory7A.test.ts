import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { MONDE_PATH_CONFIG, MONDE_PATHS, derivePathStatus, resolveMondePath } from "@/features/dashboards/student-monde/ivory";

const ROOT = resolve(__dirname, "../..");
function read(rel: string): string {
  return readFileSync(resolve(ROOT, rel), "utf-8");
}
function readRepo(rel: string): string {
  return readFileSync(resolve(ROOT, "..", rel), "utf-8");
}

describe("MondePath · exhaustivité + adaptateur", () => {
  it("5 parcours canoniques exactement", () => {
    expect(MONDE_PATHS).toEqual(["STUDIES", "WORK", "TRAVEL", "EXAM", "DAILY_LIFE"]);
    expect(MONDE_PATH_CONFIG.STUDIES).toBeDefined();
    expect(MONDE_PATH_CONFIG.WORK).toBeDefined();
    expect(MONDE_PATH_CONFIG.TRAVEL).toBeDefined();
    expect(MONDE_PATH_CONFIG.EXAM).toBeDefined();
    expect(MONDE_PATH_CONFIG.DAILY_LIFE).toBeDefined();
  });

  it("resolveMondePath · null quand aucun goal", () => {
    expect(resolveMondePath({})).toBeNull();
    expect(resolveMondePath({ learningGoal: null })).toBeNull();
    expect(resolveMondePath({ learningGoal: "" })).toBeNull();
    expect(resolveMondePath({ learningGoal: "hello world" })).toBeNull();
  });

  it("resolveMondePath · marqueurs stricts FR/EN/DE (Lot 7A.2 hardened)", () => {
    // Marqueurs longs et sans ambiguïté · brief 7A.2 §3.
    expect(resolveMondePath({ learningGoal: "étudier à Berlin" })).toBe("STUDIES");
    expect(resolveMondePath({ learningGoal: "study abroad in Germany" })).toBe("STUDIES");
    expect(resolveMondePath({ learningGoal: "travailler à Zurich" })).toBe("WORK");
    expect(resolveMondePath({ learningGoal: "job interview soon" })).toBe("WORK");
    expect(resolveMondePath({ learningGoal: "voyager à Munich" })).toBe("TRAVEL");
    expect(resolveMondePath({ learningGoal: "travel to Berlin next month" })).toBe("TRAVEL");
    expect(resolveMondePath({ learningGoal: "passer le goethe A2" })).toBe("EXAM");
    expect(resolveMondePath({ learningGoal: "goethe zertifikat A1" })).toBe("EXAM");
    expect(resolveMondePath({ learningGoal: "vie quotidienne à Zurich" })).toBe("DAILY_LIFE");
    expect(resolveMondePath({ learningGoal: "daily life in Berlin" })).toBe("DAILY_LIFE");
  });

  it("resolveMondePath · mondePath explicite prime sur learningGoal", () => {
    expect(resolveMondePath({ mondePath: "EXAM", learningGoal: "travailler" })).toBe("EXAM");
  });

  it("derivePathStatus · 4 états métier (brief §12)", () => {
    expect(derivePathStatus({ path: null }).state).toBe("no_pathway");
    expect(derivePathStatus({ path: "TRAVEL" }).state).toBe("incomplete_goal");
    expect(derivePathStatus({ path: "TRAVEL", targetDate: "2027-01-01" }).state).toBe("active");
    expect(derivePathStatus({ path: "EXAM" }).state).toBe("incomplete_goal");
    expect(derivePathStatus({ path: "EXAM", targetDate: "2027-01-01" }).state).toBe("active");
    expect(derivePathStatus({ path: "STUDIES" }).state).toBe("incomplete_goal");
    expect(derivePathStatus({ path: "STUDIES", targetCity: "Berlin" }).state).toBe("active");
    expect(derivePathStatus({ path: "WORK", targetCity: "Zurich" }).state).toBe("active");
    expect(derivePathStatus({ path: "DAILY_LIFE" }).state).toBe("active");
    expect(derivePathStatus({ path: "STUDIES", targetCity: "Berlin", progressPct: 100 }).state).toBe("completed");
    expect(derivePathStatus({ path: "STUDIES", targetCity: "Berlin", completed: true }).state).toBe("completed");
  });

  it("derivePathStatus · progressPct clamp 0..100", () => {
    expect(derivePathStatus({ path: "STUDIES", targetCity: "Berlin", progressPct: -10 }).progressPct).toBe(0);
    expect(derivePathStatus({ path: "STUDIES", targetCity: "Berlin", progressPct: 250 }).progressPct).toBe(100);
    expect(derivePathStatus({ path: "STUDIES", targetCity: "Berlin", progressPct: NaN }).progressPct).toBe(0);
  });
});

describe("MondePathConfig · pilote signalétique + module + stepLabel", () => {
  it("STUDIES · signal NEXT STOP · module ADMISSION_CHECKLIST · STEP", () => {
    const c = MONDE_PATH_CONFIG.STUDIES;
    expect(c.signalLabelKey).toBe("signal.next_stop");
    expect(c.moduleKind).toBe("ADMISSION_CHECKLIST");
    expect(c.stepLabel).toBe("STEP");
  });
  it("WORK · signal NEXT STOP · INTERVIEW_TOPICS · STEP", () => {
    const c = MONDE_PATH_CONFIG.WORK;
    expect(c.signalLabelKey).toBe("signal.next_stop");
    expect(c.moduleKind).toBe("INTERVIEW_TOPICS");
    expect(c.stepLabel).toBe("STEP");
  });
  it("TRAVEL · signal DÉPART DANS · TRAVEL_SITUATIONS · BLOC", () => {
    const c = MONDE_PATH_CONFIG.TRAVEL;
    expect(c.signalLabelKey).toBe("signal.travel_countdown");
    expect(c.moduleKind).toBe("TRAVEL_SITUATIONS");
    expect(c.stepLabel).toBe("BLOC");
  });
  it("EXAM · signal EXAMEN DANS · EXAM_SKILLS · BLOC", () => {
    const c = MONDE_PATH_CONFIG.EXAM;
    expect(c.signalLabelKey).toBe("signal.exam_countdown");
    expect(c.moduleKind).toBe("EXAM_SKILLS");
    expect(c.stepLabel).toBe("BLOC");
  });
  it("DAILY_LIFE · signal NEXT STOP · DAILY_TOPICS · STEP", () => {
    const c = MONDE_PATH_CONFIG.DAILY_LIFE;
    expect(c.signalLabelKey).toBe("signal.next_stop");
    expect(c.moduleKind).toBe("DAILY_TOPICS");
    expect(c.stepLabel).toBe("STEP");
  });

  it("moduleKind est un discriminated union · 5 valeurs distinctes", () => {
    const kinds = MONDE_PATHS.map((p) => MONDE_PATH_CONFIG[p].moduleKind);
    expect(new Set(kinds).size).toBe(5);
  });
});

describe("Tokens Monde Ivory · valeurs canoniques (brief §2)", () => {
  const css = read("features/dashboards/student-monde/ivory/tokens.css");

  it("papier ivoire + surface + border", () => {
    expect(css).toMatch(/--monde-paper:\s*#F1EBE0/);
    expect(css).toMatch(/--monde-surface:\s*#FBF8F2/);
    expect(css).toMatch(/--monde-border:\s*#DED5C6/);
    expect(css).toMatch(/--monde-border-strong:\s*#CBC0AE/);
  });

  it("encre + ink hover + on-ink", () => {
    expect(css).toMatch(/--monde-ink:\s*#1C1712/);
    expect(css).toMatch(/--monde-ink-hover:\s*#33291F/);
    expect(css).toMatch(/--monde-on-ink:\s*#FBF8F2/);
  });

  it("or · gold + light + on-ink + tint", () => {
    expect(css).toMatch(/--monde-gold:\s*#A87423/);
    expect(css).toMatch(/--monde-gold-light:\s*#C99A4E/);
    expect(css).toMatch(/--monde-gold-on-ink:\s*#E7B865/);
    expect(css).toMatch(/--monde-gold-tint:\s*rgba\(168,\s*116,\s*35,\s*0\.09\)/);
  });

  it("bouton primaire · encre (jamais or, jamais dégradé)", () => {
    const primaryBlock = css.match(/\.monde-cta-primary\s*\{[\s\S]*?\}/);
    expect(primaryBlock).toBeTruthy();
    expect(primaryBlock![0]).toMatch(/background:\s*var\(--monde-ink\)/);
    expect(primaryBlock![0]).not.toMatch(/gradient/i);
    expect(primaryBlock![0]).not.toMatch(/var\(--monde-gold\b/);
  });

  it("scope [data-monde-ivory] uniquement · aucun override global", () => {
    expect(css).toMatch(/\[data-monde-ivory\]\s*\{/);
    // Les tokens ne s'appliquent pas hors du scope · check basique.
    expect(css).not.toMatch(/^:root\s*\{[\s\S]*?--monde-/m);
  });

  it("micro-labels · white-space: nowrap + flex: none (brief §2)", () => {
    const mono = css.match(/\.monde-mono\s*\{[\s\S]*?\}/);
    expect(mono).toBeTruthy();
    expect(mono![0]).toMatch(/white-space:\s*nowrap/);
    expect(mono![0]).toMatch(/flex:\s*none/);
  });

  it("hero editorial · h2.monde-hero-title · text-wrap: pretty + clamp 25..44px", () => {
    // Le h1 unique reste dans DashboardHeader · ivory utilise h2.monde-hero-title.
    const heroTitle = css.match(/\[data-monde-ivory\]\s+\.monde-hero-title\s*\{[\s\S]*?\}/);
    expect(heroTitle).toBeTruthy();
    expect(heroTitle![0]).toMatch(/text-wrap:\s*pretty/);
    expect(heroTitle![0]).toMatch(/clamp\(25px,[\s\S]*?44px\)/);
  });

  it("mobile · CTA principal ≥ 54px + pleine largeur (brief §16)", () => {
    // Le bloc mobile contient width: 100% ET min-height: 54px · ordre libre.
    const mobileBlock = css.match(/@media\s*\(max-width:\s*480px\)[\s\S]*?\}\s*\}/);
    expect(mobileBlock).toBeTruthy();
    expect(mobileBlock![0]).toMatch(/width:\s*100%/);
    expect(mobileBlock![0]).toMatch(/min-height:\s*54px/);
  });

  it("prefers-reduced-motion · animation ≈ 0 (brief §17)", () => {
    expect(css).toMatch(/@media\s+\(prefers-reduced-motion:\s*reduce\)[\s\S]*?animation-duration:\s*0\.001ms/);
  });
});

describe("Hero · un seul h1 · CTA encre · aucun tab sélecteur", () => {
  const src = read("features/dashboards/student-monde/ivory/MondeIvoryHero.tsx");

  it("h2.monde-hero-title (le h1 unique reste dans DashboardHeader)", () => {
    const h1Count = (src.match(/<h1\b/g) || []).length;
    expect(h1Count).toBe(0);
    expect(src).toMatch(/<h2 id="monde-ivory-hero-title" className="monde-hero-title">/);
  });

  it("CTA principal utilise className monde-cta-primary", () => {
    expect(src).toMatch(/className="monde-cta-primary"/);
  });

  it("aria-label progression · valeur textuelle accessible", () => {
    expect(src).toMatch(/role="progressbar"/);
    expect(src).toMatch(/aria-valuenow=\{status\.progressPct\}/);
    expect(src).toMatch(/aria-label=\{t\("hero\.progress_label"/);
  });

  it("signal DÉPART DANS N JOURS via i18n si TRAVEL avec date", () => {
    expect(src).toMatch(/signal\.travel_countdown/);
    expect(src).toMatch(/signal\.travel_no_date/);
    expect(src).toMatch(/signal\.exam_countdown/);
  });
});

describe("MondeIvoryOverview · orchestration + AUCUN tab de parcours en prod", () => {
  const src = read("features/dashboards/student-monde/ivory/MondeIvoryOverview.tsx");

  it("aucun tab/sélecteur de parcours visible en production", () => {
    // Lot 7A.1 · l'override query a été retiré · aucun tab UI, aucun
    // URLSearchParams client, aucun bypass. Le parcours vient uniquement
    // de resolveMondePath(data.onboarding.learningGoal).
    expect(src).not.toMatch(/<Tabs\b|role="tablist"|onTabChange/);
    expect(src).not.toMatch(/function readQaOverride|const readQaOverride/);
    expect(src).not.toMatch(/URLSearchParams/);
  });

  it("4 états métier gérés (no_pathway, incomplete_goal, active, completed)", () => {
    for (const s of ['"no_pathway"', '"incomplete_goal"', '"completed"']) {
      expect(src).toMatch(new RegExp(s));
    }
    // active est le fallback else · check que PathwayModule est rendu.
    expect(src).toMatch(/PathwayModule/);
  });

  it("état 'no_pathway' · action unique 'Définir mon objectif'", () => {
    expect(src).toMatch(/empty\.no_pathway\.label/);
    expect(src).toMatch(/cta\.define_goal/);
  });

  it("carte Parcours actif discrète (pas de grille de cartes)", () => {
    expect(src).toMatch(/PARCOURS ·/);
  });

  it("data-monde-ivory · scope activé", () => {
    expect(src).toMatch(/data-monde-ivory/);
  });
});

describe("PathwayModule · UN SEUL module rendu à la fois", () => {
  const src = read("features/dashboards/student-monde/ivory/PathwayModule.tsx");

  it("lit MONDE_PATH_CONFIG · pas de if/else par path", () => {
    expect(src).toMatch(/getPathConfig\(path\)/);
    // Aucun switch/if dispersé sur MondePath dans ce fichier.
    expect(src).not.toMatch(/case\s+"STUDIES"/);
    expect(src).not.toMatch(/case\s+"WORK"/);
  });

  it("liste sobre · border-top 1px · minHeight 44px", () => {
    expect(src).toMatch(/borderTop:\s*idx === 0/);
    expect(src).toMatch(/minHeight:\s*44/);
  });

  it("stepLabel dérivé du config (STEP ou BLOC)", () => {
    expect(src).toMatch(/cfg\.stepLabel/);
  });
});

describe("i18n · yemaDashboards.studentMonde.ivory FR/EN parity stricte", () => {
  const fr = JSON.parse(readRepo("messages/fr.json"));
  const en = JSON.parse(readRepo("messages/en.json"));

  function flatten(obj: Record<string, unknown>, prefix = ""): string[] {
    const keys: string[] = [];
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === "object" && !Array.isArray(v)) keys.push(...flatten(v as Record<string, unknown>, key));
      else keys.push(key);
    }
    return keys;
  }

  it("ivory présent FR + EN", () => {
    expect(fr.yemaDashboards.studentMonde.ivory).toBeDefined();
    expect(en.yemaDashboards.studentMonde.ivory).toBeDefined();
  });

  it("parité stricte des clés ivory.*", () => {
    const frKeys = new Set(flatten(fr.yemaDashboards.studentMonde.ivory, "ivory"));
    const enKeys = new Set(flatten(en.yemaDashboards.studentMonde.ivory, "ivory"));
    expect([...frKeys].filter((k) => !enKeys.has(k))).toEqual([]);
    expect([...enKeys].filter((k) => !frKeys.has(k))).toEqual([]);
  });

  it("5 titres hero + 5 sous-titres présents FR + EN", () => {
    for (const p of ["STUDIES", "WORK", "TRAVEL", "EXAM", "DAILY_LIFE"]) {
      expect(fr.yemaDashboards.studentMonde.ivory.hero.title[p]).toBeTruthy();
      expect(en.yemaDashboards.studentMonde.ivory.hero.title[p]).toBeTruthy();
      expect(fr.yemaDashboards.studentMonde.ivory.hero.subtitle[p]).toBeTruthy();
      expect(en.yemaDashboards.studentMonde.ivory.hero.subtitle[p]).toBeTruthy();
    }
  });

  it("5 modules i18n cohérents avec MONDE_PATH_CONFIG", () => {
    for (const p of MONDE_PATHS) {
      const kind = MONDE_PATH_CONFIG[p].moduleKind;
      expect(fr.yemaDashboards.studentMonde.ivory.modules[kind]).toBeDefined();
      expect(en.yemaDashboards.studentMonde.ivory.modules[kind]).toBeDefined();
      expect(fr.yemaDashboards.studentMonde.ivory.modules[kind].title).toBeTruthy();
      expect(fr.yemaDashboards.studentMonde.ivory.modules[kind].items?.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("Aucun drapeau / nationalité inférée dans les copies FR/EN", () => {
    const flat = JSON.stringify(fr.yemaDashboards.studentMonde.ivory) + JSON.stringify(en.yemaDashboards.studentMonde.ivory);
    // Aucun emoji drapeau · aucune référence "africain/européen" comme identité.
    expect(flat).not.toMatch(/🇫🇷|🇺🇸|🇩🇪|🇬🇧|🇨🇭|🇨🇲/);
    // "africain" ne doit pas apparaître (Monde ne se réduit pas à une origine).
    expect(flat.toLowerCase()).not.toMatch(/africain|african origin/);
  });
});

describe("Non-régression · Racines / entitlements / messagerie intacts", () => {
  it("aucun token Racines modifié", () => {
    const tokens = readRepo("src/features/dashboards/shared/yema-tokens.css");
    expect(tokens).toMatch(/--yema-roots-surface:\s*#2A1017/);
    expect(tokens).toMatch(/--yema-roots-border:\s*#4A2230/);
  });

  it("aucune modification de src/lib/messaging", () => {
    // Le lot 7A ne touche PAS à la messagerie. Vérification structurelle
    // que les fichiers messagerie n'ont pas été édités par ce lot (via
    // absence de nouveau symbole 7A dans les fichiers messagerie).
    const messages = readRepo("src/lib/messaging/messages.ts");
    expect(messages).not.toMatch(/Lot 7A|MondePath|mondeIvory/);
  });
});

describe("Dashboard wire · composition UNIQUE Lot 7A.1 (OverviewSection retiré)", () => {
  const src = read("features/dashboards/student-monde/StudentMondeDashboard.tsx");

  it("import MondeIvoryOverview", () => {
    expect(src).toMatch(/import \{ MondeIvoryOverview \} from ["'].\/ivory\/MondeIvoryOverview["']/);
  });

  it("OverviewSection RETIRÉ (composition unique · brief 7A.1 §5)", () => {
    expect(src).not.toMatch(/import \{ OverviewSection \}/);
    expect(src).not.toMatch(/<OverviewSection/);
  });

  it("JourneySection RETIRÉ (duplication progression du hero)", () => {
    expect(src).not.toMatch(/import \{ JourneySection \}/);
    expect(src).not.toMatch(/<JourneySection/);
  });

  it("AssignmentsSection + ClassSection conservés dans la hiérarchie ivoire", () => {
    expect(src).toMatch(/<AssignmentsSection/);
    expect(src).toMatch(/<ClassSection/);
  });
});
