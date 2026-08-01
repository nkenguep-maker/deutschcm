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
    // Plafonds durs · 3 sièges enfant Monde, 2 sièges adultes Racines, 4 enfants Racines.
    expect(src).toMatch(/max 3/);
    expect(src).toMatch(/max 2/);
    expect(src).toMatch(/max 4/);
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
