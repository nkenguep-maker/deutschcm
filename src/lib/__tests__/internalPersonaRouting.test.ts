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
  super_admin: {
    requiredSpaceRole: "ADMIN",
    appRole: "YEMA_ADMIN",
    universe: null,
    destinationPath: "/admin",
    authKind: "adult_session",
  },
  teacher: {
    requiredSpaceRole: "TEACHER",
    appRole: "TEACHER",
    universe: "MONDE",
    destinationPath: "/teacher",
    authKind: "adult_session",
  },
  coach: {
    requiredSpaceRole: "STUDENT",
    appRole: "RACINES_COACH",
    universe: "RACINES",
    destinationPath: "/coach/racines",
    authKind: "adult_session",
  },
  center_admin: {
    requiredSpaceRole: "CENTER",
    appRole: "CENTER_ADMIN",
    universe: null,
    destinationPath: "/center",
    authKind: "adult_session",
  },
  student_monde: {
    requiredSpaceRole: "STUDENT",
    appRole: "LEARNER",
    universe: "MONDE",
    destinationPath: "/dashboard",
    authKind: "adult_session",
  },
  student_racines: {
    requiredSpaceRole: "STUDENT",
    appRole: "LEARNER",
    universe: "RACINES",
    destinationPath: "/dashboard",
    authKind: "adult_session",
  },
  family: {
    requiredSpaceRole: "STUDENT",
    appRole: "PARENT",
    universe: null,
    destinationPath: "/family",
    authKind: "adult_session",
  },
  child_monde: {
    requiredSpaceRole: "STUDENT",
    appRole: null,
    universe: "MONDE",
    destinationPath: "/dashboard",
    authKind: "child_session",
  },
  child_racines: {
    requiredSpaceRole: "STUDENT",
    appRole: null,
    universe: "RACINES",
    destinationPath: "/dashboard",
    authKind: "child_session",
  },
} as const;

describe("Production internal personas · exact attribute matrix", () => {
  it("covers exactly the nine personas", () => {
    expect(INTERNAL_PERSONA_IDS).toEqual(Object.keys(EXPECTED));
  });

  for (const id of INTERNAL_PERSONA_IDS) {
    it(`${id} keeps its role, app role, universe, route and auth kind`, () => {
      expect(INTERNAL_PERSONA_ATTRIBUTES[id]).toEqual(EXPECTED[id]);
      expect(internalPersonaDestination(id, "fr")).toBe(`/fr${EXPECTED[id].destinationPath}`);
      expect(internalPersonaDestination(id, "en")).toBe(`/en${EXPECTED[id].destinationPath}`);
    });
  }

  it("accepts the persona cookie only for the owner account", () => {
    expect(resolveInternalPersona("center_admin", " NKENGUE.P@GMAIL.COM ")).toEqual({
      id: "center_admin",
      attributes: EXPECTED.center_admin,
    });
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

describe("Production internal personas · stale JWT regression", () => {
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

  it("the switch route refreshes the Supabase access token before redirect", () => {
    expect(switchRoute).toContain("supabase.auth.refreshSession()");
    expect(switchRoute).toContain("internalPersonaRequiredSpaceRole(rawPersona)");
  });
});
