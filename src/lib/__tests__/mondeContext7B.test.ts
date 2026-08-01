import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  distributePathways,
  priorityForPath,
} from "@/features/dashboards/student-monde/ivory";

const ROOT = resolve(__dirname, "../..");
function read(rel: string): string {
  return readFileSync(resolve(ROOT, rel), "utf-8");
}
function readRepo(rel: string): string {
  return readFileSync(resolve(ROOT, "..", rel), "utf-8");
}

describe("Lot 7B · priorityForPath · 5 parcours + unknown", () => {
  it("chaque parcours a une priorité distincte", () => {
    expect(priorityForPath("STUDIES")).toBe("priority.studies_written");
    expect(priorityForPath("WORK")).toBe("priority.work_oral");
    expect(priorityForPath("TRAVEL")).toBe("priority.travel_situations");
    expect(priorityForPath("EXAM")).toBe("priority.exam_skill");
    expect(priorityForPath("DAILY_LIFE")).toBe("priority.daily_conversation");
    expect(priorityForPath(null)).toBe("priority.unknown");
  });
});

describe("Lot 7B · distributePathways · comptage pur", () => {
  it("distribue selon resolveMondePath · unknown pour null/vide/faux positifs", () => {
    const rows = distributePathways([
      { learningGoal: "étudier à Berlin" },
      { learningGoal: "étudier à Munich" },
      { learningGoal: "travailler à Zurich" },
      { learningGoal: "voyager à Paris" },
      { learningGoal: "passer le goethe A1" },
      { learningGoal: "vie quotidienne à Berlin" },
      { learningGoal: "vie quotidienne à Zurich" },
      { learningGoal: null },
      { learningGoal: "hello world" },
    ]);
    expect(rows.find((r) => r.path === "STUDIES")?.count).toBe(2);
    expect(rows.find((r) => r.path === "WORK")?.count).toBe(1);
    expect(rows.find((r) => r.path === "TRAVEL")?.count).toBe(1);
    expect(rows.find((r) => r.path === "EXAM")?.count).toBe(1);
    expect(rows.find((r) => r.path === "DAILY_LIFE")?.count).toBe(2);
    expect(rows.find((r) => r.path === "UNKNOWN")?.count).toBe(2);
  });

  it("ordre fixe · STUDIES → WORK → TRAVEL → EXAM → DAILY_LIFE → UNKNOWN", () => {
    const rows = distributePathways([]);
    expect(rows.map((r) => r.path)).toEqual([
      "STUDIES", "WORK", "TRAVEL", "EXAM", "DAILY_LIFE", "UNKNOWN",
    ]);
    // Tous 0 quand la liste est vide.
    expect(rows.every((r) => r.count === 0)).toBe(true);
  });
});

describe("Lot 7B · Teacher API · projection minimale learningGoal", () => {
  const src = read("lib/teacher/queries.ts");

  it("select ajoute learningGoal · aucun autre champ User sensible", () => {
    // learningGoal projeté globalement dans queries.ts.
    expect(src).toMatch(/learningGoal:\s*true/);
    // Scope la vérification interdite au bloc getTeacherStudents (jusqu'au
    // prochain export async).
    const idxFn = src.indexOf("export async function getTeacherStudents");
    expect(idxFn).toBeGreaterThan(0);
    const idxEndFn = src.indexOf("\nexport async function", idxFn + 40);
    const scope = src.slice(idxFn, idxEndFn > 0 ? idxEndFn : idxFn + 2000);
    expect(scope).not.toMatch(/email:\s*true/);
    expect(scope).not.toMatch(/supabaseId:\s*true/);
    expect(scope).not.toMatch(/phone:\s*true/);
  });

  it("row.learningGoal projeté dans l'items retourné", () => {
    expect(src).toMatch(/learningGoal:\s*e\.user\.learningGoal/);
  });
});

describe("Lot 7B · Family API · projection universe (aucun pinHash)", () => {
  const src = read("lib/family/queries.ts");

  it("listFamilyChildren ajoute universe au select", () => {
    expect(src).toMatch(/universe:\s*true/);
  });

  it("row.universe projeté · aucun pinHash retourné au client", () => {
    expect(src).toMatch(/universe:\s*r\.universe/);
    // pinHash reste utilisé pour dériver hasPin mais JAMAIS retourné.
    const returnBlock = src.match(/return rows\.map\([\s\S]*?\}\)\);/);
    expect(returnBlock).toBeTruthy();
    expect(returnBlock![0]).not.toMatch(/pinHash:\s*r\.pinHash/);
  });
});

