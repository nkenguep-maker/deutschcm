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

  it("AddChildDialog envoie universe explicite (Gate 8B · sélectionné par le parent, jamais dérivé)", () => {
    const client = readRepo("src/app/[locale]/famille/page.tsx");
    expect(client).toMatch(/useState<"MONDE" \| "RACINES" \| null>\(null\)/);
    expect(client).toMatch(/JSON\.stringify\(\{[^}]*universe[^}]*\}\)/);
  });
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

describe("Gate 8B · sélecteur univers EXPLICITE dans AddChildDialog (brief §1)", () => {
  const src = readRepo("src/app/[locale]/famille/page.tsx");

  it("state universe: null par défaut · aucune valeur pré-sélectionnée", () => {
    expect(src).toMatch(/const \[universe, setUniverse\] = useState<"MONDE" \| "RACINES" \| null>\(null\)/);
  });

  it("radiogroup avec MONDE + RACINES · aria roles présents", () => {
    expect(src).toMatch(/role="radiogroup"[^>]*aria-label=\{copy\.universeLbl\}/);
    expect(src).toMatch(/id: "MONDE"[\s\S]*?id: "RACINES"/);
  });

  it("submit désactivé tant qu'universe n'est pas choisi", () => {
    expect(src).toMatch(/disabled=\{submitting \|\| !universe\}/);
  });

  it("erreur validate avant langue · errUniverse si universe null", () => {
    expect(src).toMatch(/if \(!universe\) return setErr\(copy\.errUniverse\)/);
  });

  it("learningGoal conditionnel universe === MONDE (NON depuis foreign.length)", () => {
    expect(src).toMatch(/\{universe === "MONDE" \? \(/);
    expect(src).not.toMatch(/\{foreign\.length > 0 \? \(\s*<div className="famille-field" data-goal-field/);
  });

  it("learningGoal dérivé de universe === MONDE, jamais de foreign", () => {
    expect(src).toMatch(/const learningGoal = universe === "MONDE" && goal !== "LATER" \? goal : null/);
  });

  it("copy FR + EN contiennent universeLbl / MondeLabel / RacinesLabel / errUniverse", () => {
    for (const k of ["universeLbl", "universeMondeLabel", "universeMondeDesc", "universeRacinesLabel", "universeRacinesDesc", "errUniverse"]) {
      expect(src).toMatch(new RegExp(`${k}:`));
    }
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
