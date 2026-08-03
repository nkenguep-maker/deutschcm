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
    // Lot 7B.1 · MondeContext prend désormais students en props.
    expect(src).toMatch(/<TeacherMondeContextSection\s+students=\{students\}/);
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
    // Lot 7B.1 · le fetch students a été LIFT au niveau TeacherDashboard.
    // MondeContext ne fait plus d'appel · Corrections ne fait plus d'appel.
    // Un seul point de vérité · /api/teacher/students appelé UNE fois.
    const dashSrc = read("features/dashboards/teacher/TeacherDashboard.tsx");
    expect(dashSrc).toMatch(/\/api\/teacher\/students/);
    const mondeSrc = read("features/dashboards/teacher/sections/TeacherMondeContextSection.tsx");
    expect(mondeSrc).not.toMatch(/fetch\(/);
    expect(mondeSrc).not.toMatch(/\/api\/monde-context/);
    const corrSrc = read("features/dashboards/teacher/sections/TeacherCorrectionsSection.tsx");
    expect(corrSrc).not.toMatch(/fetch\(/);
  });
});

describe("Lot 7B.1 · Teacher single fetch · dedupe & prop-passing", () => {
  const dashSrc = read("features/dashboards/teacher/TeacherDashboard.tsx");
  const mondeSrc = read("features/dashboards/teacher/sections/TeacherMondeContextSection.tsx");
  const corrSrc = read("features/dashboards/teacher/sections/TeacherCorrectionsSection.tsx");

  it("un seul appel /api/teacher/students dans tout le dashboard", () => {
    const dashCount = (dashSrc.match(/\/api\/teacher\/students/g) || []).length;
    const mondeCount = (mondeSrc.match(/\/api\/teacher\/students/g) || []).length;
    const corrCount = (corrSrc.match(/\/api\/teacher\/students/g) || []).length;
    expect(dashCount).toBe(1);
    expect(mondeCount).toBe(0);
    expect(corrCount).toBe(0);
  });

  it("students passés en props à Corrections + MondeContext", () => {
    expect(dashSrc).toMatch(/<TeacherCorrectionsSection\s+students=\{students\}/);
    expect(dashSrc).toMatch(/<TeacherMondeContextSection\s+students=\{students\}/);
  });

  it("MondeContext accepte students en Props · aucun state fetch", () => {
    expect(mondeSrc).toMatch(/students:\s*TeacherStudentRow\[\]/);
    expect(mondeSrc).not.toMatch(/useEffect/);
    expect(mondeSrc).not.toMatch(/useState/);
  });
});

describe("Lot 7B.1 · TeacherCorrectionsSection · contexte parcours par ligne", () => {
  const src = read("features/dashboards/teacher/sections/TeacherCorrectionsSection.tsx");

  it("accepte students en props · aucun fetch client", () => {
    expect(src).toMatch(/students:\s*TeacherStudentRow\[\]/);
    expect(src).not.toMatch(/fetch\(/);
  });

  it("PathwayMetaChip rendu par ligne d'apprenant", () => {
    expect(src).toMatch(/<PathwayMetaChip\s+learningGoal=\{s\.learningGoal\}\s+level=\{s\.level\}/);
  });

  it("aucun bouton d'action nouveau · aucune correction inventée", () => {
    expect(src).not.toMatch(/<button/);
    expect(src).not.toMatch(/onClick=/);
    expect(src).not.toMatch(/mark.*correct|noter|grade\(/i);
  });

  it("scope [data-monde-ivory] uniquement quand la liste est rendue", () => {
    expect(src).toMatch(/data-monde-ivory/);
  });
});

describe("Lot 7B.1 · TeacherMondeContextSection · distribution seule (preview retirée)", () => {
  const src = read("features/dashboards/teacher/sections/TeacherMondeContextSection.tsx");

  it("aucune preview d'apprenant (learnersPreview retiré)", () => {
    expect(src).not.toMatch(/learnersPreview/);
    expect(src).not.toMatch(/anonymousLearner/);
    expect(src).not.toMatch(/\.slice\(0,\s*5\)/);
  });

  it("rend uniquement PathwayDistributionCard (aucune <ul> de learners)", () => {
    expect(src).toMatch(/<PathwayDistributionCard/);
    expect(src).not.toMatch(/<ul\b/);
  });
});

describe("Lot 7B.1 · Family · learningGoal projeté depuis ChildProfile", () => {
  const querSrc = read("lib/family/queries.ts");
  const typeSrc = read("features/dashboards/family/types.ts");
  const secSrc = read("features/dashboards/family/sections/FamilyChildrenSection.tsx");

  it("listFamilyChildren select ajoute learningGoal", () => {
    expect(querSrc).toMatch(/learningGoal:\s*true/);
  });

  it("row.learningGoal projeté dans items retournés (nullable)", () => {
    expect(querSrc).toMatch(/learningGoal:\s*r\.learningGoal\s*\?\?\s*null/);
  });

  it("FamilyChildRow expose learningGoal optional string|null", () => {
    expect(typeSrc).toMatch(/learningGoal\?\s*:\s*string \| null/);
  });

  it("FamilyChildrenSection passe learningGoal réel au FamilyMondeChildCard", () => {
    // Plus de null hardcodé · la valeur vient de child.learningGoal.
    expect(secSrc).toMatch(/learningGoal:\s*child\.learningGoal\s*\?\?\s*null/);
    expect(secSrc).not.toMatch(/learningGoal:\s*null,\s*\n\s*level:\s*null/);
  });

  it("pinHash toujours exclu du DTO client", () => {
    const returnBlock = querSrc.match(/return rows\.map\([\s\S]*?\}\)\);/);
    expect(returnBlock).toBeTruthy();
    expect(returnBlock![0]).not.toMatch(/pinHash:\s*r\.pinHash/);
  });
});