describe("Lot 7B · types miroir client", () => {
  it("TeacherStudentRow · learningGoal optionnel + classroomName optionnel", () => {
    const src = read("features/dashboards/teacher/types.ts");
    expect(src).toMatch(/learningGoal\?\s*:\s*string \| null/);
    expect(src).toMatch(/classroomName\?\s*:\s*string \| null/);
  });

  it("FamilyChildRow · universe optionnel MONDE|RACINES|null", () => {
    const src = read("features/dashboards/family/types.ts");
    expect(src).toMatch(/universe\?\s*:\s*"MONDE" \| "RACINES" \| null/);
  });
});

describe("Lot 7B · PathwayMetaChip · lecture uniquement (aucune décision)", () => {
  const src = read("features/dashboards/monde-context/PathwayMetaChip.tsx");

  it("utilise resolveMondePath (source unique) · aucun mapping local", () => {
    expect(src).toMatch(/resolveMondePath\(/);
    expect(src).not.toMatch(/case\s+"STUDIES"|case\s+"WORK"/);
  });

  it("mono chip · no-wrap + flex none (brief 7A)", () => {
    expect(src).toMatch(/whiteSpace:\s*"nowrap"/);
    expect(src).toMatch(/flex:\s*"none"/);
  });

  it("aucun drapeau · aucune nationalité inférée", () => {
    expect(src).not.toMatch(/🇩🇪|🇫🇷|🇨🇭|🇨🇲/);
    expect(src).not.toMatch(/nationality|origin/i);
  });
});

describe("Lot 7B · PathwayDistributionCard · lignes simples · or discret", () => {
  const src = read("features/dashboards/monde-context/PathwayDistributionCard.tsx");

  it("or uniquement sur ligne dominante (isDominant)", () => {
    expect(src).toMatch(/isDominant/);
    expect(src).toMatch(/var\(--monde-gold[^)]*\)/);
  });

  it("aucun graphique lourd (canvas, svg complexe, camembert, recharts)", () => {
    expect(src).not.toMatch(/<canvas|<svg|recharts|PieChart|Chart\b/);
  });

  it("liste avec border-top (pas de grille de cartes)", () => {
    expect(src).toMatch(/borderTop:\s*i === 0/);
  });
});

describe("Lot 7B · FamilyMondeChildCard · scope [data-monde-ivory] · lecture seule", () => {
  const src = read("features/dashboards/monde-context/FamilyMondeChildCard.tsx");

  it("wrapper porte data-monde-ivory", () => {
    expect(src).toMatch(/data-monde-ivory/);
  });

  it("aucun bouton d'action modifie la progression (progressbar aria-only)", () => {
    // Le composant contient uniquement · progressbar readonly + texte.
    // Aucun onClick handler ne devrait modifier la progression.
    expect(src).not.toMatch(/onClick.*progress|setProgress|onProgressChange/i);
    // Aucun form submit vers un endpoint pédagogique.
    expect(src).not.toMatch(/<form|onSubmit=/);
  });

  it("recommandation vient de i18n · aucun texte hardcodé", () => {
    expect(src).toMatch(/family\.recommendation\.\$\{path \?\? "unknown"\}/);
  });
});

