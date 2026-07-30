import { beforeEach, describe, expect, it, vi } from "vitest";

// Tests unitaires du patch commercial Racines (siège adulte attribué).
// Mock Prisma en mémoire pour valider la logique métier sans DB.

interface Grant {
  id: string;
  beneficiaryType: "USER" | "HOUSEHOLD";
  beneficiaryId: string;
  productVariantId: string;
  sourceType: string;
  sourceId: string;
  status: "ACTIVE" | "REVOKED" | "EXPIRED";
  startsAt: Date;
  metadata: unknown;
}

interface Membership {
  id: string;
  userId: string;
  householdId: string;
  status: "ACTIVE" | "INACTIVE";
}

interface State {
  grants: Grant[];
  memberships: Membership[];
  variants: Array<{ id: string; product: { code: string } }>;
  nextId: number;
}

let state: State;

type WhereClause = Record<string, unknown>;
type SelectClause = Record<string, boolean> | undefined;

vi.mock("@/lib/prisma", () => {
  return {
    prisma: {
      accessGrant: {
        findFirst: vi.fn(
          async ({ where, select }: { where: WhereClause; select?: SelectClause }) => {
            const rows = state.grants.filter((g) => matchesGrantWhere(g, where));
            if (rows.length === 0) return null;
            return project(rows[0], select);
          },
        ),
        findMany: vi.fn(
          async ({ where, select }: { where: WhereClause; select?: SelectClause }) => {
            return state.grants
              .filter((g) => matchesGrantWhere(g, where))
              .map((g) => project(g, select));
          },
        ),
        count: vi.fn(async ({ where }: { where: WhereClause }) => {
          return state.grants.filter((g) => matchesGrantWhere(g, where)).length;
        }),
        create: vi.fn(
          async ({ data, select }: { data: Record<string, unknown>; select?: SelectClause }) => {
            const row: Grant = {
              id: `grant_${++state.nextId}`,
              beneficiaryType: data.beneficiaryType as Grant["beneficiaryType"],
              beneficiaryId: data.beneficiaryId as string,
              productVariantId: data.productVariantId as string,
              sourceType: data.sourceType as string,
              sourceId: data.sourceId as string,
              status: (data.status as Grant["status"]) ?? "ACTIVE",
              startsAt: (data.startsAt as Date) ?? new Date(),
              metadata: data.metadata ?? null,
            };
            state.grants.push(row);
            return project(row, select);
          },
        ),
        update: vi.fn(
          async ({ where, data }: { where: { id: string }; data: Partial<Grant> }) => {
            const row = state.grants.find((g) => g.id === where.id);
            if (!row) throw new Error("not found");
            Object.assign(row, data);
            return row;
          },
        ),
      },
      householdMembership: {
        findFirst: vi.fn(
          async ({ where, select }: { where: WhereClause; select?: SelectClause }) => {
            const row = state.memberships.find(
              (m) =>
                (!where.userId || m.userId === where.userId) &&
                (!where.householdId || m.householdId === where.householdId) &&
                (!where.status || m.status === where.status),
            );
            return row ? project(row, select) : null;
          },
        ),
      },
    },
  };
});

function matchesGrantWhere(g: Grant, where: WhereClause): boolean {
  if (where.beneficiaryType && g.beneficiaryType !== where.beneficiaryType) return false;
  if (where.beneficiaryId) {
    if (typeof where.beneficiaryId === "string" && g.beneficiaryId !== where.beneficiaryId) return false;
    const inClause = (where.beneficiaryId as { in?: string[] }).in;
    if (inClause && !inClause.includes(g.beneficiaryId)) return false;
  }
  if (where.sourceType && g.sourceType !== where.sourceType) return false;
  if (where.sourceId && g.sourceId !== where.sourceId) return false;
  if (where.status && g.status !== where.status) return false;
  const pvClause = where.productVariant as
    | { product?: { code?: string | { in?: string[] } } }
    | undefined;
  if (pvClause?.product?.code) {
    const codeExpectation = pvClause.product.code;
    const variant = state.variants.find((v) => v.id === g.productVariantId);
    if (!variant) return false;
    if (typeof codeExpectation === "string" && variant.product.code !== codeExpectation) return false;
    if (typeof codeExpectation === "object" && codeExpectation.in && !codeExpectation.in.includes(variant.product.code))
      return false;
  }
  return true;
}

