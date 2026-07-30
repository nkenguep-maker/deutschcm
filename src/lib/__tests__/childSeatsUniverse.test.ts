import { beforeEach, describe, expect, it, vi } from "vitest";

// Lot 5.1 · sièges enfants par univers explicite (Monde/Racines).
// Mock Prisma en mémoire pour valider la logique métier sans DB.

interface Grant {
  id: string;
  beneficiaryType: "USER" | "HOUSEHOLD";
  beneficiaryId: string;
  productVariantId: string;
  status: "ACTIVE" | "REVOKED";
}
interface Child {
  id: string;
  parentUserId: string;
  universe: "MONDE" | "RACINES" | null;
}
interface State {
  grants: Grant[];
  children: Child[];
  variants: Array<{ id: string; product: { code: string } }>;
}

let state: State;

type WhereClause = Record<string, unknown>;
type SelectClause = Record<string, unknown> | undefined;

vi.mock("@/lib/prisma", () => {
  return {
    prisma: {
      accessGrant: {
        findMany: vi.fn(
          async ({ where }: { where: WhereClause; select?: SelectClause }) => {
            return state.grants
              .filter((g) => matchesGrant(g, where))
              .map((g) => ({
                productVariant: {
                  product: {
                    code: state.variants.find((v) => v.id === g.productVariantId)?.product.code ?? "",
                  },
                },
              }));
          },
        ),
      },
      childProfile: {
        findMany: vi.fn(
          async ({ where }: { where: WhereClause; select?: SelectClause }) => {
            return state.children
              .filter((c) => matchesChild(c, where))
              .map((c) => ({ id: c.id, universe: c.universe }));
          },
        ),
      },
    },
  };
});

function matchesGrant(g: Grant, w: WhereClause): boolean {
  if (w.beneficiaryType && g.beneficiaryType !== w.beneficiaryType) return false;
  const bid = w.beneficiaryId as string | { in?: string[] } | undefined;
  if (bid) {
    if (typeof bid === "string" && g.beneficiaryId !== bid) return false;
    if (typeof bid === "object" && bid.in && !bid.in.includes(g.beneficiaryId)) return false;
  }
  if (w.status && g.status !== w.status) return false;
  return true;
}
function matchesChild(c: Child, w: WhereClause): boolean {
  if (w.parentUserId && c.parentUserId !== w.parentUserId) return false;
  return true;
}

const HH_A = "hh_A";
const HH_B = "hh_B";
const V_FAMILY_WORLD = "v_family_world";
const V_SINGLE = "v_child_single";
const V_ROOTS_FAMILY = "v_roots_family";

function actor(parentUserId: string, ownedHhs: string[]) {
  return {
    userId: parentUserId,
    supabaseId: "sup_" + parentUserId,
    hasParentRole: true,
    hasChildProfiles: false,
    householdIdsOwned: ownedHhs,
    householdIdsMember: [],
  };
}

async function loadModule() {
  return await import("@/lib/family/childSeatsUniverse");
}

