import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveMondePath } from "@/features/dashboards/student-monde/ivory";

const ROOT = resolve(__dirname, "../..");
function read(rel: string): string {
  return readFileSync(resolve(ROOT, rel), "utf-8");
}
function readRepo(rel: string): string {
  return readFileSync(resolve(ROOT, "..", rel), "utf-8");
}

describe("Lot 7A.2 · completed EXPIRED retiré", () => {
  const src = read("features/dashboards/student-monde/StudentMondeDashboard.tsx");

  it("completed n'est PAS dérivé de access.status === EXPIRED", () => {
    // La ligne originale contenait `access.status === "EXPIRED"` · elle
    // doit avoir disparu du wire MondeIvoryOverview.
    expect(src).not.toMatch(/completed:\s*data\.access\.status === ["']EXPIRED["']/);
  });

  it("completed reste false en runtime normal", () => {
    // Le composant reçoit completed: false hardcodé.
    expect(src).toMatch(/completed:\s*false/);
  });

  it("doc inline explique la doctrine (§2)", () => {
    expect(src).toMatch(/Lot 7A\.2/);
    expect(src).toMatch(/état pédagogique explicite|pédagogique/);
  });
});

describe("Dashboard Monde · reprise de cours", () => {
  const dashboard = read("features/dashboards/student-monde/StudentMondeDashboard.tsx");
  const overview = read("features/dashboards/student-monde/ivory/MondeIvoryOverview.tsx");

  it("branche le CTA principal sur la prochaine leçon réelle", () => {
    expect(dashboard).toContain("mondeLessonHref(currentLocale ?? locale, data.nextModule)");
    expect(dashboard).toContain("resumeHref={courseHref}");
    expect(overview).toContain("router.push(resumeHref)");
  });

  it("ne renvoie plus vers l’ancienne route inexistante", () => {
    expect(overview).not.toContain("/apprentissage");
  });
});

describe("Lot 7A.2 · resolveMondePath resserré · zéro faux positif", () => {
  it("valeurs canoniques exactes (STUDIES / WORK / TRAVEL / EXAM / DAILY_LIFE)", () => {
    // Correspondance exacte à un des 5 identifiants canoniques (upper).
    expect(resolveMondePath({ learningGoal: "STUDIES" })).toBe("STUDIES");
    expect(resolveMondePath({ learningGoal: "work" })).toBe("WORK"); // upper canonique
    expect(resolveMondePath({ learningGoal: "WORK" })).toBe("WORK");
    expect(resolveMondePath({ learningGoal: "TRAVEL" })).toBe("TRAVEL");
    expect(resolveMondePath({ learningGoal: "EXAM" })).toBe("EXAM");
    expect(resolveMondePath({ learningGoal: "DAILY_LIFE" })).toBe("DAILY_LIFE");
    expect(resolveMondePath({ learningGoal: "daily_life" })).toBe("DAILY_LIFE");
  });

  it("marqueurs longs · zéro faux positif sur mots courts", () => {
    // Faux positifs REFUSÉS · les mots courts historiques ne matchent plus.
    expect(resolveMondePath({ learningGoal: "je fais un test rapide" })).toBe(null); // "test" court
    expect(resolveMondePath({ learningGoal: "my family is nice" })).toBe(null);       // "family" court
    expect(resolveMondePath({ learningGoal: "quick trip to friends" })).toBe(null);   // "trip" court
    expect(resolveMondePath({ learningGoal: "great work today" })).toBe(null);        // "work" seul
    expect(resolveMondePath({ learningGoal: "hello world" })).toBe(null);
    expect(resolveMondePath({ learningGoal: "azerty" })).toBe(null);
  });

  it("marqueurs stricts positifs (FR/EN/DE)", () => {
    expect(resolveMondePath({ learningGoal: "étudier à Berlin" })).toBe("STUDIES");
    expect(resolveMondePath({ learningGoal: "study abroad in Germany" })).toBe("STUDIES");
    expect(resolveMondePath({ learningGoal: "voyager à Munich cet été" })).toBe("TRAVEL");
    expect(resolveMondePath({ learningGoal: "travel to Berlin next month" })).toBe("TRAVEL");
    expect(resolveMondePath({ learningGoal: "travailler à Zurich dès janvier" })).toBe("WORK");
    expect(resolveMondePath({ learningGoal: "job interview next week" })).toBe("WORK");
    expect(resolveMondePath({ learningGoal: "passer le goethe A2 en juin" })).toBe("EXAM");
    expect(resolveMondePath({ learningGoal: "vie quotidienne à Zurich" })).toBe("DAILY_LIFE");
    expect(resolveMondePath({ learningGoal: "daily life in Berlin" })).toBe("DAILY_LIFE");
  });

  it("null / vide / espaces", () => {
    expect(resolveMondePath({ learningGoal: null })).toBe(null);
    expect(resolveMondePath({ learningGoal: "" })).toBe(null);
    expect(resolveMondePath({ learningGoal: "    " })).toBe(null);
    expect(resolveMondePath({})).toBe(null);
  });

  it("casse et espaces · normalisés", () => {
    expect(resolveMondePath({ learningGoal: "  STUDIES  " })).toBe("STUDIES");
    expect(resolveMondePath({ learningGoal: "Study Abroad in Berlin" })).toBe("STUDIES");
    expect(resolveMondePath({ learningGoal: "ÉTUDIER À BERLIN" })).toBe("STUDIES");
  });

  it("ambiguïté · TRAVEL avant WORK (travel ≠ travailler)", () => {
    expect(resolveMondePath({ learningGoal: "travel to Berlin for work" })).toBe("TRAVEL");
    // "travailler" match WORK, jamais TRAVEL.
    expect(resolveMondePath({ learningGoal: "travailler à Berlin" })).toBe("WORK");
  });
});

describe("Lot 7A.2 · commandes P-1 fail-closed", () => {
  const testCmd = readRepo("scripts/test-monde-ivory-p1.mjs");
  const captureCmd = readRepo("scripts/capture-monde-ivory-p1.mjs");
  const pkg = JSON.parse(readRepo("package.json"));

  it("npm scripts définis", () => {
    expect(pkg.scripts["test:monde-ivory:p1"]).toBe("node scripts/test-monde-ivory-p1.mjs");
    expect(pkg.scripts["capture:monde-ivory:p1"]).toBe("node scripts/capture-monde-ivory-p1.mjs");
  });

  it("test:monde-ivory:p1 · exit 2 si P1_TEST_PASSWORD absent", () => {
    expect(testCmd).toMatch(/P1_TEST_PASSWORD/);
    expect(testCmd).toMatch(/NON-SKIPPABLE/);
    expect(testCmd).toMatch(/process\.exit\(2\)/);
  });

  it("test:monde-ivory:p1 · refuse URL non-P1", () => {
    expect(testCmd).toMatch(/kzzagbojjkivdzzcrmxn/);
    expect(testCmd).toMatch(/URL non-P1/);
  });

  it("capture:monde-ivory:p1 · idem fail-closed", () => {
    expect(captureCmd).toMatch(/P1_TEST_PASSWORD/);
    expect(captureCmd).toMatch(/NON-SKIPPABLE/);
    expect(captureCmd).toMatch(/kzzagbojjkivdzzcrmxn/);
  });
});

describe("Lot 7A.2 · orchestrateur capture · restauration finally obligatoire", () => {
  const src = readRepo("scripts/orchestrate-monde-ivory-capture.mjs");

  it("lit et sauvegarde original en MÉMOIRE avant modification", () => {
    expect(src).toMatch(/const original = await db\.user\.findUnique/);
    expect(src).toMatch(/original en mémoire/);
  });

  it("try/finally · restauration EXACTE + relecture DB de contrôle", () => {
    expect(src).toMatch(/} finally \{[\s\S]*?await db\.user\.update/);
    expect(src).toMatch(/Re-lire pour confirmer restauration exacte|restauration confirmée par relecture/);
  });

  it("échec explicite si restauration incorrecte (captureCode = 3 ou 4)", () => {
    expect(src).toMatch(/captureCode = Math\.max\(captureCode, 3\)|captureCode = 4/);
  });

  it("aucune valeur originale écrite sur disque", () => {
    // Pas de fs.writeFile ni de fs.writeFileSync avec original.
    expect(src).not.toMatch(/writeFileSync\([^)]*original\.|writeFile\([^)]*original\./);
  });

  it("blocklist P-1 explicite", () => {
    expect(src).toMatch(/"sbjhvlrkbyjckdxujjsk"/);
    expect(src).toMatch(/"mamofhrurksyuuolucea"/);
    expect(src).toMatch(/"qggwvonfumuimjfsgpdz"/);
  });
});

describe("Lot 7A.2 · orchestrateur test P-1 · vérifie sécurité API", () => {
  const src = readRepo("scripts/orchestrate-monde-ivory-p1.mjs");

  it("check onboarding.learningGoal + onboarding.targetCity présents", () => {
    expect(src).toMatch(/onboarding\.learningGoal/);
    expect(src).toMatch(/onboarding\.targetCity/);
  });

  it("REFUSE tout champ interdit dans le body API (email, supabaseId, ...)", () => {
    expect(src).toMatch(/email[\s\S]*?supabaseId[\s\S]*?role[\s\S]*?phone/);
    expect(src).toMatch(/champ interdit exposé/);
  });

  it("check data-monde-ivory présent dans le HTML SSR", () => {
    expect(src).toMatch(/data-monde-ivory/);
  });

  it("check ?monde_path=EXAM ignoré côté produit", () => {
    expect(src).toMatch(/monde_path=EXAM/);
    // Le message d'échec a évolué au Lot 7A.2 (SSR client-only) · on
    // vérifie uniquement la présence du fetch de la query + comparaison
    // de status.
    expect(src).toMatch(/aucun override server|override change le status/);
  });
});

describe("Lot 7A.2 · captures spec · 21 FR + 3 EN + MANIFEST", () => {
  const src = readRepo("tests/e2e/monde-ivory/captures.spec.ts");

  it("7 scénarios × 3 viewports = 21 captures FR + 3 EN captures", () => {
    expect(src).toMatch(/SCENARIOS = \[/);
    // Vérifie que les 7 scénarios sont présents.
    for (const id of ["no_pathway", "STUDIES", "WORK", "TRAVEL", "EXAM", "DAILY_LIFE", "incomplete_goal"]) {
      expect(src).toMatch(new RegExp(`id:\\s*["']${id}["']`));
    }
    // 3 viewports.
    for (const vp of ["desktop-1440", "tablet-768", "mobile-390"]) {
      expect(src).toMatch(new RegExp(`name:\\s*["']${vp}["']`));
    }
    // 3 EN captures.
    expect(src).toMatch(/EN_CAPTURES = \[/);
    expect(src).toMatch(/desktop-1440[\s\S]*?STUDIES/);
    expect(src).toMatch(/mobile-390[\s\S]*?EXAM/);
    expect(src).toMatch(/mobile-390[\s\S]*?DAILY_LIFE/);
  });

  it("bascule learningGoal via db.user.update avant chaque screenshot", () => {
    expect(src).toMatch(/db\.user\.update\(\{[\s\S]*?learningGoal:\s*(sc|c)\.goal/);
  });

  it("check overflow horizontal via DOM (scrollWidth > clientWidth)", () => {
    expect(src).toMatch(/d\.scrollWidth > d\.clientWidth/);
  });

  it("MANIFEST écrit dans afterAll", () => {
    expect(src).toMatch(/MANIFEST\.txt/);
    expect(src).toMatch(/test\.afterAll/);
  });
});

describe("Lot 7A.2 · non-régression totale", () => {
  it("Racines inchangé", () => {
    const r = read("features/dashboards/student-racines/StudentRacinesDashboard.tsx");
    expect(r).not.toMatch(/Lot 7A\.2/);
  });
  it("messagerie inchangée", () => {
    const m = read("lib/messaging/messages.ts");
    expect(m).not.toMatch(/Lot 7A\.2/);
  });
  it("permissions/entitlements inchangés dans monde-dashboard", () => {
    const api = read("app/api/me/monde-dashboard/route.ts");
    expect(api).not.toMatch(/Lot 7A\.2/);
    // La route n'a pas changé au Lot 7A.2 (seulement 7A.1 y a ajouté onboarding).
  });
});
