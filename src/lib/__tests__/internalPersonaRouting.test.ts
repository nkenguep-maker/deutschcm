import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  INTERNAL_PERSONA_ATTRIBUTES,
  INTERNAL_PERSONA_IDS,
  internalPersonaDestination,
  resolveInternalPersona,
  type InternalPersonaId,
} from "@/lib/internalPersona";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

const EXPECTED = {
  super_admin: { spaceRole: "ADMIN", appRole: "YEMA_ADMIN", universe: null, destinationPath: "/admin", authKind: "session" },
  teacher: { spaceRole: "TEACHER", appRole: "TEACHER", universe: "MONDE", destinationPath: "/teacher", authKind: "session" },
  coach: { spaceRole: "STUDENT", appRole: "RACINES_COACH", universe: "RACINES", destinationPath: "/coach/racines", authKind: "session" },
  center_admin: { spaceRole: "CENTER", appRole: "CENTER_ADMIN", universe: null, destinationPath: "/center", authKind: "session" },
  student_monde: { spaceRole: "STUDENT", appRole: "LEARNER", universe: "MONDE", destinationPath: "/dashboard", authKind: "session" },
  student_racines: { spaceRole: "STUDENT", appRole: "LEARNER", universe: "RACINES", destinationPath: "/dashboard", authKind: "session" },
  family: { spaceRole: "STUDENT", appRole: "PARENT", universe: null, destinationPath: "/family", authKind: "session" },
  child_monde: { spaceRole: "STUDENT", appRole: null, universe: "MONDE", destinationPath: "/dashboard", authKind: "child_session" },
  child_racines: { spaceRole: "STUDENT", appRole: null, universe: "RACINES", destinationPath: "/dashboard", authKind: "child_session" },
} as const;

describe("Production internal personas · exact attribute matrix", () => {
  it("covers exactly the nine personas", () => {
    expect(INTERNAL_PERSONA_IDS).toEqual(Object.keys(EXPECTED));
  });

  for (const id of INTERNAL_PERSONA_IDS) {
    it(`${id} keeps its role, app role, universe, route and auth kind`, () => {
      const attributes = INTERNAL_PERSONA_ATTRIBUTES[id];
      expect(attributes).toEqual(expect.objectContaining(EXPECTED[id]));
      expect(attributes.id).toBe(id);
      expect(attributes.requiredSpaceRole).toBe(EXPECTED[id].spaceRole);
      expect(attributes.requiredAttributes.length).toBeGreaterThan(0);
      expect(internalPersonaDestination(id, "fr")).toBe(`/fr${EXPECTED[id].destinationPath}`);
      expect(internalPersonaDestination(id, "en")).toBe(`/en${EXPECTED[id].destinationPath}`);
    });
  }

  it("accepts the persona cookie only for the owner account", () => {
    const resolved = resolveInternalPersona("center_admin", " NKENGUE.P@GMAIL.COM ");
    expect(resolved?.id).toBe("center_admin");
    expect(resolved?.attributes).toEqual(expect.objectContaining(EXPECTED.center_admin));
    expect(resolveInternalPersona("center_admin", "other@example.com")).toBeNull();
    expect(resolveInternalPersona("unknown", "nkengue.p@gmail.com")).toBeNull();
  });

  it("keeps children on the signed child-session flow", () => {
    for (const id of ["child_monde", "child_racines"] as InternalPersonaId[]) {
      expect(INTERNAL_PERSONA_ATTRIBUTES[id].authKind).toBe("child_session");
      expect(INTERNAL_PERSONA_ATTRIBUTES[id].destinationPath).toBe("/dashboard");
    }
  });
});

describe("Production internal personas · session and routing regression", () => {
  const proxy = read("src/proxy.ts");
  const switchRoute = read("src/app/api/internal-test/switch-persona/route.ts");

  it("the proxy overlays the selected owner persona before role redirects", () => {
    expect(proxy).toContain("resolveInternalPersona(");
    expect(proxy).toContain("internalPersona?.attributes.requiredSpaceRole");
    expect(proxy).toContain("roles = [...roles, personaSpace]");
    expect(proxy).toContain("const activeSpace = personaSpace ?? metadataActiveSpace");
  });

  it("the proxy does not send an active persona back through stale onboarding", () => {
    expect(proxy).toContain("onboardedMap[targetSpace] === false && personaSpace !== targetSpace");
  });

  it("the switch route emits a strict single-role session before redirect", () => {
    expect(switchRoute).toContain("getInternalPersonaContract");
    expect(switchRoute).toContain("roles: [contract.spaceRole]");
    expect(switchRoute).toContain("onboarded_map: { [contract.spaceRole]: true }");
    expect(switchRoute).toContain("internal_test_persona: params.persona");
    expect(switchRoute).toContain("internal_test_app_role: contract.appRole");
    expect(switchRoute).toContain("internal_test_universe: contract.universe");
    expect(switchRoute).toContain("supabase.auth.refreshSession()");
  });

  it("updates the authenticated owner instead of requiring a service-role key", () => {
    expect(switchRoute).toContain("params.supabase.auth.updateUser");
    expect(switchRoute).toContain("currentMetadata");
    expect(switchRoute).not.toContain("createAdminClient");
    expect(switchRoute).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(switchRoute).not.toContain("auth.admin.getUserById");
    expect(switchRoute).not.toContain("auth.admin.updateUserById");
  });

  it("reset restores the real DB role set instead of leaving a persona role", () => {
    expect(switchRoute).toContain("getUserRoles(params.userId)");
    expect(switchRoute).toContain("roles: restoredRoles");
  });
});
