// P4.1 · Capacity guards · tests purs (mock tx).

import { describe, it, expect, vi } from "vitest";
import {
  assertCircleAdultCapacity,
  assertCircleChildCapacity,
  assertCircleCoachCapacity,
  assertUniqueActiveHouseholdLanguageCircle,
  CapacityError,
  MAX_ADULTS_PER_CIRCLE,
  MAX_CHILDREN_PER_CIRCLE,
} from "../circles/capacity";

function makeTx(overrides: Partial<{ count: number; findFirst: unknown }> = {}) {
  return {
    circleMembership: {
      count: vi.fn().mockResolvedValue(overrides.count ?? 0),
      findFirst: vi.fn().mockResolvedValue(overrides.findFirst ?? null),
    },
    circle: {
      findFirst: vi.fn().mockResolvedValue(overrides.findFirst ?? null),
    },
  } as never;
}

describe("assertCircleAdultCapacity · P4.1 Q1/Q2", () => {
  it("throws max_adults_reached at 2 active adults", async () => {
    const tx = makeTx({ count: MAX_ADULTS_PER_CIRCLE });
    await expect(assertCircleAdultCapacity(tx, "c1")).rejects.toBeInstanceOf(CapacityError);
    await expect(assertCircleAdultCapacity(tx, "c1")).rejects.toMatchObject({
      code: "max_adults_reached",
      detail: { limit: 2, current: 2 },
    });
  });
  it("accepts a new adult when < 2", async () => {
    const tx = makeTx({ count: 1 });
    await expect(assertCircleAdultCapacity(tx, "c1")).resolves.toBeUndefined();
  });
});

describe("assertCircleChildCapacity · P4.1 Q1/§5", () => {
  it("throws max_children_reached at 4 active children", async () => {
    const tx = makeTx({ count: MAX_CHILDREN_PER_CIRCLE });
    await expect(assertCircleChildCapacity(tx, "c1")).rejects.toMatchObject({
      code: "max_children_reached",
      detail: { limit: 4, current: 4 },
    });
  });
  it("accepts a new child when < 4", async () => {
    const tx = makeTx({ count: 3 });
    await expect(assertCircleChildCapacity(tx, "c1")).resolves.toBeUndefined();
  });
});

describe("assertCircleCoachCapacity · P4.1 Q15", () => {
  it("throws coach_already_assigned if a COACH ACTIVE exists", async () => {
    const tx = makeTx({ findFirst: { id: "existing-coach-m" } });
    await expect(assertCircleCoachCapacity(tx, "c1")).rejects.toMatchObject({
      code: "coach_already_assigned",
      detail: { existingMembershipId: "existing-coach-m" },
    });
  });
  it("accepts when no coach active", async () => {
    const tx = makeTx({ findFirst: null });
    await expect(assertCircleCoachCapacity(tx, "c1")).resolves.toBeUndefined();
  });
});

describe("assertUniqueActiveHouseholdLanguageCircle · P4.1 Q8/Q9", () => {
  it("throws circle_language_already_active when an ACTIVE circle exists", async () => {
    const tx = makeTx({ findFirst: { id: "existing-circle" } });
    await expect(
      assertUniqueActiveHouseholdLanguageCircle(tx, "h1", "KIKONGO"),
    ).rejects.toMatchObject({
      code: "circle_language_already_active",
      detail: { existingCircleId: "existing-circle" },
    });
  });
  it("accepts when none active", async () => {
    const tx = makeTx({ findFirst: null });
    await expect(
      assertUniqueActiveHouseholdLanguageCircle(tx, "h1", "KIKONGO"),
    ).resolves.toBeUndefined();
  });
});