describe("Lot 7B · Family scope · Ivory UNIQUEMENT si universe === MONDE", () => {
  const src = read("features/dashboards/family/sections/FamilyChildrenSection.tsx");

  it("FamilyMondeChildCard rendu conditionnel · universe === MONDE", () => {
    // Autorise le saut de ligne + ( entre ? et <FamilyMondeChildCard.
    expect(src).toMatch(/child\.universe === "MONDE"\s*\?\s*\(\s*<FamilyMondeChildCard/);
  });

  it("import depuis monde-context", () => {
    expect(src).toMatch(/import \{ FamilyMondeChildCard \} from ["']@\/features\/dashboards\/monde-context["']/);
  });
});

describe("Lot 7B · Teacher composition · nouvelle section pathway", () => {
  const src = read("features/dashboards/teacher/TeacherDashboard.tsx");

  it("import TeacherMondeContextSection", () => {
    expect(src).toMatch(/import \{ TeacherMondeContextSection \}/);
  });

  it("rendu dans la composition", () => {
    expect(src).toMatch(/<TeacherMondeContextSection\s*\/>/);
  });

  it("aucun tab de parcours ajouté", () => {
    expect(src).not.toMatch(/Teacher.*(STUDIES|WORK|TRAVEL|EXAM|DAILY_LIFE).*[Tt]ab/);
  });
});

describe("Lot 7B · i18n · parité stricte FR/EN yemaDashboards.mondeContext", () => {
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

  it("mondeContext présent FR + EN", () => {
    expect(fr.yemaDashboards.mondeContext).toBeDefined();
    expect(en.yemaDashboards.mondeContext).toBeDefined();
  });

  it("5 labels de parcours + fallback FR + EN", () => {
    for (const p of ["STUDIES", "WORK", "TRAVEL", "EXAM", "DAILY_LIFE"]) {
      expect(fr.yemaDashboards.mondeContext.pathwayLabel[p]).toBeTruthy();
      expect(en.yemaDashboards.mondeContext.pathwayLabel[p]).toBeTruthy();
    }
    expect(fr.yemaDashboards.mondeContext.fallback.unknown_short).toBeTruthy();
    expect(en.yemaDashboards.mondeContext.fallback.unknown_short).toBeTruthy();
  });

  it("5 recommandations Family + unknown FR + EN", () => {
    for (const p of ["STUDIES", "WORK", "TRAVEL", "EXAM", "DAILY_LIFE", "unknown"]) {
      expect(fr.yemaDashboards.mondeContext.family.recommendation[p]).toBeTruthy();
      expect(en.yemaDashboards.mondeContext.family.recommendation[p]).toBeTruthy();
    }
  });

  it("parité stricte des clés mondeContext.*", () => {
    const frKeys = new Set(flatten(fr.yemaDashboards.mondeContext, "mondeContext"));
    const enKeys = new Set(flatten(en.yemaDashboards.mondeContext, "mondeContext"));
    expect([...frKeys].filter((k) => !enKeys.has(k))).toEqual([]);
    expect([...enKeys].filter((k) => !frKeys.has(k))).toEqual([]);
  });

  it("aucun drapeau · aucune nationalité inférée dans les copies", () => {
    const flat = JSON.stringify(fr.yemaDashboards.mondeContext) + JSON.stringify(en.yemaDashboards.mondeContext);
    expect(flat).not.toMatch(/🇫🇷|🇺🇸|🇩🇪|🇬🇧|🇨🇭|🇨🇲/);
    expect(flat.toLowerCase()).not.toMatch(/africain|african origin/);
  });
});

describe("Lot 7B · non-régression totale", () => {
  it("Racines Student inchangé (aucune mention Lot 7B)", () => {
    const r = read("features/dashboards/student-racines/StudentRacinesDashboard.tsx");
    expect(r).not.toMatch(/Lot 7B|MondePath/);
  });

  it("Student Monde ivory inchangé (Lot 7A/7A.1/7A.2 conservés)", () => {
    const s = read("features/dashboards/student-monde/StudentMondeDashboard.tsx");
    // Le wire ivory existant reste intact · aucune modif 7B.
    expect(s).toMatch(/MondeIvoryOverview/);
  });

  it("Family types · aucun pinHash ni pinUpdatedAt exposé au client", () => {
    const src = read("features/dashboards/family/types.ts");
    expect(src).not.toMatch(/pinHash:/);
    expect(src).not.toMatch(/pinUpdatedAt:/);
  });

  it("messagerie inchangée", () => {
    const m = read("lib/messaging/messages.ts");
    expect(m).not.toMatch(/Lot 7B|mondeContext|PathwayMeta/);
  });

  it("aucune nouvelle route API pour ce lot", () => {
    // Le lot réutilise /api/teacher/students et /api/family/dashboard existants.
    // Aucun nouveau route.ts n'est créé sous api/monde-context.
    // Test structurel indirect · aucun import de nouvelle route.
    const teacherSrc = read("features/dashboards/teacher/sections/TeacherMondeContextSection.tsx");
    expect(teacherSrc).toMatch(/\/api\/teacher\/students/);
    expect(teacherSrc).not.toMatch(/\/api\/monde-context/);
  });
});