function project(row: Grant | Membership, select: SelectClause): unknown {
  if (!select) return row;
  const asRecord = row as unknown as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(select)) if (select[k]) out[k] = asRecord[k];
  return out;
}

// Import dynamique après mock.
async function getModules() {
  const seats = await import("@/lib/family/adultSeats");
  const adult = await import("@/lib/entitlements/adult");
  return { seats, adult };
}

const HOUSEHOLD_A = "hh_A";
const HOUSEHOLD_B = "hh_B";
const VARIANT_FAMILY = "variant_roots_family";
const VARIANT_SOLO = "variant_roots_solo";

function seedRootsFamilyHouseholdA() {
  state.grants.push({
    id: "hh_family_grant_A",
    beneficiaryType: "HOUSEHOLD",
    beneficiaryId: HOUSEHOLD_A,
    productVariantId: VARIANT_FAMILY,
    sourceType: "SUBSCRIPTION",
    sourceId: "order_A",
    status: "ACTIVE",
    startsAt: new Date(),
    metadata: null,
  });
}

describe("Patch commercial Racines · sièges adultes attribués", () => {
  beforeEach(() => {
    state = {
      grants: [],
      memberships: [],
      variants: [
        { id: VARIANT_FAMILY, product: { code: "ROOTS_FAMILY" } },
        { id: VARIANT_SOLO, product: { code: "ROOTS_SOLO" } },
      ],
      nextId: 0,
    };
  });

  it("cas 1 · ROOTS_FAMILY présent + membre SANS attribution → false", async () => {
    const { adult } = await getModules();
    seedRootsFamilyHouseholdA();
    state.memberships.push({ id: "m1", userId: "user_1", householdId: HOUSEHOLD_A, status: "ACTIVE" });
    // Aucun grant USER — l'adulte n'a pas de siège attribué.
    expect(await adult.hasAdultRootsAccess("user_1")).toBe(false);
  });

  it("cas 2 · premier adulte attribué → true", async () => {
    const { seats, adult } = await getModules();
    seedRootsFamilyHouseholdA();
    state.memberships.push({ id: "m1", userId: "user_1", householdId: HOUSEHOLD_A, status: "ACTIVE" });
    const r = await seats.assignAdultRootsSeat(HOUSEHOLD_A, "user_1");
    expect(r.ok).toBe(true);
    expect(await adult.hasAdultRootsAccess("user_1")).toBe(true);
  });

  it("cas 3 · deuxième adulte attribué → true", async () => {
    const { seats, adult } = await getModules();
    seedRootsFamilyHouseholdA();
    state.memberships.push({ id: "m1", userId: "user_1", householdId: HOUSEHOLD_A, status: "ACTIVE" });
    state.memberships.push({ id: "m2", userId: "user_2", householdId: HOUSEHOLD_A, status: "ACTIVE" });
    await seats.assignAdultRootsSeat(HOUSEHOLD_A, "user_1");
    const r = await seats.assignAdultRootsSeat(HOUSEHOLD_A, "user_2");
    expect(r.ok).toBe(true);
    expect(await adult.hasAdultRootsAccess("user_2")).toBe(true);
  });

  it("cas 4 · troisième adulte refusé (household_seats_exhausted)", async () => {
    const { seats, adult } = await getModules();
    seedRootsFamilyHouseholdA();
    state.memberships.push({ id: "m1", userId: "user_1", householdId: HOUSEHOLD_A, status: "ACTIVE" });
    state.memberships.push({ id: "m2", userId: "user_2", householdId: HOUSEHOLD_A, status: "ACTIVE" });
    state.memberships.push({ id: "m3", userId: "user_3", householdId: HOUSEHOLD_A, status: "ACTIVE" });
    await seats.assignAdultRootsSeat(HOUSEHOLD_A, "user_1");
    await seats.assignAdultRootsSeat(HOUSEHOLD_A, "user_2");
    const r = await seats.assignAdultRootsSeat(HOUSEHOLD_A, "user_3");
    expect(r).toEqual(expect.objectContaining({ ok: false, error: "household_seats_exhausted" }));
    expect(await adult.hasAdultRootsAccess("user_3")).toBe(false);
  });

  it("cas 5 · siège révoqué puis ré-attribué → OK", async () => {
    const { seats, adult } = await getModules();
    seedRootsFamilyHouseholdA();
    state.memberships.push({ id: "m1", userId: "user_1", householdId: HOUSEHOLD_A, status: "ACTIVE" });
    state.memberships.push({ id: "m3", userId: "user_3", householdId: HOUSEHOLD_A, status: "ACTIVE" });
    // 2 sièges pris
    state.memberships.push({ id: "m2", userId: "user_2", householdId: HOUSEHOLD_A, status: "ACTIVE" });
    await seats.assignAdultRootsSeat(HOUSEHOLD_A, "user_1");
    await seats.assignAdultRootsSeat(HOUSEHOLD_A, "user_2");
    // Révoque user_2
    const rev = await seats.revokeAdultRootsSeat(HOUSEHOLD_A, "user_2");
    expect(rev.ok).toBe(true);
    expect(await adult.hasAdultRootsAccess("user_2")).toBe(false);
    // Ré-attribue à user_3
    const reAssign = await seats.assignAdultRootsSeat(HOUSEHOLD_A, "user_3");
    expect(reAssign.ok).toBe(true);
    expect(await adult.hasAdultRootsAccess("user_3")).toBe(true);
  });

  it("cas 6 · aucune attribution ne débloque Monde adulte", async () => {
    const { seats, adult } = await getModules();
    seedRootsFamilyHouseholdA();
    state.memberships.push({ id: "m1", userId: "user_1", householdId: HOUSEHOLD_A, status: "ACTIVE" });
    await seats.assignAdultRootsSeat(HOUSEHOLD_A, "user_1");
    expect(await adult.hasAdultWorldAccess("user_1")).toBe(false);
  });

  it("cas 7 · isolation Household A / B (grant côté A ne débloque pas B)", async () => {
    const { seats, adult } = await getModules();
    seedRootsFamilyHouseholdA();
    state.memberships.push({ id: "mA", userId: "user_A1", householdId: HOUSEHOLD_A, status: "ACTIVE" });
    state.memberships.push({ id: "mB", userId: "user_B1", householdId: HOUSEHOLD_B, status: "ACTIVE" });
    await seats.assignAdultRootsSeat(HOUSEHOLD_A, "user_A1");
    // Household B n'a pas de grant HOUSEHOLD ROOTS_FAMILY → attribution refusée.
    const r = await seats.assignAdultRootsSeat(HOUSEHOLD_B, "user_B1");
    expect(r).toEqual({ ok: false, error: "household_has_no_family_subscription" });
    expect(await adult.hasAdultRootsAccess("user_B1")).toBe(false);
    expect(await adult.hasAdultRootsAccess("user_A1")).toBe(true);
  });

  it("compte de sièges par Household reflète les attributions ACTIVE uniquement", async () => {
    const { seats } = await getModules();
    seedRootsFamilyHouseholdA();
    state.memberships.push({ id: "m1", userId: "user_1", householdId: HOUSEHOLD_A, status: "ACTIVE" });
    state.memberships.push({ id: "m2", userId: "user_2", householdId: HOUSEHOLD_A, status: "ACTIVE" });
    expect(await seats.countAssignedAdultRootsSeats(HOUSEHOLD_A)).toBe(0);
    await seats.assignAdultRootsSeat(HOUSEHOLD_A, "user_1");
    expect(await seats.countAssignedAdultRootsSeats(HOUSEHOLD_A)).toBe(1);
    await seats.assignAdultRootsSeat(HOUSEHOLD_A, "user_2");
    expect(await seats.countAssignedAdultRootsSeats(HOUSEHOLD_A)).toBe(2);
    await seats.revokeAdultRootsSeat(HOUSEHOLD_A, "user_1");
    expect(await seats.countAssignedAdultRootsSeats(HOUSEHOLD_A)).toBe(1);
  });

  it("ROOTS_SOLO USER reste un chemin valide (indépendant du siège Family)", async () => {
    const { adult } = await getModules();
    state.grants.push({
      id: "solo_grant_x",
      beneficiaryType: "USER",
      beneficiaryId: "user_solo",
      productVariantId: VARIANT_SOLO,
      sourceType: "ORDER",
      sourceId: "order_solo",
      status: "ACTIVE",
      startsAt: new Date(),
      metadata: null,
    });
    expect(await adult.hasAdultRootsAccess("user_solo")).toBe(true);
    expect(await adult.hasAdultWorldAccess("user_solo")).toBe(false);
  });
});
