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
  it("le wrapper P-1 empêche Next.js de recharger .env.local", () => {
    const src = readRepo("scripts/test-baseline/run-p4-5-b2-p1.mjs");
    expect(src).toMatch(/childEnv\.__NEXT_PROCESSED_ENV\s*=\s*"true"/);
    expect(src).toMatch(/NODE_OPTIONS.*block-next-local-env/);
    const blocker = readRepo("scripts/test-baseline/block-next-local-env.cjs");
    expect(blocker).toMatch(/nextEnvFile/);
    expect(blocker).toMatch(/error\.code = "ENOENT"/);
  });

  it("test:personas:p1 délègue le chargement et les refus P-1 au wrapper strict", () => {
    const src = readRepo("scripts/test-personas-p1.mjs");
    expect(src).toMatch(/scripts\/test-baseline\/run-p4-5-b2-p1\.mjs/);
    expect(src).not.toMatch(/process\.env\.NEXT_PUBLIC_SUPABASE_URL/);
    const wrapper = readRepo("scripts/test-baseline/run-p4-5-b2-p1.mjs");
    expect(wrapper).toMatch(/kzzagbojjkivdzzcrmxn/);
    expect(wrapper).toMatch(/P1_TEST_PASSWORD/);
  });

  it("E2E B2 provisionne Auth avant Playwright et nettoie les deux plans dans finally", () => {
    const pkg = JSON.parse(readRepo("package.json"));
    const src = readRepo("scripts/orchestrate-e2e-b2-p1.mjs");

    expect(pkg.scripts["test:e2e:b2"]).toBe(
      "node scripts/test-baseline/run-p4-5-b2-p1.mjs --flag on -- node scripts/orchestrate-e2e-b2-p1.mjs --flag on",
    );
    expect(pkg.scripts["test:e2e:b2:flag-off"]).toBe(
      "node scripts/test-baseline/run-p4-5-b2-p1.mjs --flag off -- node scripts/orchestrate-e2e-b2-p1.mjs --flag off",
    );
    expect(src).toMatch(/p4-5-b-fixtures\.mjs/);
    expect(src).toMatch(/p4-5-b-auth-fixtures\.mjs/);
    expect(src.indexOf("p4-5-b-auth-fixtures.mjs")).toBeLessThan(src.indexOf("primaryResult = runPlaywright(mode)"));
    expect(src).toMatch(/finally\s*\{[\s\S]*p4-5-b-cleanup\.mjs[\s\S]*p4-5-b-auth-cleanup\.mjs/);
    expect(src).toMatch(/data cleanup failed/);
    expect(src).toMatch(/Auth cleanup failed/);
    expect(readRepo("scripts/test-baseline/p4-5-b-cleanup.mjs")).toMatch(/process\.exitCode = 1/);
    const dataFixtures = readRepo("scripts/test-baseline/p4-5-b-fixtures.mjs");
    const authFixtures = readRepo("scripts/test-baseline/p4-5-b-auth-fixtures.mjs");
    const authSetup = readRepo("tests/e2e/p4-5-b2b3-b2/auth.setup.ts");
    expect(dataFixtures).toMatch(/db\.userRole\.upsert/);
    expect(authFixtures).toMatch(/app_metadata/);
    expect(authSetup).toMatch(/page\.goto\("\/api\/me"/);
    expect(authSetup).toMatch(/expected successful auth sync/);
    expect(authSetup).toMatch(/attempt < 12/);
    expect(authSetup).toMatch(/expected authenticated \/api\/me/);
    expect(readRepo("playwright.p4-5-b2.config.ts")).toMatch(/http:\/\/localhost:\$\{PORT\}/);
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
    for (const code of ["PASSAGE", "ROOTS_SOLO", "ROOTS_FAMILY", "FAMILY_WORLD", "CHILD_WORLD_SINGLE"]) {
      expect(src, `product ${code}`).toMatch(new RegExp(code));
    }
    // Lot 7C.4 · caps par univers · pools Monde et Racines séparés.
    expect(src).toMatch(/pool Monde saturé/);
    expect(src).toMatch(/pool Racines saturé/);
    expect(src).toMatch(/CROSS-SUBSIDY PROUVÉE IMPOSSIBLE/);
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
    expect(entSrc).toMatch(/4e Monde REFUSÉ/);
    expect(entSrc).toMatch(/5e Racines REFUSÉ/);
  });

  it("entitlements orchestrator · caps commerciaux PAR UNIVERS (Lot 7C.4)", () => {
    expect(entSrc).toMatch(/FAMILY_WORLD → 3 Monde/);
    expect(entSrc).toMatch(/CHILD_WORLD_SINGLE → 1 Monde/);
    expect(entSrc).toMatch(/ROOTS_FAMILY → 4 Racines/);
    expect(entSrc).toMatch(/CROSS-SUBSIDY PROUVÉE IMPOSSIBLE/);
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

describe("Lot 7C.4 · capacityFromProduct · pools structurés par univers", () => {
  const src = readRepo("src/lib/family/seats.ts");

  it("FamilySeatCapacity type · 3 champs distincts (mondeChildren / racinesChildren / rootsAdults)", () => {
    expect(src).toMatch(/export interface FamilySeatCapacity/);
    expect(src).toMatch(/mondeChildren:\s*number/);
    expect(src).toMatch(/racinesChildren:\s*number/);
    expect(src).toMatch(/rootsAdults:\s*number/);
  });

  it("FAMILY_WORLD → 3 Monde / 0 Racines / 0 adulte", () => {
    expect(src).toMatch(/case "FAMILY_WORLD":\s*\n\s*return \{ mondeChildren: 3, racinesChildren: 0, rootsAdults: 0 \}/);
  });
  it("CHILD_WORLD_SINGLE → 1 Monde / 0 Racines / 0 adulte", () => {
    expect(src).toMatch(/case "CHILD_WORLD_SINGLE":\s*\n\s*return \{ mondeChildren: 1, racinesChildren: 0, rootsAdults: 0 \}/);
  });
  it("ROOTS_FAMILY → 0 Monde / 4 Racines / 2 adultes", () => {
    expect(src).toMatch(/case "ROOTS_FAMILY":\s*\n\s*return \{ mondeChildren: 0, racinesChildren: 4, rootsAdults: 2 \}/);
  });
  it("code inconnu → ZERO fail-closed", () => {
    expect(src).toMatch(/default:\s*\n\s*return ZERO/);
  });
});

describe("Lot 7C.4 · assertCanAddChildProfile · exige universe + pool dédié", () => {
  const src = readRepo("src/lib/family/seats.ts");

  it("signature accepte universe: SeatUniverse", () => {
    expect(src).toMatch(/assertCanAddChildProfile\(\s*actor:\s*FamilyGuardianActor,\s*universe:\s*SeatUniverse/);
  });
  it("refuse universe invalide (fail-closed universe_invalid)", () => {
    expect(src).toMatch(/reason:\s*"universe_invalid"/);
  });
  it("consulte uniquement le pool demandé (mondeChildren OU racinesChildren)", () => {
    expect(src).toMatch(/universe === "MONDE" \? snap\.capacity\.mondeChildren : snap\.capacity\.racinesChildren/);
    expect(src).toMatch(/universe === "MONDE" \? snap\.remaining\.mondeChildren : snap\.remaining\.racinesChildren/);
  });
  it("réponse KO expose universe + limit + current du pool spécifique", () => {
    expect(src).toMatch(/universe:\s*SeatUniverse \| null/);
    expect(src).toMatch(/limit:\s*number/);
    expect(src).toMatch(/current:\s*number/);
  });
});

describe("Lot 7C.4 · getFamilySeatSnapshot · comptage explicite par universe", () => {
  const src = readRepo("src/lib/family/seats.ts");

  it("count ChildProfile filtré par universe MONDE et RACINES séparément", () => {
    expect(src).toMatch(/universe:\s*"MONDE"/);
    expect(src).toMatch(/universe:\s*"RACINES"/);
    expect(src).toMatch(/mondeUsed/);
    expect(src).toMatch(/racinesUsed/);
  });
  it("snapshot expose capacity + used + remaining structurés", () => {
    expect(src).toMatch(/capacity: FamilySeatCapacity/);
    expect(src).toMatch(/used: FamilySeatCapacity/);
    expect(src).toMatch(/remaining: FamilySeatCapacity/);
  });
});

describe("Gate 8A · POST /api/family/children · universe EXPLICITE (brief §1)", () => {
  const src = readRepo("src/app/api/family/children/route.ts");

  it("universe reçu explicitement du body (JAMAIS dérivé de la langue)", () => {
    expect(src).toMatch(/body\.universe === "MONDE" \? "MONDE"/);
    expect(src).toMatch(/body\.universe === "RACINES" \? "RACINES"/);
    // Le serveur NE doit PAS dériver universe depuis hasForeign.
    expect(src).not.toMatch(/const universe:\s*"MONDE" \| "RACINES" = hasForeign/);
  });

  it("universe absent ou invalide → 400 universe_required", () => {
    expect(src).toMatch(/universe_required/);
    expect(src).toMatch(/status:\s*400/);
  });

  // Release Canonicalization · l'AddChildDialog inline vivait dans le
  // legacy /famille (désormais redirect). L'assertion inline est retirée ·
  // la validation server-side universe reste couverte par les tests
  // "Lot 7C.4 · POST /api/family/children · dérive universe depuis body".
});

describe("Lot 7C.4 · POST /api/family/children · service canonique par pool", () => {
  const src = readRepo("src/app/api/family/children/route.ts");

  it("dérive universe depuis body (Gate 8A · brief §1)", () => {
    expect(src).toMatch(/body\.universe === "MONDE"/);
  });
  it("passe universe à assertCanAddChildProfile", () => {
    expect(src).toMatch(/assertCanAddChildProfile\(guardian,\s*universe\)/);
  });
  it("erreur 409 canonique expose universe + limit dérivés du pool", () => {
    expect(src).toMatch(/universe: gate\.universe/);
    expect(src).toMatch(/limit: gate\.limit/);
    expect(src).toMatch(/current: gate\.current/);
  });
  it("ChildProfile.create persiste universe (jamais dérivé rétroactivement)", () => {
    expect(src).toMatch(/universe,\s*\n\s*learningGoal/);
  });
});

describe("Lot 7C.4 · createChildProfile · universe obligatoire + learningGoal Monde restrict", () => {
  const src = readRepo("src/lib/family/children.ts");

  it("CreateChildInput exige universe: SeatUniverse", () => {
    expect(src).toMatch(/universe:\s*SeatUniverse/);
  });
  it("refus invalid_universe si universe absent/invalide", () => {
    expect(src).toMatch(/"invalid_universe"/);
  });
  it("learningGoal Monde normalisé null si universe RACINES", () => {
    expect(src).toMatch(/input\.universe === "MONDE" \? \(input\.learningGoal \?\? null\) : null/);
  });
});

describe("Lot 7C.3 · POST /api/family/children · assertCanAddChildProfile canonique", () => {
  const src = readRepo("src/app/api/family/children/route.ts");

  it("import service canonique assertCanAddChildProfile + actor resolver", () => {
    expect(src).toMatch(/import \{ resolveFamilyGuardianActorOrNull \}/);
    expect(src).toMatch(/import \{ assertCanAddChildProfile \}/);
  });
  it("route utilise assertCanAddChildProfile avec universe (Lot 7C.4)", () => {
    expect(src).toMatch(/assertCanAddChildProfile\(guardian,\s*universe\)/);
    expect(src).not.toMatch(/const MAX_CHILDREN = 4/);
  });
  it("erreur 409 canonique inclut reason + limit dérivé du snapshot", () => {
    expect(src).toMatch(/reason: gate\.reason/);
    expect(src).toMatch(/status:\s*409/);
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
    expect(src).toMatch(/4e Monde REFUSÉ/);
    expect(src).toMatch(/5e Racines REFUSÉ/);
  });

  it("siège libéré réutilisable · flow explicite", () => {
    expect(src).toMatch(/siège Monde libéré → réutilisable/);
    expect(src).toMatch(/siège Monde libéré réutilisable/);
  });

  it("Super Admin refusé sur /api/family/dashboard ET /api/child-session", () => {
    expect(src).toMatch(/Super Admin → \/api\/family\/dashboard refusé/);
    expect(src).toMatch(/Super Admin → \/api\/child-session refusé/);
  });

  it("caps commerciaux PAR UNIVERS (Lot 7C.4 · Gate 8A)", () => {
    expect(src).toMatch(/FAMILY_WORLD → 3 Monde/);
    expect(src).toMatch(/CHILD_WORLD_SINGLE → 1 Monde/);
    expect(src).toMatch(/ROOTS_FAMILY → 4 Racines/);
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

describe("Gate 8K · fix(child) UI PIN dialog + Coach data-testid + Playwright UI flow", () => {
  const dialog = readRepo("src/components/famille/ChildPinDialog.tsx");
  // Release Canonicalization · l'ancienne var familyPage (legacy /famille
  // page.tsx) est retirée · le contenu est désormais un redirect testé dans
  // le describe "Release Canonicalization" plus bas.
  const coachSection = readRepo("src/features/dashboards/coach-racines/sections/CoachLearnersSection.tsx");
  const spec = readRepo("tests/e2e/final-browser-acceptance/gate8k-child-ui-flow.spec.ts");
  const wrapper = readRepo("scripts/test-child-ui-signoff-p1.mjs");
  const pkg = JSON.parse(readRepo("package.json"));

  it("ChildPinDialog composant séparé", () => {
    expect(dialog).toMatch(/export function ChildPinDialog/);
    expect(dialog).toMatch(/POST[^"]*\/api\/child-session/);
  });

  it("ChildPinDialog · aucune valeur PIN par défaut · input numeric password", () => {
    expect(dialog).toMatch(/useState\(""\)/);
    expect(dialog).toMatch(/inputMode="numeric"/);
    expect(dialog).toMatch(/type="password"/);
  });

  it("ChildPinDialog · erreur générique (aucune divulgation)", () => {
    expect(dialog).toMatch(/errGeneric/);
  });

  it("ChildPinDialog · submit désactivé pendant envoi + PIN < 4 char", () => {
    expect(dialog).toMatch(/disabled=\{submitting \|\| pin\.length < 4\}/);
  });

  it("ChildPinDialog · aucune persistance localStorage/sessionStorage (hors commentaire)", () => {
    const withoutComments = dialog.replace(/\/\/[^\n]*/g, "");
    expect(withoutComments).not.toMatch(/localStorage/);
    expect(withoutComments).not.toMatch(/sessionStorage/);
  });

  it("ChildPinDialog · redirect router.push + wipe PIN après 200", () => {
    expect(dialog).toMatch(/router\.push/);
    expect(dialog).toMatch(/setPin\(""\)/);
  });

  it("ChildPinDialog · cibles tactiles 44px + label + aria-labelledby", () => {
    expect(dialog).toMatch(/minHeight:\s*44/);
    expect(dialog).toMatch(/aria-labelledby/);
    expect(dialog).toMatch(/aria-modal="true"/);
  });

  // Release Canonicalization · l'invocation UI de <ChildPinDialog /> vivait
  // dans le legacy /famille (désormais redirect vers /family). Les tests
  // wiring UX (state pinChild, testids "family-child-*", copy openChildSpace)
  // sont retirés · la migration vers /family + integration PIN reste ouverte
  // (voir FamilyChildrenSection). Le composant ChildPinDialog lui-même
  // reste couvert par les 5 tests "ChildPinDialog · ..." plus haut.

  it("CoachLearnersSection · data-testid coach-learner-card + data-circle-language", () => {
    expect(coachSection).toMatch(/data-testid="coach-learners-list"/);
    expect(coachSection).toMatch(/data-testid="coach-learner-card"/);
    expect(coachSection).toMatch(/data-circle-language=\{child\.circleLanguage/);
  });

  it("CoachLearnersSection · aucune donnée sensible dans data-*", () => {
    expect(coachSection).not.toMatch(/data-child-profile-id/);
    expect(coachSection).not.toMatch(/data-household-id/);
  });

  it("Playwright spec · PIN flow API canonique bilingue", () => {
    // Depuis Release Canonicalization · le flow PIN passe par POST /api/child
    // -session (le dialogue UI vit dans src/components/famille/ChildPinDialog
    // pour usage futur dans /family, plus dans /famille/page.tsx).
    expect(spec).toMatch(/for \(const locale of \["fr", "en"\]/);
    expect(spec).toMatch(/POST \/api\/child-session/);
  });

  it("Playwright spec · redirect /famille et /famille/enfant assertés", () => {
    expect(spec).toMatch(/\/famille → \/family \(server redirect\)/);
    expect(spec).toMatch(/\/famille\/enfant\/\[profilId\] → \/family sans profilId/);
  });

  it("Playwright spec · POST /api/child-session status 200 + PIN invalide 401", () => {
    expect(spec).toMatch(/openResp\.status\(\)[\s\S]*\.toBe\(200\)/);
    expect(spec).toMatch(/PIN 0000 → 401 PIN_INVALID/);
    expect(spec).toMatch(/PIN_INVALID/);
  });

  it("Playwright spec · Coach API scope + circleLanguage", () => {
    expect(spec).toMatch(/roots-coach\/profiles/);
    expect(spec).toMatch(/WOLOF/);
    expect(spec).toMatch(/SWAHILI/);
  });

  it("npm script test:child-ui-signoff:p1 branché", () => {
    expect(pkg.scripts["test:child-ui-signoff:p1"]).toBe("node scripts/test-child-ui-signoff-p1.mjs");
    expect(pkg.scripts["capture:child-ui-signoff:p1"]).toBe("node scripts/capture-child-ui-signoff-p1.mjs");
  });

  it("wrapper fail-closed + flags Coach", () => {
    expect(wrapper).toMatch(/MISSING P1_TEST_PASSWORD/);
    expect(wrapper).toMatch(/YEMA_COACH_WORKSPACE_ENABLED:\s*"true"/);
    expect(wrapper).toMatch(/YEMA_ROOTS_COACH_RLS_CONFIRMED:\s*"true"/);
  });
});

describe("Gate 8J · final-child-evidence · Coach DOM isolation + Child dashboards + network scoping", () => {
  const wrapper = readRepo("scripts/test-final-child-evidence-p1.mjs");
  const orc = readRepo("scripts/orchestrate-final-child-evidence-p1.ts");
  const spec = readRepo("tests/e2e/final-browser-acceptance/gate8j-child-coach-dom.spec.ts");
  const pkg = JSON.parse(readRepo("package.json"));

  it("wrapper fail-closed + flags Coach", () => {
    expect(wrapper).toMatch(/MISSING P1_TEST_PASSWORD/);
    expect(wrapper).toMatch(/YEMA_COACH_WORKSPACE_ENABLED:\s*"true"/);
    expect(wrapper).toMatch(/YEMA_ROOTS_COACH_RLS_CONFIRMED:\s*"true"/);
  });

  it("npm scripts test:final-child-evidence + capture branchés", () => {
    expect(pkg.scripts["test:final-child-evidence:p1"]).toBe("node scripts/test-final-child-evidence-p1.mjs");
    expect(pkg.scripts["capture:final-child-evidence:p1"]).toBe("node scripts/capture-final-child-evidence-p1.mjs");
  });

  it("spec Playwright · Coach A/B DOM · cross-leak isolation (assertion ABSENCE)", () => {
    expect(spec).toMatch(/TempRacinesB ABSENT du DOM \(cross-leak isolation\)/);
    expect(spec).toMatch(/TempRacinesA ABSENT du DOM \(cross-leak isolation\)/);
    expect(spec).toMatch(/not\.toContain\(CHILD_B_NAME\)/);
    expect(spec).toMatch(/not\.toContain\(CHILD_A_NAME\)/);
  });

  it("spec Playwright · Child Monde/Racines dashboards via session cookie (UI PIN modal absent du produit)", () => {
    expect(spec).toMatch(/UI PIN modal absent du produit/);
    expect(spec).toMatch(/page\.request\.post.*api\/child-session/);
    expect(spec).toMatch(/child-dashboard-session-cookie/);
  });

  it("spec Playwright · Child assertions bilingues (FR + EN pour chaque univers)", () => {
    expect(spec).toMatch(/for \(const locale of \["fr", "en"\]/);
    expect(spec).toMatch(/child_\$\{label\}/);
    expect(spec).toMatch(/"monde".*"MONDE".*"Lina"/);
    expect(spec).toMatch(/"racines".*"RACINES".*"Aïcha"/);
  });

  it("spec Playwright · Network interception · Family API vs adult API", () => {
    expect(spec).toMatch(/page\.on\("request"/);
    expect(spec).toMatch(/Family API called on \/famille/);
    expect(spec).toMatch(/Adult API NOT called on \/famille/);
  });

  it("orchestrator cleanup finally · 6 niveaux + relecture 4 checks", () => {
    expect(orc).toMatch(/leakUsers/);
    expect(orc).toMatch(/leakChildren/);
    expect(orc).toMatch(/leakCircles/);
    expect(orc).toMatch(/leakHouseholds/);
  });
});

describe("Gate 8I · final-browser-acceptance · Playwright Coach dashboards + dual context captures", () => {
  const wrapper = readRepo("scripts/test-final-browser-acceptance-p1.mjs");
  const orc = readRepo("scripts/orchestrate-final-browser-acceptance-p1.ts");
  const spec = readRepo("tests/e2e/final-browser-acceptance/gate8i.spec.ts");
  const config = readRepo("playwright.final-browser-acceptance.config.ts");
  const pkg = JSON.parse(readRepo("package.json"));

  it("wrapper fail-closed + flags Coach obligatoires", () => {
    expect(wrapper).toMatch(/MISSING P1_TEST_PASSWORD/);
    expect(wrapper).toMatch(/MISSING SUPABASE_SERVICE_ROLE_KEY/);
    expect(wrapper).toMatch(/YEMA_COACH_WORKSPACE_ENABLED:\s*"true"/);
    expect(wrapper).toMatch(/YEMA_ROOTS_COACH_RLS_CONFIRMED:\s*"true"/);
  });

  it("npm scripts test:final-browser-acceptance + capture branchés", () => {
    expect(pkg.scripts["test:final-browser-acceptance:p1"]).toBe("node scripts/test-final-browser-acceptance-p1.mjs");
    expect(pkg.scripts["capture:final-browser-acceptance:p1"]).toBe("node scripts/capture-final-browser-acceptance-p1.mjs");
  });

  it("orchestrateur provisionne Coach A/B + enfants Racines distincts + PASSAGE + LP", () => {
    expect(orc).toMatch(/childAId = `test_yema_qa_gate8i_child_a_/);
    expect(orc).toMatch(/childBId = `test_yema_qa_gate8i_child_b_/);
    expect(orc).toMatch(/tempPassageId = `test_yema_qa_gate8i_passage_/);
    expect(orc).toMatch(/universe:\s*"RACINES"/);
    expect(orc).toMatch(/language:\s*"WOLOF"/);
    expect(orc).toMatch(/language:\s*"SWAHILI"/);
  });

  it("orchestrateur lance Playwright chromium avec credentials propagés", () => {
    expect(orc).toMatch(/GATE8I_COACH_A_EMAIL:\s*coachAEmail/);
    expect(orc).toMatch(/GATE8I_COACH_B_EMAIL:\s*coachBEmail/);
    expect(orc).toMatch(/playwright\.final-browser-acceptance\.config\.ts/);
  });

  it("Playwright spec teste Family + Monde adulte FR + EN (6 tests)", () => {
    expect(spec).toMatch(/for \(const locale of \["fr", "en"\]/);
    expect(spec).toMatch(/Family avant navigation/);
    expect(spec).toMatch(/Monde adulte apres navigation/);
    expect(spec).toMatch(/Family apres retour/);
    expect(spec).toMatch(/not\.toMatch\(\/Lina\|Malik\|Aïcha\//);
  });

  it("Playwright spec teste Coach A/B dashboards Chromium", () => {
    expect(spec).toMatch(/Coach A \+ Coach B dashboards Chromium/);
    expect(spec).toMatch(/dashboard Racines Chromium/);
    expect(spec).toMatch(/coach-\$\{label\}-fr-1440\.png/);
  });

  it("Playwright config · testDir + chromium project", () => {
    expect(config).toMatch(/testDir:\s*"tests\/e2e\/final-browser-acceptance"/);
    expect(config).toMatch(/name:\s*"chromium"/);
  });

  it("captures h1===1 + overflow===0 strict", () => {
    expect(spec).toMatch(/h1Count === 1 && overflow === 0/);
  });

  it("cleanup finally · 6 niveaux · relecture leak 5 checks", () => {
    expect(orc).toMatch(/leakUsers/);
    expect(orc).toMatch(/leakChildren/);
    expect(orc).toMatch(/leakCircles/);
    expect(orc).toMatch(/leakHouseholds/);
    expect(orc).toMatch(/leakGrants/);
  });
});

describe("Gate 8H · final-visual-evidence · isolation Coach A/B SYMÉTRIQUE avec enfants distincts", () => {
  const wrapper = readRepo("scripts/test-final-visual-evidence-p1.mjs");
  const orc = readRepo("scripts/orchestrate-final-visual-evidence-p1.ts");
  const pkg = JSON.parse(readRepo("package.json"));

  it("wrapper fail-closed + flags Coach P-1 injectés", () => {
    expect(wrapper).toMatch(/MISSING P1_TEST_PASSWORD/);
    expect(wrapper).toMatch(/MISSING SUPABASE_SERVICE_ROLE_KEY/);
    expect(wrapper).toMatch(/YEMA_COACH_WORKSPACE_ENABLED:\s*"true"/);
    expect(wrapper).toMatch(/YEMA_ROOTS_COACH_RLS_CONFIRMED:\s*"true"/);
  });

  it("npm scripts test:final-visual-evidence + capture branchés", () => {
    expect(pkg.scripts["test:final-visual-evidence:p1"]).toBe("node scripts/test-final-visual-evidence-p1.mjs");
    expect(pkg.scripts["capture:final-visual-evidence:p1"]).toBe("node scripts/capture-final-visual-evidence-p1.mjs");
  });

  it("orchestrateur crée 2 enfants Racines DISTINCTS (childAId + childBId)", () => {
    expect(orc).toMatch(/childAId = `test_yema_qa_gate8h_child_a_/);
    expect(orc).toMatch(/childBId = `test_yema_qa_gate8h_child_b_/);
    expect(orc).toMatch(/prenom:\s*"TempRacinesA"/);
    expect(orc).toMatch(/prenom:\s*"TempRacinesB"/);
    expect(orc).toMatch(/universe:\s*"RACINES"/);
  });

  it("chaque enfant assigné à son propre Circle via CircleMembership CHILD", () => {
    expect(orc).toMatch(/circleId: circleAId, childProfileId: childAId, role: "CHILD"/);
    expect(orc).toMatch(/circleId: circleBId, childProfileId: childBId, role: "CHILD"/);
  });

  it("isolation SYMÉTRIQUE testée · Coach A voit A pas B", () => {
    expect(orc).toMatch(/Coach A ne voit PAS TempRacinesA/);
    expect(orc).toMatch(/Coach A voit TempRacinesB.*isolation cassée/);
  });

  it("isolation SYMÉTRIQUE testée · Coach B voit B pas A", () => {
    expect(orc).toMatch(/Coach B ne voit PAS TempRacinesB/);
    expect(orc).toMatch(/Coach B voit TempRacinesA.*isolation cassée/);
    expect(orc).toMatch(/ISOLATION COACH A\/B SYMÉTRIQUE PROUVÉE ACTIVEMENT/);
  });

  it("cleanup finally · 5 niveaux (memberships + circles + children + households + users + auth)", () => {
    expect(orc).toMatch(/childProfile\.deleteMany/);
    expect(orc).toMatch(/circleMembership\.deleteMany/);
    expect(orc).toMatch(/circle\.deleteMany/);
    expect(orc).toMatch(/household\.deleteMany/);
    expect(orc).toMatch(/user\.delete/);
    expect(orc).toMatch(/admin\.auth\.admin\.deleteUser/);
  });

  it("relecture leak · 4 checks (users + children + circles + households)", () => {
    expect(orc).toMatch(/leakUsers/);
    expect(orc).toMatch(/leakChildren/);
    expect(orc).toMatch(/leakCircles/);
    expect(orc).toMatch(/leakHouseholds/);
  });
});

describe("Gate 8G · final-evidence · Coach API ACTIF via flags + isolation Circle A/B", () => {
  const wrapper = readRepo("scripts/test-final-evidence-p1.mjs");
  const orc = readRepo("scripts/orchestrate-final-evidence-p1.ts");
  const pkg = JSON.parse(readRepo("package.json"));

  it("wrapper injecte YEMA_COACH_WORKSPACE_ENABLED + YEMA_ROOTS_COACH_RLS_CONFIRMED", () => {
    expect(wrapper).toMatch(/YEMA_COACH_WORKSPACE_ENABLED:\s*"true"/);
    expect(wrapper).toMatch(/YEMA_ROOTS_COACH_RLS_CONFIRMED:\s*"true"/);
  });

  it("wrapper bypass run-p4-5-b2 allowlist strict · direct tsx (flags Coach requis)", () => {
    // Le wrapper contient un commentaire mentionnant run-p4-5-b2 pour
    // documenter le bypass · mais NE l'invoque PAS via spawn.
    expect(wrapper).toMatch(/spawn\("npx", \["tsx", "scripts\/orchestrate-final-evidence-p1\.ts"\]/);
    expect(wrapper).toMatch(/Bypass run-p4-5-b2-p1\.mjs allowlist/);
  });

  it("npm scripts test:final-evidence:p1 + capture branchés", () => {
    expect(pkg.scripts["test:final-evidence:p1"]).toBe("node scripts/test-final-evidence-p1.mjs");
    expect(pkg.scripts["capture:final-evidence:p1"]).toBe("node scripts/capture-final-evidence-p1.mjs");
  });

  it("orchestrator vérifie flags Coach obligatoires (fail-closed)", () => {
    expect(orc).toMatch(/YEMA_COACH_WORKSPACE_ENABLED != true/);
    expect(orc).toMatch(/YEMA_ROOTS_COACH_RLS_CONFIRMED != true/);
  });

  it("orchestrator provisionne 2 households TEMP + 2 Circles distincts (WOLOF + SWAHILI)", () => {
    expect(orc).toMatch(/householdAId = `test_yema_qa_gate8g_hh_a_/);
    expect(orc).toMatch(/householdBId = `test_yema_qa_gate8g_hh_b_/);
    expect(orc).toMatch(/language:\s*"WOLOF"/);
    expect(orc).toMatch(/language:\s*"SWAHILI"/);
  });

  it("orchestrator teste API /api/roots-coach/profiles 200 · Aicha visible Coach A", () => {
    expect(orc).toMatch(/\/api\/roots-coach\/profiles/);
    expect(orc).toMatch(/Coach A voit Aicha \(Circle A CHILD\)/);
  });

  it("orchestrator teste isolation · Coach B ne voit PAS Aicha (Circle A)", () => {
    expect(orc).toMatch(/Coach B NE voit PAS Aicha/);
    expect(orc).toMatch(/isolation Circle A\/B prouvée/);
  });

  it("orchestrator teste cross-household · Coach ne voit pas Family QA enfants", () => {
    expect(orc).toMatch(/isolation cross-household cassée/);
    expect(orc).toMatch(/aucun leak QA/);
  });

  it("orchestrator cleanup households + circles + memberships + users + Auth", () => {
    expect(orc).toMatch(/householdMembership\.deleteMany/);
    expect(orc).toMatch(/household\.deleteMany/);
    expect(orc).toMatch(/circleMembership\.deleteMany/);
    expect(orc).toMatch(/admin\.auth\.admin\.deleteUser/);
  });
});

describe("Gate 8G · lint fix · spawn unused imports removed from capture wrappers", () => {
  it("capture-deployment-readiness-p1.mjs · no spawn import", () => {
    const src = readRepo("scripts/capture-deployment-readiness-p1.mjs");
    expect(src).not.toMatch(/import \{ spawn \}/);
  });
  it("capture-final-deployment-e2e-p1.mjs · no spawn import", () => {
    const src = readRepo("scripts/capture-final-deployment-e2e-p1.mjs");
    expect(src).not.toMatch(/import \{ spawn \}/);
  });
  it("capture-final-production-signoff-p1.mjs · no spawn import", () => {
    const src = readRepo("scripts/capture-final-production-signoff-p1.mjs");
    expect(src).not.toMatch(/import \{ spawn \}/);
  });
});

describe("Gate 8F · browser-signoff · Playwright chromium réel dual context", () => {
  const wrapper = readRepo("scripts/test-browser-signoff-p1.mjs");
  const orc = readRepo("scripts/orchestrate-browser-signoff-p1.ts");
  const spec = readRepo("tests/e2e/browser-signoff/dual-context.spec.ts");
  const pkg = JSON.parse(readRepo("package.json"));

  it("wrapper fail-closed · exige P1_TEST_PASSWORD + SUPABASE_SERVICE_ROLE_KEY", () => {
    expect(wrapper).toMatch(/MISSING P1_TEST_PASSWORD/);
    expect(wrapper).toMatch(/MISSING SUPABASE_SERVICE_ROLE_KEY/);
    expect(wrapper).toMatch(/kzzagbojjkivdzzcrmxn/);
  });

  it("npm scripts test:browser-signoff:p1 + capture branchés", () => {
    expect(pkg.scripts["test:browser-signoff:p1"]).toBe("node scripts/test-browser-signoff-p1.mjs");
    expect(pkg.scripts["capture:browser-signoff:p1"]).toBe("node scripts/capture-browser-signoff-p1.mjs");
  });

  it("orchestrateur provisionne PASSAGE + LP adulte temp + cleanup finally", () => {
    expect(orc).toMatch(/PASSAGE \+ LearningPath adulte MONDE temp/);
    expect(orc).toMatch(/db\.accessGrant\.create/);
    expect(orc).toMatch(/db\.learningPath\.create/);
    expect(orc).toMatch(/cleanup\.push/);
  });

  it("orchestrateur lance Playwright chromium réel (pas fetch)", () => {
    expect(orc).toMatch(/playwright.*test.*--config.*playwright\.browser-signoff\.config\.ts/);
    expect(orc).toMatch(/YEMA_DASHBOARD_REDESIGN_ENABLED/);
  });

  it("spec Playwright utilise page.goto + waitForLoadState (chromium réel)", () => {
    expect(spec).toMatch(/page\.goto/);
    expect(spec).toMatch(/waitForLoadState/);
    expect(spec).not.toMatch(/^\s*fetch\(/m);
  });

  it("spec vérifie DOM · noms enfants présents Family et ABSENTS dashboard adulte", () => {
    expect(spec).toMatch(/Family shows children names/);
    expect(spec).toMatch(/Adult dashboard sans noms enfants/);
    expect(spec).toMatch(/not\.toMatch\(\/Lina\|Malik\|Aïcha\//);
  });

  it("spec produit MANIFEST avec h1Count + overflowCount + result", () => {
    expect(spec).toMatch(/h1Count\\toverflowCount\\tresult/);
    expect(spec).toMatch(/captureAndRecord/);
  });

  it("cleanup finally · leak check grants temp Gate 8F", () => {
    expect(orc).toMatch(/gate8f_/);
    expect(orc).toMatch(/leak/);
    expect(orc).toMatch(/aucun résidu/);
  });
});

describe("Gate 8E · final-production-signoff · dual context + Coach Circles isolation", () => {
  const wrapper = readRepo("scripts/test-final-production-signoff-p1.mjs");
  const orc = readRepo("scripts/orchestrate-final-production-signoff-p1.ts");
  const pkg = JSON.parse(readRepo("package.json"));

  it("wrapper fail-closed · exige P1_TEST_PASSWORD + SUPABASE_SERVICE_ROLE_KEY", () => {
    expect(wrapper).toMatch(/MISSING P1_TEST_PASSWORD/);
    expect(wrapper).toMatch(/MISSING SUPABASE_SERVICE_ROLE_KEY/);
    expect(wrapper).toMatch(/kzzagbojjkivdzzcrmxn/);
  });

  it("npm scripts test:final-production-signoff:p1 + capture branchés", () => {
    expect(pkg.scripts["test:final-production-signoff:p1"]).toBe("node scripts/test-final-production-signoff-p1.mjs");
    expect(pkg.scripts["capture:final-production-signoff:p1"]).toBe("node scripts/capture-final-production-signoff-p1.mjs");
  });

  it("dual context · PASSAGE grant temp + LearningPath adulte temp", () => {
    expect(orc).toMatch(/dual context · Family QA \+ PASSAGE \+ LearningPath temp/);
    expect(orc).toMatch(/db\.accessGrant\.create/);
    expect(orc).toMatch(/db\.learningPath\.create/);
    expect(orc).toMatch(/universe:\s*"MONDE"/);
  });

  it("navigation route-based (aucun SpaceSwitcher) · /fr/famille + /fr/dashboard", () => {
    expect(orc).toMatch(/aucun SpaceSwitcher/);
    expect(orc).toMatch(/\/fr\/famille/);
    expect(orc).toMatch(/\/fr\/dashboard/);
  });

  it("retrait PASSAGE · Family reste accessible (test enforce)", () => {
    expect(orc).toMatch(/retrait PASSAGE · comportement canonique/);
    expect(orc).toMatch(/Family reste accessible après retrait/);
  });

  it("Coach model canonical via CircleMembership role=COACH", () => {
    expect(orc).toMatch(/CircleMembership/);
    expect(orc).toMatch(/role:\s*"COACH"/);
    expect(orc).toMatch(/role:\s*"CHILD"/);
    expect(orc).toMatch(/status:\s*"ACTIVE"/);
  });

  it("Coach A/B provisionnés avec Circles distincts (WOLOF + SWAHILI)", () => {
    expect(orc).toMatch(/circleAId = `test_yema_qa_gate8e_circle_a_/);
    expect(orc).toMatch(/circleBId = `test_yema_qa_gate8e_circle_b_/);
    expect(orc).toMatch(/language:\s*"WOLOF"/);
    expect(orc).toMatch(/language:\s*"SWAHILI"/);
  });

  it("Aïcha (Racines existant) assignée comme CHILD au Circle A", () => {
    expect(orc).toMatch(/childProfileId:\s*"test_yema_qa_child_family_racines"/);
  });

  it("isolation active · Coach A refusé Teacher/Family + non-cross-Coach", () => {
    expect(orc).toMatch(/Coach A refusé sur Teacher/);
    expect(orc).toMatch(/Coach B voit Aïcha \(Circle A\) · isolation cassée/);
  });

  it("cleanup finally · Circles + CircleMembership + Auth admin deleteUser", () => {
    expect(orc).toMatch(/circleMembership\.deleteMany/);
    expect(orc).toMatch(/circle\.delete/);
    expect(orc).toMatch(/leakCircles/);
    expect(orc).toMatch(/admin\.auth\.admin\.deleteUser/);
  });

  it("YEMA_COACH_WORKSPACE_ENABLED activé dans env spawn (feature flag)", () => {
    expect(orc).toMatch(/YEMA_COACH_WORKSPACE_ENABLED:\s*"true"/);
  });
});

describe("Gate 8E · Coach model reality-check · CircleMembership canonique v1", () => {
  const schema = readRepo("prisma/schema.prisma");
  const dashSrc = readRepo("src/features/dashboards/coach-racines/CoachRacinesDashboard.tsx");

  it("CircleMembership.role enum inclut COACH", () => {
    expect(schema).toMatch(/enum CircleRole \{[\s\S]*?COACH[\s\S]*?\}/);
  });

  it("Circle model rattaché à Household + language + status ACTIVE", () => {
    // Schema Prisma · Circle model avec 3 champs canoniques.
    expect(schema).toMatch(/model Circle \{/);
    expect(schema).toMatch(/householdId\s+String/);
    expect(schema).toMatch(/language\s+LanguageCode/);
    expect(schema).toMatch(/status\s+CircleStatus/);
  });

  it("CoachRacinesDashboard existe et rend une liste de learners", () => {
    expect(dashSrc).toMatch(/learners/i);
  });
});

describe("Gate 8D · final-deployment-e2e · Coach A/B provisioning + isolation active", () => {
  const wrapper = readRepo("scripts/test-final-deployment-e2e-p1.mjs");
  const orc = readRepo("scripts/orchestrate-final-deployment-e2e-p1.ts");
  const pkg = JSON.parse(readRepo("package.json"));

  it("wrapper délègue les refus P-1 au chargeur strict", () => {
    expect(wrapper).toMatch(/scripts\/test-baseline\/run-p4-5-b2-p1\.mjs/);
    expect(wrapper).not.toMatch(/process\.env\.NEXT_PUBLIC_SUPABASE_URL/);
    const strictRunner = readRepo("scripts/test-baseline/run-p4-5-b2-p1.mjs");
    expect(strictRunner).toMatch(/P1_TEST_PASSWORD/);
    expect(strictRunner).toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
    expect(strictRunner).toMatch(/kzzagbojjkivdzzcrmxn/);
  });

  it("npm scripts test:final-deployment-e2e:p1 + capture:final-deployment-e2e:p1 branchés", () => {
    expect(pkg.scripts["test:final-deployment-e2e:p1"]).toBe("node scripts/test-final-deployment-e2e-p1.mjs");
    expect(pkg.scripts["capture:final-deployment-e2e:p1"]).toBe("node scripts/capture-final-deployment-e2e-p1.mjs");
  });

  it("orchestrateur provisionne Coach A + Coach B temporaires via Auth admin API", () => {
    expect(orc).toMatch(/ensureCoachAuthUser/);
    expect(orc).toMatch(/RACINES_COACH/);
    expect(orc).toMatch(/temp_gate8d_coach_a_/);
    expect(orc).toMatch(/temp_gate8d_coach_b_/);
  });

  it("orchestrateur teste isolation symétrique · Coach A ET Coach B refusés Teacher/Family", () => {
    expect(orc).toMatch(/for \(const \[label, h\] of \[\["Coach A", hA\], \["Coach B", hB\]\]/);
    expect(orc).toMatch(/accède Teacher · isolation cassée/);
    expect(orc).toMatch(/accède Family · isolation cassée/);
  });

  it("cleanup finally · UserAppRole + User + Auth admin deleteUser", () => {
    expect(orc).toMatch(/userAppRole\.deleteMany/);
    expect(orc).toMatch(/admin\.auth\.admin\.deleteUser/);
    expect(orc).toMatch(/leakUsers/);
  });

  it("SpaceSwitcher reality documenté · 1 SpaceRole = switcher invisible", () => {
    expect(orc).toMatch(/SpaceSwitcher UI reality/);
    expect(orc).toMatch(/1 role STUDENT · switcher non visible/);
  });
});

describe("Gate 8C · deployment-readiness · Coach isolation + Super Admin audio", () => {
  const wrapper = readRepo("scripts/test-deployment-readiness-p1.mjs");
  const orc = readRepo("scripts/orchestrate-deployment-readiness-p1.ts");
  const pkg = JSON.parse(readRepo("package.json"));

  it("wrapper fail-closed · exige P1_TEST_PASSWORD + SUPABASE_SERVICE_ROLE_KEY", () => {
    expect(wrapper).toMatch(/MISSING P1_TEST_PASSWORD/);
    expect(wrapper).toMatch(/MISSING SUPABASE_SERVICE_ROLE_KEY/);
    expect(wrapper).toMatch(/kzzagbojjkivdzzcrmxn/);
  });

  it("npm script test:deployment-readiness:p1 branché", () => {
    expect(pkg.scripts["test:deployment-readiness:p1"]).toBe("node scripts/test-deployment-readiness-p1.mjs");
  });

  it("npm script capture:deployment-readiness:p1 branché", () => {
    expect(pkg.scripts["capture:deployment-readiness:p1"]).toBe("node scripts/capture-deployment-readiness-p1.mjs");
  });

  it("orchestrateur teste Coach A isolation (Teacher + Family refusés)", () => {
    expect(orc).toMatch(/Coach A isolation active/);
    expect(orc).toMatch(/Coach access Teacher · isolation cassée/);
    expect(orc).toMatch(/Coach access Family · isolation cassée/);
  });

  it("orchestrateur teste Super Admin refus playback pédagogique", () => {
    expect(orc).toMatch(/Super Admin refus playback pédagogique/);
    expect(orc).toMatch(/api\/messaging\/audio\/\$\{existingAsset\.id\}\/playback/);
    expect(orc).toMatch(/aucune signed URL\/storageKey/);
  });

  it("orchestrateur vérifie exhaustivement forbidden fields dans la réponse Super Admin", () => {
    expect(orc).toMatch(/forbiddenFields = \["url", "storageKey", "storage_key", "bucket", "body", "transcript"\]/);
  });
});

describe("Gate 8C · playback route enforce Super Admin non-participant pédagogique", () => {
  const route = readRepo("src/app/api/messaging/audio/[audioAssetId]/playback/route.ts");

  it("participant check strict avant playback (return notFound si non participant)", () => {
    expect(route).toMatch(/if \(!participant\)/);
    expect(route).toMatch(/return notFound\(\)/);
  });

  it("Super Admin explicitement refusé sur conversations pédagogiques (defense-in-depth)", () => {
    expect(route).toMatch(/super_admin_pedagogical_forbidden/);
    expect(route).toMatch(/allowed:\s*readonly string\[\] = \["CENTER_PLATFORM_SUPPORT", "PLATFORM_BROADCAST"\]/);
  });

  it("audit log MESSAGE_AUDIO_ACCESS_DENIED avec reasonCode", () => {
    expect(route).toMatch(/MESSAGE_AUDIO_ACCESS_DENIED/);
    expect(route).toMatch(/reasonCode:\s*"not_participant"/);
    expect(route).toMatch(/reasonCode:\s*"super_admin_pedagogical_forbidden"/);
  });
});

describe("Gate 8B · sélecteur univers EXPLICITE dans AddChildDialog (brief §1)", () => {
  // Family Parity Patch · AddChildDialog restauré en composant client
  // extrait dans src/components/famille/AddChildDialog.tsx et réutilisé
  // depuis FamilyChildActions rendu par FamilyChildrenSection sur /family.
  // Les assertions inline UX historiques sont ré-appliquées sur le composant
  // extrait.
  const src = readRepo("src/components/famille/AddChildDialog.tsx");

  it("state universe: null par défaut · aucune valeur pré-sélectionnée", () => {
    expect(src).toMatch(/const \[universe, setUniverse\] = useState<"MONDE" \| "RACINES" \| null>\(null\)/);
  });

  it("radiogroup MONDE + RACINES · aria roles présents", () => {
    expect(src).toMatch(/role="radiogroup" aria-label=\{copy\.universeLbl\}/);
    expect(src).toMatch(/id: "MONDE" as const/);
    expect(src).toMatch(/id: "RACINES" as const/);
  });

  it("submit désactivé tant qu'universe n'est pas choisi", () => {
    expect(src).toMatch(/disabled=\{submitting \|\| !universe\}/);
  });

  it("erreur validate avant langue · errUniverse si universe null", () => {
    expect(src).toMatch(/if \(!universe\) return setErr\(copy\.errUniverse\)/);
  });

  it("learningGoal conditionnel universe === MONDE (rendu conditionnel)", () => {
    expect(src).toMatch(/\{universe === "MONDE" \? \(/);
  });

  it("learningGoal dérivé de universe === MONDE, jamais de foreign", () => {
    expect(src).toMatch(/const learningGoal = universe === "MONDE" && goal !== "LATER" \? goal : null/);
  });
});

describe("Gate 8B · ROOTS adulte 3e actif via tsx · script test-roots-adult-seats-p1.ts", () => {
  const src = readRepo("scripts/test-roots-adult-seats-p1.ts");

  it("utilise assignAdultRootsSeat + revokeAdultRootsSeat services canoniques", () => {
    expect(src).toMatch(/assignAdultRootsSeat/);
    expect(src).toMatch(/revokeAdultRootsSeat/);
    expect(src).toMatch(/MAX_ADULT_ROOTS_SEATS_PER_HOUSEHOLD/);
  });

  it("tente activement 3e siège · attend household_seats_exhausted", () => {
    expect(src).toMatch(/household_seats_exhausted/);
    expect(src).toMatch(/3e siège REFUSÉ/);
  });

  it("teste user externe (non membre) · attend user_is_not_household_member", () => {
    expect(src).toMatch(/user_is_not_household_member/);
    expect(src).toMatch(/user externe REFUSÉ/);
  });

  it("teste place libérée réutilisable · revoke + retry succès", () => {
    expect(src).toMatch(/siège réutilisable prouvé/);
  });

  it("cleanup finally · relecture leak users temp", () => {
    expect(src).toMatch(/runCleanup/);
    expect(src).toMatch(/leakUsers/);
    expect(src).toMatch(/temp_gate8b_/);
  });

  it("wrapper P-1 fail-closed · URL check + refs blocklistées", () => {
    expect(src).toMatch(/P1_REF = "kzzagbojjkivdzzcrmxn"/);
    expect(src).toMatch(/sbjhvlrkbyjckdxujjsk/);
  });
});

describe("Gate 8B · npm script test:roots-adult-seats:p1 branché", () => {
  const pkg = JSON.parse(readRepo("package.json"));
  it("script tsx exposé", () => {
    expect(pkg.scripts["test:roots-adult-seats:p1"]).toBe("tsx scripts/test-roots-adult-seats-p1.ts");
  });
});

describe("Gate 8A · CHILD_WORLD_SINGLE + ROOTS adulte 3 · tests actifs orchestrateur", () => {
  const src = readRepo("scripts/orchestrate-entitlements-p1.mjs");

  it("STEP 11 · CHILD_WORLD_SINGLE isolé sur family2 household · 2e Monde REFUSÉ limit=1", () => {
    expect(src).toMatch(/CHILD_WORLD_SINGLE isolé · household family2/);
    expect(src).toMatch(/CHILD_WORLD_SINGLE · 2e Monde REFUSÉ/);
    expect(src).toMatch(/CWS limit attendu 1/);
  });

  it("STEP 12 · ROOTS adulte 3e via service canonique assignAdultRootsSeat", () => {
    expect(src).toMatch(/ROOTS_FAMILY 3e adulte via assignAdultRootsSeat/);
    expect(src).toMatch(/assignAdultRootsSeat contient household_seats_exhausted/);
  });

  it("cleanup CHILD_WORLD_SINGLE grant temporaire dans finally", () => {
    expect(src).toMatch(/test_yema_qa_temp_cws_/);
    expect(src).toMatch(/cleanup\.push\(async \(\) => \{[^}]*delete[^}]*cwsGrantId/);
  });
});

describe("Gate 8A · assignAdultRootsSeat · service canonique adulte Racines", () => {
  const src = readRepo("src/lib/family/adultSeats.ts");

  it("MAX_ADULT_ROOTS_SEATS_PER_HOUSEHOLD === 2", () => {
    expect(src).toMatch(/MAX_ADULT_ROOTS_SEATS_PER_HOUSEHOLD = 2/);
  });

  it("erreurs métier exhaustives", () => {
    expect(src).toMatch(/household_has_no_family_subscription/);
    expect(src).toMatch(/user_is_not_household_member/);
    expect(src).toMatch(/user_already_has_seat/);
    expect(src).toMatch(/household_seats_exhausted/);
  });
});

describe("Gate 8L · final runtime assertions · logout UI réel + manifest dedupe + network scoping adulte", () => {
  const spec = readRepo("tests/e2e/final-browser-acceptance/gate8l-runtime.spec.ts");
  const wrapper = readRepo("scripts/test-final-runtime-assertions-p1.mjs");
  const capture = readRepo("scripts/capture-final-runtime-assertions-p1.mjs");
  const orch = readRepo("scripts/orchestrate-final-runtime-assertions-p1.ts");
  const pkg = JSON.parse(readRepo("package.json"));

  it("wrapper test:final-runtime-assertions:p1 · fail-closed P-1 + P1_TEST_PASSWORD + SERVICE_ROLE", () => {
    expect(wrapper).toMatch(/kzzagbojjkivdzzcrmxn/);
    expect(wrapper).toMatch(/P1_TEST_PASSWORD/);
    expect(wrapper).toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
    expect(wrapper).toMatch(/YEMA_COACH_WORKSPACE_ENABLED/);
    expect(wrapper).toMatch(/YEMA_ROOTS_COACH_RLS_CONFIRMED/);
  });

  it("wrapper capture:final-runtime-assertions:p1 · delegue au test wrapper", () => {
    expect(capture).toMatch(/kzzagbojjkivdzzcrmxn/);
    expect(capture).toMatch(/test-final-runtime-assertions-p1\.mjs/);
  });

  it("orchestrateur tsx · next start + npx playwright test config final-browser-acceptance", () => {
    expect(orch).toMatch(/next start/);
    expect(orch).toMatch(/"playwright", "test"/);
    expect(orch).toMatch(/gate8l-runtime\.spec\.ts/);
  });

  it("npm scripts branchés · test + capture", () => {
    expect(pkg.scripts["test:final-runtime-assertions:p1"]).toBe("node scripts/test-final-runtime-assertions-p1.mjs");
    expect(pkg.scripts["capture:final-runtime-assertions:p1"]).toBe("node scripts/capture-final-runtime-assertions-p1.mjs");
  });

  it("spec · logout UI réel via bouton exitChildMode (getByRole button + regex quitter/exit)", () => {
    expect(spec).toMatch(/getByRole\("button", \{ name: \/quitter\|exit\/i \}\)/);
    expect(spec).toMatch(/waitForResponse[\s\S]*\/api\/child-session[\s\S]*DELETE/);
  });

  it("spec · session enfant invalidée après logout · GET /api/child-session active=false", () => {
    expect(spec).toMatch(/\/api\/child-session/);
    expect(spec).toMatch(/sessionBody\?\.active[\s\S]*toBe\(false\)/);
  });

  it("spec · network scoping adulte · Family API NON appelée sur /dashboard", () => {
    expect(spec).toMatch(/familyCalls[\s\S]*\/api\/family\/dashboard/);
    expect(spec).toMatch(/Family API NOT called on \/dashboard route/);
  });

  it("spec · manifest dedupe par filename dans test.afterAll · dernière entrée gagne + sort", () => {
    expect(spec).toMatch(/test\.afterAll/);
    expect(spec).toMatch(/new Map<string, string>\(\)/);
    expect(spec).toMatch(/\.sort\(\(a, b\) => a\.split\("\\t"\)\[0\]\.localeCompare\(b\.split\("\\t"\)\[0\]\)\)/);
  });

  it("spec · reality-check documenté · Messages UI absent du produit enfant", () => {
    expect(spec).toMatch(/aucune messagerie/);
    expect(spec).toMatch(/REALITY-CHECK/);
  });

  it("Gate 8L+ · Coach A/B assertions DOM · count=1 + data-circle-language WOLOF/SWAHILI", () => {
    expect(spec).toMatch(/GATE8L_COACH_A_EMAIL[\s\S]*WOLOF/);
    expect(spec).toMatch(/GATE8L_COACH_B_EMAIL[\s\S]*SWAHILI/);
    expect(spec).toMatch(/data-testid=coach-learner-card/);
    expect(spec).toMatch(/data-circle-language/);
  });

  it("Gate 8L+ · Retour /famille · Coach API NOT called + Family API called ≥1×", () => {
    expect(spec).toMatch(/\/fr\/famille/);
    expect(spec).toMatch(/Coach API NOT called sur \/famille/);
    expect(spec).toMatch(/Family API appelée au moins 1×/);
  });

  it("Gate 8L++ · Child Messages CTA reel · cible dashboard → click → /messages", () => {
    expect(spec).toMatch(/CTA Messages/);
    expect(spec).toMatch(/waitForURL\(\/\\\/fr\\\/messages\//);
  });

  it("Gate 8L+ · Manifest verification post-write · entries/duplicates/missingPng/invalidRows", () => {
    expect(spec).toMatch(/MANIFEST_VERIFY\.txt/);
    expect(spec).toMatch(/entries === uniqueFilenames/);
    expect(spec).toMatch(/duplicates === 0/);
    expect(spec).toMatch(/missingPng === 0/);
    expect(spec).toMatch(/invalidRows === 0/);
  });

  it("Gate 8L++ · CTA Messages enfant · openMessages i18n FR/EN + testid canonique", () => {
    const fr = JSON.parse(readRepo("messages/fr.json"));
    const en = JSON.parse(readRepo("messages/en.json"));
    expect(fr.yemaDashboards.childMonde.openMessages).toBe("Messages");
    expect(fr.yemaDashboards.childRacines.openMessages).toBe("Messages");
    expect(en.yemaDashboards.childMonde.openMessages).toBe("Messages");
    expect(en.yemaDashboards.childRacines.openMessages).toBe("Messages");
    const childMonde = read("features/dashboards/child-monde/ChildMondeDashboard.tsx");
    const childRacines = read("features/dashboards/child-racines/ChildRacinesDashboard.tsx");
    expect(childMonde).toMatch(/data-testid="child-messages-cta"/);
    expect(childRacines).toMatch(/data-testid="child-messages-cta"/);
    expect(childMonde).toMatch(/openMessages/);
    expect(childRacines).toMatch(/openMessages/);
    expect(childMonde).toMatch(/messagesHref[\s\S]*\/messages/);
    expect(childRacines).toMatch(/messagesHref[\s\S]*\/messages/);
    // Cible tactile ≥ 44 hardcodé.
    expect(childMonde).toMatch(/minHeight: 44/);
    expect(childRacines).toMatch(/minHeight: 44/);
  });

  it("Gate 8L++ · spec · CTA click → /messages 200 + aucun textarea + aucun input libre", () => {
    expect(spec).toMatch(/data-testid=child-messages-cta/);
    expect(spec).toMatch(/CTA Messages [\s\S]*hauteur ≥ 44px/);
    expect(spec).toMatch(/focus clavier/);
    expect(spec).toMatch(/Aucun textarea sur \/messages child/);
    expect(spec).toMatch(/Aucun input texte libre/);
  });

  it("Gate 8L++ · GUIDED_PHRASE + AUDIO prouvés via API contract (guided-phrases + audio-capability)", () => {
    expect(spec).toMatch(/\/api\/messaging\/guided-phrases\?type=/);
    expect(spec).toMatch(/CHILD_WORLD_GUIDED/);
    expect(spec).toMatch(/CHILD_ROOTS_GUIDED/);
    expect(spec).toMatch(/audio-capability/);
    expect(spec).toMatch(/audioJson\?\.enabled/);
  });

  it("Gate 8L++ · spec · Racines sans palette Ivoire (data-universe !== monde)", () => {
    expect(spec).toMatch(/Universe Racines · pas Ivoire/);
  });

  it("Gate 8L++ · /famille isolé · /api/family/* called + /api/me/monde-dashboard non + /api/student/* non", () => {
    expect(spec).toMatch(/\/api\/family\/\* appelée/);
    expect(spec).toMatch(/\/api\/me\/monde-dashboard NON appelée/);
    expect(spec).toMatch(/\/api\/student\/\* NON appelée/);
  });

  it("Gate 8L+ · Orchestrator provisions Coach A/B temp + WOLOF/SWAHILI Circles + cleanup finally", () => {
    expect(orch).toMatch(/temp_gate8l_coach_a/);
    expect(orch).toMatch(/temp_gate8l_coach_b/);
    expect(orch).toMatch(/language: "WOLOF"/);
    expect(orch).toMatch(/language: "SWAHILI"/);
    expect(orch).toMatch(/GATE8L_COACH_A_EMAIL/);
    expect(orch).toMatch(/GATE8L_COACH_B_EMAIL/);
    expect(orch).toMatch(/leakUsers[\s\S]*temp_gate8l_/);
  });
});

describe("Release Canonicalization · /family + /center/stats + QA fail-closed + preflight", () => {
  const famillePage = readRepo("src/app/[locale]/famille/page.tsx");
  const familleEnfantPage = readRepo("src/app/[locale]/famille/enfant/[profilId]/page.tsx");
  const familyPage = readRepo("src/app/[locale]/family/page.tsx");
  const centerStatsPage = readRepo("src/app/[locale]/center/stats/page.tsx");
  const centerPage = readRepo("src/app/[locale]/center/page.tsx");
  const teacherPage = readRepo("src/app/[locale]/teacher/page.tsx");
  const dashboardPage = readRepo("src/app/[locale]/dashboard/page.tsx");
  const adminPage = readRepo("src/app/[locale]/admin/page.tsx");
  const coachRacinesPage = readRepo("src/app/[locale]/coach/racines/page.tsx");
  const qaPage = readRepo("src/app/[locale]/qa/page.tsx");
  const qaConfig = readRepo("src/lib/qa/config.ts");
  const preflight = readRepo("scripts/preflight-release-prod.mjs");
  const proxy = readRepo("src/proxy.ts");
  const pkg = JSON.parse(readRepo("package.json"));

  it("/family est l'unique route Family canonique · SSR + gate actor + FamilyDashboard", () => {
    expect(familyPage).toMatch(/from "@\/features\/dashboards\/family"/);
    expect(familyPage).toMatch(/resolveFamilyGuardianActorOrNull/);
    expect(familyPage).toMatch(/redirect\(`\/\$\{locale\}\/login`\)/);
    expect(familyPage).toMatch(/<FamilyDashboard locale=/);
  });

  it("/famille redirige serveur-side vers /family · FR + EN", () => {
    expect(famillePage).toMatch(/import \{ redirect \} from "next\/navigation"/);
    expect(famillePage).toMatch(/redirect\(`\/\$\{locale\}\/family`\)/);
    expect(famillePage).not.toMatch(/"use client"/);
    expect(famillePage).not.toMatch(/FamillePage|useState|ChildPinDialog/);
  });

  it("/famille/enfant/[profilId] redirige vers /family (profilId non transmis)", () => {
    expect(familleEnfantPage).toMatch(/import \{ redirect \} from "next\/navigation"/);
    expect(familleEnfantPage).toMatch(/redirect\(`\/\$\{locale\}\/family`\)/);
    // Le redirect ne doit PAS inclure profilId dans la nouvelle URL.
    expect(familleEnfantPage).not.toMatch(/redirect\([^)]*profilId/);
    expect(familleEnfantPage).not.toMatch(/"use client"/);
  });

  it("/center/stats n'importe plus le composant legacy · redirige vers /center", () => {
    expect(centerStatsPage).toMatch(/import \{ redirect \} from "next\/navigation"/);
    expect(centerStatsPage).toMatch(/redirect\(`\/\$\{locale\}\/center`\)/);
    // Aucun import du composant legacy dans le nouveau redirect stub.
    expect(centerStatsPage).not.toMatch(/import [\s\S]*CenterDashboardView/);
    expect(centerStatsPage).not.toMatch(/getCenterDashboard/);
  });

  it("CenterDashboardView reste importé uniquement comme fallback flag OFF (jamais inconditionnel)", () => {
    // /center dispatcher conserve le fallback legacy quand flag off.
    expect(centerPage).toMatch(/isYemaDashboardRedesignActive/);
    expect(centerPage).toMatch(/CenterDashboardView/);
    // /center/stats ne l'importe plus (le stub redirect ne contient aucun import).
    expect(centerStatsPage).not.toMatch(/import [\s\S]*CenterDashboardView/);
  });

  it("QA page fail-closed · notFound() si !status.active", () => {
    expect(qaPage).toMatch(/resolveQaConfig/);
    expect(qaPage).toMatch(/if \(!status\.active\) notFound\(\)/);
  });

  it("QA config exige VERCEL_ENV=preview (jamais production) + flag + P-1", () => {
    expect(qaConfig).toMatch(/vercelEnv === "preview"/);
    expect(qaConfig).toMatch(/QA_MODE_ENABLED/);
    expect(qaConfig).toMatch(/QA_ALLOWED_PROJECT_REF = "kzzagbojjkivdzzcrmxn"/);
    expect(qaConfig).toMatch(/not_preview/);
  });

  it("QA API routes fail-closed · toutes appellent resolveQaConfig() + return 404 stable", () => {
    for (const p of ["bootstrap", "child-session", "impersonate", "logout", "status"]) {
      const src = readRepo(`src/app/api/qa/${p}/route.ts`);
      expect(src, `qa/${p}`).toMatch(/resolveQaConfig/);
      expect(src, `qa/${p} · 404`).toMatch(/status:\s*404/);
    }
  });

  it("Preflight release Production · refuse non-prod + variables requises exhaustives", () => {
    expect(preflight).toMatch(/VERCEL_ENV.*production/);
    expect(preflight).toMatch(/YEMA_DASHBOARD_REDESIGN_ENABLED/);
    expect(preflight).toMatch(/YEMA_MESSAGING_ENABLED/);
    expect(preflight).toMatch(/YEMA_MESSAGE_AUDIO_ENABLED/);
    expect(preflight).toMatch(/YEMA_COACH_WORKSPACE_ENABLED/);
    expect(preflight).toMatch(/YEMA_ROOTS_COACH_RLS_CONFIRMED/);
    expect(preflight).toMatch(/YEMA_CHILD_SESSION_SECRET/);
    // Exit non-nul si variable manquante.
    expect(preflight).toMatch(/process\.exit\(failures\.length\)/);
    // Aucune valeur loguée (secrets).
    expect(preflight).not.toMatch(/process\.env\[[^\]]+\]\s*\)\s*[;,]?\s*[\/]?[\/]?[^\n]*(console\.log|console\.error)/);
  });

  it("Preflight npm script branché", () => {
    expect(pkg.scripts["preflight:release:prod"]).toBe("node scripts/preflight-release-prod.mjs");
  });

  it("Les 5 dispatchers rendent le redesign lorsque flag=true + gardent le fallback legacy quand false", () => {
    for (const [label, src] of [
      ["dashboard", dashboardPage],
      ["admin", adminPage],
      ["teacher", teacherPage],
      ["center", centerPage],
      ["coach/racines", coachRacinesPage],
    ] as const) {
      expect(src, `${label} · flag read`).toMatch(/isYemaDashboardRedesignActive/);
    }
    // Fallback legacy encore importé (compilable quand flag false).
    expect(dashboardPage).toMatch(/DashboardMonde|DashboardRacines/);
    expect(adminPage).toMatch(/LegacyAdminDashboard/);
    expect(teacherPage).toMatch(/TeacherDashboardView/);
    expect(centerPage).toMatch(/CenterDashboardView/);
    expect(coachRacinesPage).toMatch(/RootsCoachDashboardView/);
  });

  it("proxy.ts · /family + /famille scope STUDENT + ADMIN · spaceForPath supporte les deux", () => {
    expect(proxy).toMatch(/"\/family":\s*\["STUDENT",\s*"ADMIN"\]/);
    expect(proxy).toMatch(/"\/famille":\s*\["STUDENT",\s*"ADMIN"\]/);
    expect(proxy).toMatch(/pathname\.startsWith\("\/family"\)/);
    expect(proxy).toMatch(/pathname\.startsWith\("\/famille"\)/);
  });

  it("Personas matrix · family et enfants pointent vers leurs destinations canoniques", () => {
    const matrix = readRepo("src/lib/personas/matrix.ts");
    // family homeRoute = /fr/family
    expect(matrix).toMatch(/id:\s*"family"[\s\S]{0,300}homeRoute:\s*"\/fr\/family"/);
    // Les enfants arrivent sur le dashboard après ouverture de la session PIN.
    expect(matrix).toMatch(/id:\s*"child_monde"[\s\S]{0,300}homeRoute:\s*"\/fr\/dashboard"/);
    expect(matrix).toMatch(/id:\s*"child_racines"[\s\S]{0,300}homeRoute:\s*"\/fr\/dashboard"/);
    // Aucune référence résiduelle à /fr/famille dans les homeRoutes.
    expect(matrix).not.toMatch(/homeRoute:\s*"\/fr\/famille/);
  });
});

describe("Family Parity Patch · child actions restaurés sur /family (canonique)", () => {
  const familyDashboard = readRepo("src/features/dashboards/family/FamilyDashboard.tsx");
  const childrenSection = readRepo("src/features/dashboards/family/sections/FamilyChildrenSection.tsx");
  const actions = readRepo("src/features/dashboards/family/FamilyChildActions.tsx");
  const addDialog = readRepo("src/components/famille/AddChildDialog.tsx");
  const pinDialog = readRepo("src/components/famille/ChildPinDialog.tsx");
  const fr = JSON.parse(readRepo("messages/fr.json"));
  const en = JSON.parse(readRepo("messages/en.json"));
  const spec = readRepo("tests/e2e/final-browser-acceptance/gate8k-child-ui-flow.spec.ts");

  it("FamilyChildActions extrait · client component réutilisant ChildPinDialog + AddChildDialog", () => {
    expect(actions).toMatch(/"use client"/);
    expect(actions).toMatch(/import \{ ChildPinDialog \}/);
    expect(actions).toMatch(/import \{ AddChildDialog[^}]*\}/);
    expect(actions).toMatch(/data-testid="family-child-open-space"/);
    expect(actions).toMatch(/data-testid="family-add-child-open"/);
  });

  it("AddChildDialog extrait de l'ancien /famille · POST canonique /api/family/children + universe explicite", () => {
    expect(addDialog).toMatch(/"use client"/);
    expect(addDialog).toMatch(/fetch\("\/api\/family\/children"/);
    expect(addDialog).toMatch(/const \[universe, setUniverse\] = useState<"MONDE" \| "RACINES" \| null>\(null\)/);
    // Aucune valeur par défaut.
    expect(addDialog).toMatch(/disabled=\{submitting \|\| !universe\}/);
    // learningGoal uniquement MONDE (Lot 7B.2).
    expect(addDialog).toMatch(/const learningGoal = universe === "MONDE" && goal !== "LATER" \? goal : null/);
    // radiogroup MONDE + RACINES via template literal `add-child-universe-${u.id}`.
    expect(addDialog).toMatch(/data-testid=\{`add-child-universe-\$\{u\.id\}`\}/);
    expect(addDialog).toMatch(/id: "MONDE" as const/);
    expect(addDialog).toMatch(/id: "RACINES" as const/);
    // errUniverse validation.
    expect(addDialog).toMatch(/if \(!universe\) return setErr\(copy\.errUniverse\)/);
  });

  it("FamilyDashboard construit actionsCopy et le passe à FamilyChildrenSection", () => {
    expect(familyDashboard).toMatch(/const actionsCopy: FamilyChildActionsCopy = \{/);
    expect(familyDashboard).toMatch(/openChildSpace: tActions\("openChildSpace"\)/);
    expect(familyDashboard).toMatch(/childPinTitle: tActions\("childPinTitle"\)/);
    expect(familyDashboard).toMatch(/addDialog: \{[\s\S]{0,200}step: tAdd\("step"\)/);
    expect(familyDashboard).toMatch(/<FamilyChildrenSection[\s\S]{0,200}actionsCopy=\{actionsCopy\}/);
  });

  it("FamilyChildrenSection rend FamilyChildActions par carte enfant + footer add", () => {
    expect(childrenSection).toMatch(/import \{ FamilyChildActions/);
    expect(childrenSection).toMatch(/slot="child"/);
    expect(childrenSection).toMatch(/slot="add"/);
    expect(childrenSection).toMatch(/data-testid="family-child-card"/);
  });

  it("i18n · yemaDashboards.family.actions + addDialog · FR + EN identiques (parité clés)", () => {
    for (const [lang, doc] of [["fr", fr], ["en", en]] as const) {
      const a = doc.yemaDashboards?.family?.actions;
      const d = doc.yemaDashboards?.family?.addDialog;
      expect(a, `${lang} actions block`).toBeTruthy();
      expect(d, `${lang} addDialog block`).toBeTruthy();
      for (const k of ["openChildSpace", "addChild", "childPinTitle", "childPinLabel", "childPinSubmit", "childPinCancel", "childPinErrGeneric"]) {
        expect(a[k], `${lang} actions.${k}`).toBeTruthy();
      }
      for (const k of ["universeLbl", "universeMondeLabel", "universeRacinesLabel", "errUniverse", "create", "cancel"]) {
        expect(d[k], `${lang} addDialog.${k}`).toBeTruthy();
      }
    }
  });

  it("Playwright spec · UI PIN flow /family réel · Monde + Racines × FR + EN", () => {
    expect(spec).toMatch(/UI PIN \/family → dashboard prenom/);
    expect(spec).toMatch(/page\.goto\(`\/\$\{locale\}\/family`/);
    expect(spec).toMatch(/data-testid="family-child-open-space"/);
    expect(spec).toMatch(/data-testid="child-pin-dialog"/);
    expect(spec).toMatch(/data-testid="child-pin-input"/);
    expect(spec).toMatch(/data-testid="child-pin-submit"/);
    expect(spec).toMatch(/waitForResponse[\s\S]*\/api\/child-session[\s\S]*POST/);
    // Non-régression · aucun test Gate 8K ne remplace le clic UI par un
    // appel API direct (via l'ancien "PIN flow API canonique").
    expect(spec).not.toMatch(/UI PIN inline \(page \/famille legacy\) a été remplacé/);
  });

  it("Playwright spec · AddChildDialog radiogroup Monde/Racines depuis /family", () => {
    expect(spec).toMatch(/data-testid="family-add-child-open"/);
    expect(spec).toMatch(/data-testid="add-child-dialog"/);
    expect(spec).toMatch(/data-testid="add-child-universe-MONDE"/);
    expect(spec).toMatch(/data-testid="add-child-universe-RACINES"/);
    expect(spec).toMatch(/toBeDisabled/);
  });

  it("Non-régression · /famille + /famille/enfant redirects préservés", () => {
    const famillePage = readRepo("src/app/[locale]/famille/page.tsx");
    const familleEnfantPage = readRepo("src/app/[locale]/famille/enfant/[profilId]/page.tsx");
    expect(famillePage).toMatch(/redirect\(`\/\$\{locale\}\/family`\)/);
    expect(familleEnfantPage).toMatch(/redirect\(`\/\$\{locale\}\/family`\)/);
  });

  it("Non-régression · ChildPinDialog composant inchangé (data-testids + POST /api/child-session)", () => {
    expect(pinDialog).toMatch(/data-testid="child-pin-dialog"/);
    expect(pinDialog).toMatch(/data-testid="child-pin-input"/);
    expect(pinDialog).toMatch(/data-testid="child-pin-submit"/);
    expect(pinDialog).toMatch(/fetch\("\/api\/child-session"/);
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
