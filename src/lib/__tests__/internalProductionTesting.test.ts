import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

function contractBlock(source: string, id: string): string {
  const marker = `  ${id}: {`;
  const start = source.indexOf(marker);
  if (start < 0) return "";
  const next = source.indexOf("\n  },", start);
  return next < 0 ? source.slice(start) : source.slice(start, next + 5);
}

describe("Production internal testing · owner-only", () => {
  const gate = read("src/lib/internalTest.ts");
  const switchRoute = read("src/app/api/internal-test/switch-persona/route.ts");
  const consolePage = read("src/app/[locale]/internal-test/page.tsx");

  const expected = {
    super_admin: { spaceRole: "ADMIN", appRole: "YEMA_ADMIN", universe: "null", authKind: "session", destinationPath: "/admin" },
    teacher: { spaceRole: "TEACHER", appRole: "TEACHER", universe: "MONDE", authKind: "session", destinationPath: "/teacher" },
    coach: { spaceRole: "STUDENT", appRole: "RACINES_COACH", universe: "RACINES", authKind: "session", destinationPath: "/coach/racines" },
    center_admin: { spaceRole: "CENTER", appRole: "CENTER_ADMIN", universe: "null", authKind: "session", destinationPath: "/center" },
    student_monde: { spaceRole: "STUDENT", appRole: "LEARNER", universe: "MONDE", authKind: "session", destinationPath: "/dashboard" },
    student_racines: { spaceRole: "STUDENT", appRole: "LEARNER", universe: "RACINES", authKind: "session", destinationPath: "/dashboard" },
    family: { spaceRole: "STUDENT", appRole: "PARENT", universe: "null", authKind: "session", destinationPath: "/family" },
    child_monde: { spaceRole: "STUDENT", appRole: "null", universe: "MONDE", authKind: "child_session", destinationPath: "/dashboard" },
    child_racines: { spaceRole: "STUDENT", appRole: "null", universe: "RACINES", authKind: "child_session", destinationPath: "/dashboard" },
  } as const;

  it("déclare exactement les 9 personas produit", () => {
    for (const id of Object.keys(expected)) {
      expect(gate).toContain(`${id}: {`);
      expect(consolePage).toContain(`id: "${id}"`);
    }
  });

  it("fige les attributs exacts de chaque persona", () => {
    for (const [id, contract] of Object.entries(expected)) {
      const block = contractBlock(gate, id);
      expect(block, `${id} contract missing`).not.toBe("");
      expect(block).toContain(`spaceRole: "${contract.spaceRole}"`);
      expect(block).toContain(contract.appRole === "null" ? "appRole: null" : `appRole: "${contract.appRole}"`);
      expect(block).toContain(contract.universe === "null" ? "universe: null" : `universe: "${contract.universe}"`);
      expect(block).toContain(`authKind: "${contract.authKind}"`);
      expect(block).toContain(`destinationPath: "${contract.destinationPath}"`);
      expect(block).toContain("requiredAttributes:");
    }
  });

  it("reste réservé au compte propriétaire et fail-closed", () => {
    expect(gate).toContain('"nkengue.p@gmail.com"');
    expect(switchRoute).toMatch(/!user \|\| !isInternalTesterEmail\(user\.email\)/);
    expect(switchRoute).toContain('{ error: "Not found" }');
    expect(consolePage).toContain("notFound()");
  });

  it("réémet une session limitée au rôle du persona avant redirection", () => {
    expect(switchRoute).toContain("getInternalPersonaContract");
    expect(switchRoute).toContain("roles: [contract.spaceRole]");
    expect(switchRoute).toContain("onboarded_map: { [contract.spaceRole]: true }");
    expect(switchRoute).toContain("active_space: contract.spaceRole");
    expect(switchRoute).toContain("internal_test_persona: persona");
    expect(switchRoute).toContain("supabase.auth.refreshSession()");
    expect(switchRoute).not.toContain("syncUserMetadata");
  });

  it("restaure le rôle étudiant normal à la sortie du mode persona", () => {
    expect(switchRoute).toContain('roles: ["STUDENT"]');
    expect(switchRoute).toContain("onboarded_map: { STUDENT: true }");
    expect(switchRoute).toContain('active_space: "STUDENT"');
  });

  it("les enfants utilisent la session enfant signée existante", () => {
    expect(switchRoute).toContain("encodeChildSession");
    expect(switchRoute).toContain("CHILD_SESSION_COOKIE_NAME");
    expect(switchRoute).toContain('rawPersona === "child_monde" || rawPersona === "child_racines"');
  });
});

describe("Catalogue adulte complet", () => {
  const offers = read("src/app/[locale]/offers/page.tsx");
  const sidebar = read("src/features/dashboards/shared/DashboardSidebar.tsx");
  const mobile = read("src/features/dashboards/shared/DashboardMobileHeader.tsx");

  it("expose Monde et Racines indépendamment de la langue onboarding", () => {
    expect(offers).toContain("WORLD_LANGUAGES");
    expect(offers).toContain("ROOT_LANGUAGES");
    expect(offers).toContain('value="PASSAGE"');
    expect(offers).toContain('value="ROOTS_SOLO"');
    expect(offers).toContain('value="ROOTS_FAMILY"');
  });

  it("liste toutes les langues Racines portées par LanguageCode", () => {
    for (const language of ["WOLOF", "DOUALA", "LINGALA", "BAMBARA", "YORUBA", "SWAHILI"]) {
      expect(offers).toContain(`code: "${language}"`);
    }
  });

  it("ajoute le catalogue aux dashboards adultes desktop et mobile", () => {
    expect(sidebar).toContain("Toutes les offres");
    expect(mobile).toContain('"Offers" : "Offres"');
    expect(sidebar).toMatch(/enfant\|child/i);
    expect(mobile).toMatch(/enfant\|child/i);
    expect(sidebar).not.toContain("{previewBadge ?");
  });
});

describe("Paiement simulé Production", () => {
  const payment = read("src/app/api/internal-test/simulate-payment/route.ts");
  const provision = read("src/lib/internalTestProvisioning.ts");
  const dashboard = read("src/app/[locale]/dashboard/page.tsx");

  it("crée commande payée, paiement confirmé et grant actif", () => {
    expect(payment).toContain('status: "PAID"');
    expect(payment).toContain('status: "CONFIRMED"');
    expect(payment).toContain("accessGrant.create");
    expect(payment).toContain("simulatedPayment: true");
  });

  it("reste propriétaire-only et ne contacte aucun PSP", () => {
    expect(payment).toMatch(/!user \|\| !isInternalTesterEmail\(user\.email\)/);
    expect(payment).not.toMatch(/fetch\([^)]*(cinetpay|stripe|paypal)/i);
    expect(payment).toContain('provider: "CARD"');
  });

  it("provisionne les rôles, univers et fixtures sans doublons", () => {
    expect(provision).toContain("userRole.upsert");
    expect(provision).toContain("userAppRole.upsert");
    expect(provision).toContain('universe: "MONDE"');
    expect(provision).toContain('universe: "RACINES"');
    expect(provision).toContain("householdMembership.upsert");
  });

  it("le cookie persona sélectionne le bon parcours sans écraser le parcours réel", () => {
    expect(dashboard).toContain("INTERNAL_TEST_COOKIE_NAME");
    expect(dashboard).toContain("hasInternalTestMarker");
    expect(dashboard).toContain('persona === "student_monde"');
    expect(dashboard).toContain('persona === "student_racines"');
  });
});