describe("Lot 7B.1 · Prisma migration · ChildProfile.learningGoal additif", () => {
  const schema = readRepo("prisma/schema.prisma");
  const migration = readRepo("prisma/migrations/20260801000001_lot7b1_child_profile_learning_goal/migration.sql");

  it("schema.prisma déclare learningGoal String? sur ChildProfile", () => {
    // Le bloc ChildProfile doit contenir learningGoal String? (nullable).
    const start = schema.indexOf("model ChildProfile");
    expect(start).toBeGreaterThan(0);
    const end = schema.indexOf("@@map(\"child_profiles\")", start);
    const scope = schema.slice(start, end);
    expect(scope).toMatch(/learningGoal\s+String\?/);
  });

  it("migration additive · ADD COLUMN IF NOT EXISTS · aucun default", () => {
    expect(migration).toMatch(/ADD COLUMN IF NOT EXISTS "learningGoal" TEXT/);
    // Scope strict aux statements SQL (hors commentaires) · les checks
    // "sans DEFAULT / NOT NULL / valeur par défaut de parcours" ne doivent
    // pas être bruités par du texte descriptif.
    const sqlOnly = migration
      .split("\n")
      .filter((l) => !l.trim().startsWith("--"))
      .join("\n");
    expect(sqlOnly).not.toMatch(/DEFAULT/);
    expect(sqlOnly).not.toMatch(/NOT NULL/);
    expect(sqlOnly).not.toMatch(/STUDIES|WORK|TRAVEL|EXAM|DAILY_LIFE/);
  });

  it("migration ne touche que child_profiles.learningGoal (aucun autre champ)", () => {
    const alters = migration.match(/ALTER TABLE[\s\S]*?;/g) || [];
    expect(alters.length).toBe(1);
    expect(alters[0]).toMatch(/"child_profiles"/);
    expect(alters[0]).toMatch(/"learningGoal"/);
  });
});

describe("Lot 7B.1 · i18n · nouvelles clés corrections (parité FR/EN)", () => {
  const fr = JSON.parse(readRepo("messages/fr.json"));
  const en = JSON.parse(readRepo("messages/en.json"));

  it("queueContextNote + awaitingReview + anonymousLearner présents FR + EN", () => {
    for (const k of ["queueContextNote", "awaitingReview", "anonymousLearner"]) {
      expect(fr.yemaDashboards.teacher.corrections[k]).toBeTruthy();
      expect(en.yemaDashboards.teacher.corrections[k]).toBeTruthy();
    }
  });
});

describe("Lot 7B.2 · POST /api/family/children · learningGoal validation", () => {
  const src = read("app/api/family/children/route.ts");

  it("MONDE_PATHS enum côté serveur avec 5 valeurs canoniques", () => {
    expect(src).toMatch(/MONDE_PATHS.*=.*STUDIES.*WORK.*TRAVEL.*EXAM.*DAILY_LIFE/);
  });

  it("body accepte learningGoal optional string|null", () => {
    expect(src).toMatch(/learningGoal\?:\s*string \| null/);
  });

  it("valeur non canonique retourne 400 learning_goal_invalid", () => {
    expect(src).toMatch(/learning_goal_invalid/);
    expect(src).toMatch(/MONDE_PATHS.*includes/);
  });

  it("learningGoal envoyé pour RACINES (aucune foreign) est normalisé null", () => {
    // Le check hasForeign gate la persistance de learningGoal.
    expect(src).toMatch(/hasForeign/);
    expect(src).toMatch(/const hasForeign = built\.some\(\(l\) => l\.type === "foreign"\)/);
  });

  it("learningGoal persisté dans childProfile.create data", () => {
    expect(src).toMatch(/learningGoal,?\s*[},]/);
  });
});

