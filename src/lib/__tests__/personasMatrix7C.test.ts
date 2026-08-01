import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PERSONA_MATRIX, getPersona, type PersonaId } from "@/lib/personas/matrix";

const ROOT = resolve(__dirname, "../..");
const REPO = resolve(ROOT, "..");
function read(rel: string): string { return readFileSync(resolve(ROOT, rel), "utf-8"); }
function readRepo(rel: string): string { return readFileSync(resolve(REPO, rel), "utf-8"); }

describe("Lot 7C · matrice personas · 9 entrées canoniques", () => {
  it("les 9 personas sont présents", () => {
    const ids = PERSONA_MATRIX.map((p) => p.id);
    expect(ids).toEqual([
      "super_admin", "teacher", "coach", "center_admin",
      "student_monde", "student_racines", "family",
      "child_monde", "child_racines",
    ]);
  });

  it("chaque persona a une homeRoute /fr/ canonique", () => {
    for (const p of PERSONA_MATRIX) {
      expect(p.homeRoute, `persona ${p.id}`).toMatch(/^\/fr\//);
    }
  });

  it("les enfants n'ont ni email ni SpaceRole (auth via PIN)", () => {
    for (const id of ["child_monde", "child_racines"] as PersonaId[]) {
      const p = getPersona(id);
      expect(p.qaEmail).toBeNull();
      expect(p.spaceRole).toBeNull();
      expect(p.authKind).toBe("child_pin");
      expect(p.messaging.freeText).toBe(false);
      expect(p.messaging.realtime).toBe(false);
      expect(p.messaging.polling).toBe(true);
    }
  });

  it("les adultes ont email QA + SpaceRole + authKind session", () => {
    const adults: PersonaId[] = ["super_admin", "teacher", "coach", "center_admin", "student_monde", "student_racines", "family"];
    for (const id of adults) {
      const p = getPersona(id);
      expect(p.qaEmail, `persona ${id} email`).toMatch(/^test_yema_qa_[a-z_0-9]+@example\.com$/);
      expect(p.spaceRole).not.toBeNull();
      expect(p.authKind).toBe("session");
      expect(p.messaging.realtime).toBe(true);
    }
  });

  it("Family seul a parentCopy activé", () => {
    expect(getPersona("family").messaging.parentCopy).toBe(true);
    for (const id of ["super_admin", "teacher", "coach", "center_admin", "student_monde", "student_racines", "child_monde", "child_racines"] as PersonaId[]) {
      expect(getPersona(id).messaging.parentCopy, `${id}`).toBe(false);
    }
  });

  it("chaque persona a au moins 1 route autorisée + 1 interdite", () => {
    for (const p of PERSONA_MATRIX) {
      expect(p.allowedApi.length, `${p.id} allowed`).toBeGreaterThanOrEqual(1);
      expect(p.forbiddenApi.length, `${p.id} forbidden`).toBeGreaterThanOrEqual(1);
    }
  });

  it("SpaceRole ⊂ {STUDENT, TEACHER, CENTER, ADMIN} pour tous les adultes", () => {
    const allowed = new Set(["STUDENT", "TEACHER", "CENTER", "ADMIN"]);
    for (const p of PERSONA_MATRIX) {
      if (p.spaceRole !== null) expect(allowed.has(p.spaceRole), `${p.id}`).toBe(true);
    }
  });

  it("Universe est MONDE, RACINES, ou null (jamais autre)", () => {
    for (const p of PERSONA_MATRIX) {
      expect([null, "MONDE", "RACINES"]).toContain(p.universe);
    }
  });
});

describe("Lot 7C · matrice cohérente avec fixtures QA (yema-qa-fixtures.mjs)", () => {
  const fx = readRepo("scripts/test-baseline/yema-qa-fixtures.mjs");
  it("chaque email QA de la matrice existe dans les PERSONAS fixtures", () => {
    for (const p of PERSONA_MATRIX) {
      if (!p.qaEmail) continue;
      const shortName = p.qaEmail.replace("test_yema_qa_", "").split("@")[0];
      expect(fx, `fixtures label ${shortName}`).toMatch(new RegExp(`label:\\s*"${shortName}"`));
    }
  });
});

describe("Lot 7C · orchestrateurs P-1 fail-closed", () => {
  it("test:personas:p1 refuse URL non-P-1 + exige P1_TEST_PASSWORD", () => {
    const src = readRepo("scripts/test-personas-p1.mjs");
    expect(src).toMatch(/kzzagbojjkivdzzcrmxn/);
    expect(src).toMatch(/sbjhvlrkbyjckdxujjsk/);
    expect(src).toMatch(/MISSING P1_TEST_PASSWORD/);
  });

  it("test:entitlements:p1 refuse URL non-P-1 + exige SUPABASE_SERVICE_ROLE_KEY", () => {
    const src = readRepo("scripts/test-entitlements-p1.mjs");
    expect(src).toMatch(/kzzagbojjkivdzzcrmxn/);
    expect(src).toMatch(/MISSING SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("capture:personas:p1 refuse URL non-P-1 + exige P1_TEST_PASSWORD", () => {
    const src = readRepo("scripts/capture-personas-p1.mjs");
    expect(src).toMatch(/kzzagbojjkivdzzcrmxn/);
    expect(src).toMatch(/MISSING P1_TEST_PASSWORD/);
  });

  it("orchestrate-entitlements-p1 vérifie chaque règle commerciale figée", () => {
    const src = readRepo("scripts/orchestrate-entitlements-p1.mjs");
    // Chaque produit commercial doit être vérifié par le orchestrator.
    for (const code of ["PASSAGE", "ROOTS_SOLO", "ROOTS_FAMILY", "FAMILY_WORLD", "CHILD_WORLD_SINGLE"]) {
      expect(src, `product ${code}`).toMatch(new RegExp(code));
    }
    // Lot 7C.2 · cap enforced via HTTP canonique · doctrinal gaps documentés.
    expect(src).toMatch(/max_children_reached/);
    expect(src).toMatch(/attendu 409/);
    expect(src).toMatch(/Doctrinal gaps documentés/);
    // Universe null fail-closed.
    expect(src).toMatch(/universe:\s*null/);
  });
});

describe("Lot 7C · package.json · nouveaux scripts P-1", () => {
  const pkg = JSON.parse(readRepo("package.json"));
  it("test:personas:p1 branché sur test-personas-p1.mjs", () => {
    expect(pkg.scripts["test:personas:p1"]).toBe("node scripts/test-personas-p1.mjs");
  });
  it("test:entitlements:p1 branché sur test-entitlements-p1.mjs", () => {
    expect(pkg.scripts["test:entitlements:p1"]).toBe("node scripts/test-entitlements-p1.mjs");
  });
  it("capture:personas:p1 branché sur capture-personas-p1.mjs", () => {
    expect(pkg.scripts["capture:personas:p1"]).toBe("node scripts/capture-personas-p1.mjs");
  });
});

describe("Lot 7C.1 · orchestrateurs actifs · restauration + strict checks", () => {
  const entSrc = readRepo("scripts/orchestrate-entitlements-p1.mjs");
  const perSrc = readRepo("scripts/orchestrate-personas-p1.mjs");
  const capSpec = readRepo("tests/e2e/personas/captures.spec.ts");
  const perOrc = readRepo("scripts/orchestrate-personas-p1.mjs");
  const capOrc = readRepo("scripts/orchestrate-personas-capture.mjs");

  it("entitlements orchestrator · Family + Passage temp grant + cleanup finally", () => {
    expect(entSrc).toMatch(/db\.accessGrant\.create/);
    expect(entSrc).toMatch(/cleanup\.push/);
    expect(entSrc).toMatch(/runCleanup/);
    expect(entSrc).toMatch(/finally/);
    expect(entSrc).toMatch(/aucun résidu/);
  });

  it("entitlements orchestrator · cap enfants canonique via HTTP POST", () => {
    expect(entSrc).toMatch(/POST \/api\/family\/children/);
    expect(entSrc).toMatch(/max_children_reached/);
    expect(entSrc).toMatch(/5e enfant REFUSÉ/);
  });

  it("entitlements orchestrator · doctrinal gaps FAMILY_WORLD + CHILD_WORLD_SINGLE", () => {
    expect(entSrc).toMatch(/FAMILY_WORLD 3-seat cap · non enforced/);
    expect(entSrc).toMatch(/CHILD_WORLD_SINGLE 1-seat cap · non enforced/);
  });

  it("personas orchestrator · Child Monde + Child Racines direct via /api/child-session", () => {
    expect(perSrc).toMatch(/Child Monde \(Lina\)/);
    expect(perSrc).toMatch(/Child Racines \(Aicha\)/);
    expect(perSrc).toMatch(/\/api\/child-session/);
  });

  it("personas orchestrator · Invalidation PIN active · rotation temporaire + restauration", () => {
    expect(perSrc).toMatch(/Invalidation PIN active · rotation temporaire/);
    expect(perSrc).toMatch(/ancien PIN refusé/);
    expect(perSrc).toMatch(/nouveau PIN accepté/);
    expect(perSrc).toMatch(/PIN original restauré/);
  });

  it("capture spec · h1 strict === 1 · aucune tolérance", () => {
    expect(capSpec).toMatch(/expect\(h1Count,\s*`h1 count \$\{p\.id\} \$\{vp\.name\}`\)\.toBe\(1\)/);
    expect(capSpec).not.toMatch(/toBeLessThanOrEqual\(maxH1\)/);
  });

  it("orchestrateurs activent redesign flag pour éviter les 2 h1 legacy", () => {
    expect(perOrc).toMatch(/YEMA_DASHBOARD_REDESIGN_ENABLED:\s*"true"/);
    expect(capOrc).toMatch(/YEMA_DASHBOARD_REDESIGN_ENABLED:\s*"true"/);
  });
});

describe("Lot 7C.2 · fix h1 legacy DashboardMonde/DashboardRacines", () => {
  it("DashboardMonde legacy · h1 dégradé en h2 (visuel inchangé)", () => {
    const src = readRepo("src/components/monde/DashboardMonde.tsx");
    expect(src).not.toMatch(/<h1[\s>]/);
    expect(src).toMatch(/<h2 style=\{[\s\S]*?fontSize:\s*28/);
  });

  it("DashboardRacines legacy · h1 dégradé en h2 (visuel inchangé)", () => {
    const src = readRepo("src/components/racines/DashboardRacines.tsx");
    expect(src).not.toMatch(/<h1[\s>]/);
    expect(src).toMatch(/<h2 style=\{[\s\S]*?fontSize:\s*28/);
  });
});

describe("Lot 7C.2 · entitlements orchestrator · canonical HTTP + Super Admin isolation", () => {
  const src = readRepo("scripts/orchestrate-entitlements-p1.mjs");

  it("cap enfants testé via POST /api/family/children canonique", () => {
    expect(src).toMatch(/POST \/api\/family\/children/);
    expect(src).toMatch(/max_children_reached/);
    expect(src).toMatch(/statut \$\{fifthAttempt\.status\} \(attendu 409\)/);
  });

  it("siège libéré réutilisable · flow explicite", () => {
    expect(src).toMatch(/retrait 1 siège · réutilisation libérée/);
    expect(src).toMatch(/siège libéré réutilisable/);
  });

  it("Super Admin refusé sur /api/family/dashboard ET /api/child-session", () => {
    expect(src).toMatch(/Super Admin → \/api\/family\/dashboard refusé/);
    expect(src).toMatch(/Super Admin → \/api\/child-session refusé/);
  });

  it("doctrinal gaps documentés (FAMILY_WORLD 3 + CHILD_WORLD_SINGLE 1)", () => {
    expect(src).toMatch(/FAMILY_WORLD 3-seat cap · non enforced/);
    expect(src).toMatch(/CHILD_WORLD_SINGLE 1-seat cap · non enforced/);
  });

  it("cleanup finally + relecture leak check", () => {
    expect(src).toMatch(/runCleanup/);
    expect(src).toMatch(/leakGrants/);
    expect(src).toMatch(/leakChildren/);
  });
});

describe("Lot 7C.2 · captures overflow strict === 0 avec exceptions ciblées", () => {
  const spec = readRepo("tests/e2e/personas/captures.spec.ts");

  it("overflow strict === 0 · aucune tolérance numérique globale", () => {
    expect(spec).toMatch(/toBe\(0\)/);
    expect(spec).not.toMatch(/toBeLessThan\(20\)/);
    expect(spec).toMatch(/elts non-scrollables > viewport/);
  });

  it("exceptions déclarées via sélecteurs (data-overflow-ok, marquee, carousel)", () => {
    expect(spec).toMatch(/ALLOW = \[[\s\S]*?data-overflow-ok/);
    expect(spec).toMatch(/marquee/);
    expect(spec).toMatch(/data-carousel/);
  });
});

describe("Lot 7C · non-régression · Lots précédents intacts", () => {
  it("Lot 7A · MondeIvoryOverview toujours importé", () => {
    const s = read("features/dashboards/student-monde/StudentMondeDashboard.tsx");
    expect(s).toMatch(/MondeIvoryOverview/);
  });
  it("Lot 7B.1 · resolveMondePath partagé", () => {
    const s = read("features/dashboards/monde-context/PathwayMetaChip.tsx");
    expect(s).toMatch(/resolveMondePath/);
  });
  it("Lot 7B.2 · learningGoal sur ChildProfile schema", () => {
    const s = readRepo("prisma/schema.prisma");
    const start = s.indexOf("model ChildProfile");
    const end = s.indexOf("@@map(\"child_profiles\")", start);
    expect(s.slice(start, end)).toMatch(/learningGoal\s+String\?/);
  });
  it("P4.6 · messagerie inchangée", () => {
    const s = read("lib/messaging/messages.ts");
    expect(s).not.toMatch(/Lot 7C|PERSONA_MATRIX/);
  });
});