describe("childSeatsUniverse · sièges par univers (Lot 5.1)", () => {
  beforeEach(() => {
    state = {
      grants: [],
      children: [],
      variants: [
        { id: V_FAMILY_WORLD, product: { code: "FAMILY_WORLD" } },
        { id: V_SINGLE, product: { code: "CHILD_WORLD_SINGLE" } },
        { id: V_ROOTS_FAMILY, product: { code: "ROOTS_FAMILY" } },
      ],
    };
  });

  it("CHILD_WORLD_SINGLE → 1 siège Monde, 0 Racines", async () => {
    const m = await loadModule();
    state.grants.push({ id: "g1", beneficiaryType: "HOUSEHOLD", beneficiaryId: HH_A, productVariantId: V_SINGLE, status: "ACTIVE" });
    const seats = await m.getUniverseSeats(actor("u1", [HH_A]));
    expect(seats.monde.seatsMax).toBe(1);
    expect(seats.racines.seatsMax).toBe(0);
  });

  it("FAMILY_WORLD → 3 sièges Monde, 0 Racines", async () => {
    const m = await loadModule();
    state.grants.push({ id: "g2", beneficiaryType: "HOUSEHOLD", beneficiaryId: HH_A, productVariantId: V_FAMILY_WORLD, status: "ACTIVE" });
    const seats = await m.getUniverseSeats(actor("u1", [HH_A]));
    expect(seats.monde.seatsMax).toBe(3);
    expect(seats.racines.seatsMax).toBe(0);
  });

  it("ROOTS_FAMILY → 4 sièges Racines, 0 Monde (aucune fuite Monde)", async () => {
    const m = await loadModule();
    state.grants.push({ id: "g3", beneficiaryType: "HOUSEHOLD", beneficiaryId: HH_A, productVariantId: V_ROOTS_FAMILY, status: "ACTIVE" });
    const seats = await m.getUniverseSeats(actor("u1", [HH_A]));
    expect(seats.monde.seatsMax).toBe(0);
    expect(seats.racines.seatsMax).toBe(4);
  });

  it("SINGLE : deuxième enfant Monde refusé (universe_seats_exhausted)", async () => {
    const m = await loadModule();
    state.grants.push({ id: "g1", beneficiaryType: "HOUSEHOLD", beneficiaryId: HH_A, productVariantId: V_SINGLE, status: "ACTIVE" });
    state.children.push({ id: "c1", parentUserId: "u1", universe: "MONDE" });
    const check = await m.assertUniverseSeatAvailable(actor("u1", [HH_A]), "MONDE");
    expect(check).toEqual({ ok: false, error: "universe_seats_exhausted" });
  });

  it("FAMILY_WORLD : 3 enfants OK, 4ème refusé", async () => {
    const m = await loadModule();
    state.grants.push({ id: "g2", beneficiaryType: "HOUSEHOLD", beneficiaryId: HH_A, productVariantId: V_FAMILY_WORLD, status: "ACTIVE" });
    state.children.push({ id: "c1", parentUserId: "u1", universe: "MONDE" });
    state.children.push({ id: "c2", parentUserId: "u1", universe: "MONDE" });
    state.children.push({ id: "c3", parentUserId: "u1", universe: "MONDE" });
    const check = await m.assertUniverseSeatAvailable(actor("u1", [HH_A]), "MONDE");
    expect(check).toEqual({ ok: false, error: "universe_seats_exhausted" });
  });

  it("ROOTS_FAMILY : 4 enfants Racines OK, 5ème refusé", async () => {
    const m = await loadModule();
    state.grants.push({ id: "g3", beneficiaryType: "HOUSEHOLD", beneficiaryId: HH_A, productVariantId: V_ROOTS_FAMILY, status: "ACTIVE" });
    for (let i = 0; i < 4; i++) state.children.push({ id: `c${i}`, parentUserId: "u1", universe: "RACINES" });
    const check = await m.assertUniverseSeatAvailable(actor("u1", [HH_A]), "RACINES");
    expect(check).toEqual({ ok: false, error: "universe_seats_exhausted" });
  });

  it("ROOTS_FAMILY ne débloque JAMAIS un siège Monde (assertUniverseSeatAvailable Monde → no_universe_subscription)", async () => {
    const m = await loadModule();
    state.grants.push({ id: "g3", beneficiaryType: "HOUSEHOLD", beneficiaryId: HH_A, productVariantId: V_ROOTS_FAMILY, status: "ACTIVE" });
    const check = await m.assertUniverseSeatAvailable(actor("u1", [HH_A]), "MONDE");
    expect(check).toEqual({ ok: false, error: "no_universe_subscription" });
  });

  it("FAMILY_WORLD ne débloque JAMAIS un siège Racines (assertUniverseSeatAvailable Racines → no_universe_subscription)", async () => {
    const m = await loadModule();
    state.grants.push({ id: "g2", beneficiaryType: "HOUSEHOLD", beneficiaryId: HH_A, productVariantId: V_FAMILY_WORLD, status: "ACTIVE" });
    const check = await m.assertUniverseSeatAvailable(actor("u1", [HH_A]), "RACINES");
    expect(check).toEqual({ ok: false, error: "no_universe_subscription" });
  });

  it("Combo FAMILY_WORLD + ROOTS_FAMILY = 3 Monde + 4 Racines simultanément", async () => {
    const m = await loadModule();
    state.grants.push(
      { id: "g2", beneficiaryType: "HOUSEHOLD", beneficiaryId: HH_A, productVariantId: V_FAMILY_WORLD, status: "ACTIVE" },
      { id: "g3", beneficiaryType: "HOUSEHOLD", beneficiaryId: HH_A, productVariantId: V_ROOTS_FAMILY, status: "ACTIVE" },
    );
    const seats = await m.getUniverseSeats(actor("u1", [HH_A]));
    expect(seats.monde.seatsMax).toBe(3);
    expect(seats.racines.seatsMax).toBe(4);
  });

  it("isolation Household A/B : grant côté A n'ouvre pas de sièges à B", async () => {
    const m = await loadModule();
    state.grants.push({ id: "g2", beneficiaryType: "HOUSEHOLD", beneficiaryId: HH_A, productVariantId: V_FAMILY_WORLD, status: "ACTIVE" });
    const seatsB = await m.getUniverseSeats(actor("uB", [HH_B]));
    expect(seatsB.monde.seatsMax).toBe(0);
    expect(seatsB.racines.seatsMax).toBe(0);
  });

  it("enfants sans universe explicite n'occupent aucun siège (fail-closed backfill)", async () => {
    const m = await loadModule();
    state.grants.push({ id: "g2", beneficiaryType: "HOUSEHOLD", beneficiaryId: HH_A, productVariantId: V_FAMILY_WORLD, status: "ACTIVE" });
    state.children.push({ id: "c1", parentUserId: "u1", universe: null });
    const seats = await m.getUniverseSeats(actor("u1", [HH_A]));
    expect(seats.monde.seatsMax).toBe(3);
    expect(seats.monde.seatsUsed).toBe(0);
  });

  it("seatCapacityForProduct expose le barème", async () => {
    const m = await loadModule();
    expect(m.seatCapacityForProduct("CHILD_WORLD_SINGLE")).toEqual({ monde: 1, racines: 0 });
    expect(m.seatCapacityForProduct("FAMILY_WORLD")).toEqual({ monde: 3, racines: 0 });
    expect(m.seatCapacityForProduct("ROOTS_FAMILY")).toEqual({ monde: 0, racines: 4 });
    expect(m.seatCapacityForProduct("UNKNOWN")).toEqual({ monde: 0, racines: 0 });
  });
});