describe("Lot 7B.2 · AddChildDialog · sélecteur parcours conditionnel MONDE", () => {
  // Release Canonicalization · l'AddChildDialog inline vivait dans le legacy
  // /famille (désormais redirect vers /family). Les 4 assertions inline
  // (6 options goalOpts, universe===MONDE conditional, LATER→null, POST
  // learningGoal) sont retirées côté page. La logique métier est couverte
  // par les tests server-side "Lot 7C.4 · POST /api/family/children" +
  // "Lot 7C.4 · createChildProfile · universe + learningGoal Monde restrict".

  it("placeholder · migration UX AddChildDialog vers /family/children/new pending", () => {
    // Sentinel · le nouveau flow Family link vers /children/new.
    const familyChildrenSection = read("features/dashboards/family/sections/FamilyChildrenSection.tsx");
    expect(familyChildrenSection).toMatch(/\/children\/new/);
  });
});

describe("Lot 7B.2 · TeacherCorrectionsSection · priorité pédagogique rendue par ligne", () => {
  const src = read("features/dashboards/teacher/sections/TeacherCorrectionsSection.tsx");

  it("import priorityForPath + resolveMondePath", () => {
    expect(src).toMatch(/import \{ priorityForPath, resolveMondePath \}/);
  });

  it("chaque ligne calcule le priorityKey", () => {
    expect(src).toMatch(/const path = resolveMondePath/);
    expect(src).toMatch(/const priorityKey = priorityForPath\(path\)/);
  });

  it("priorityKey est rendu via i18n dans le DOM (span visible)", () => {
    expect(src).toMatch(/tCtx\(priorityKey\)/);
  });

  it("data-priority-key attribut posé pour vérification DOM externe", () => {
    expect(src).toMatch(/data-priority-key=\{priorityKey\}/);
  });
});

describe("Lot 7B.2 · i18n · priority.* 5 clés + unknown (parité FR/EN)", () => {
  const fr = JSON.parse(readRepo("messages/fr.json"));
  const en = JSON.parse(readRepo("messages/en.json"));

  it("mondeContext.priority présent FR + EN avec 6 clés", () => {
    const keys = ["studies_written", "work_oral", "travel_situations", "exam_skill", "daily_conversation", "unknown"];
    for (const k of keys) {
      expect(fr.yemaDashboards.mondeContext.priority[k]).toBeTruthy();
      expect(en.yemaDashboards.mondeContext.priority[k]).toBeTruthy();
    }
  });
});

describe("Lot 7B.2 · Fixtures QA · Teacher enrollment + Family isolation", () => {
  const src = readRepo("scripts/test-baseline/yema-qa-fixtures.mjs");

  it("PERSONAS étendu avec 5 apprenants supplémentaires + family2", () => {
    for (const label of ["student_work", "student_exam", "student_nogoal", "student_external", "student_inactive", "family2"]) {
      expect(src).toMatch(new RegExp(`label:\\s*"${label}"`));
    }
  });

  it("LEARNING_GOALS mappe chaque étudiant à un parcours canonique", () => {
    expect(src).toMatch(/student_monde:\s*"STUDIES"/);
    expect(src).toMatch(/student_work:\s*"WORK"/);
    expect(src).toMatch(/student_exam:\s*"EXAM"/);
    expect(src).toMatch(/student_nogoal:\s*null/);
  });

  it("student_inactive enrolled mais isActive=false (test hors distribution)", () => {
    expect(src).toMatch(/student_inactive[\s\S]*?isActive:\s*false/);
  });

  it("student_external n'est PAS enrolled dans la classroom Teacher", () => {
    // Négation forte · aucun bloc enrollment ne mentionne student_external.
    expect(src).not.toMatch(/classroomEnrollment[\s\S]{0,200}student_external/);
  });

  it("Lina (child_family_monde) enrichi avec learningGoal=STUDIES", () => {
    expect(src).toMatch(/child_family_monde[\s\S]{0,500}learningGoal:\s*"STUDIES"/);
  });

  it("second enfant MONDE Malik (child_family_monde_exam) learningGoal=EXAM", () => {
    expect(src).toMatch(/child_family_monde_exam[\s\S]{0,500}learningGoal:\s*"EXAM"/);
  });

  it("isolation · household_family2 + child_family2_monde (parent différent)", () => {
    expect(src).toMatch(/household_family2/);
    expect(src).toMatch(/child_family2_monde/);
    expect(src).toMatch(/parentUserId:\s*family2User\.dbId/);
  });
});
