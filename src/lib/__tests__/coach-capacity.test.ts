// P4.2 · Coach capacity (Q15 · 20 profils, 10 Circles).

import { describe, it, expect, vi } from "vitest";
import {
  assertCoachCapacityAvailable,
  CapacityError,
  MAX_ACTIVE_CIRCLES_PER_COACH,
  MAX_ACTIVE_CHILDREN_PER_COACH,
} from "../circles/capacity";

function makeTx(circles: { circleId: string }[], childrenCount: number) {
  return {
    circleMembership: {
      findMany: vi.fn().mockResolvedValue(circles),
      count: vi.fn().mockResolvedValue(childrenCount),
    },
  } as never;
}

describe("assertCoachCapacityAvailable · Q15", () => {
  it("refuse au-delà de 10 Circles actifs", async () => {
    const circles = Array.from({ length: MAX_ACTIVE_CIRCLES_PER_COACH }, (_, i) => ({
      circleId: `c${i}`,
    }));
    const tx = makeTx(circles, 0);
    await expect(assertCoachCapacityAvailable(tx, "coach1", "cnew")).rejects.toMatchObject({
      code: "coach_capacity_reached",
      detail: { dimension: "circles", limit: 10 },
    });
  });
  it("accepte si < 10 Circles et < 20 enfants totaux", async () => {
    const tx = makeTx([{ circleId: "c1" }], 5);
    await expect(assertCoachCapacityAvailable(tx, "coach1", "cnew")).resolves.toBeUndefined();
  });
  it("refuse au-delà de 20 enfants totaux", async () => {
    const tx = makeTx([{ circleId: "c1" }, { circleId: "c2" }], MAX_ACTIVE_CHILDREN_PER_COACH + 1);
    await expect(assertCoachCapacityAvailable(tx, "coach1", "cnew")).rejects.toMatchObject({
      code: "coach_capacity_reached",
      detail: { dimension: "children", limit: 20 },
    });
  });
  it("throws CapacityError instance", async () => {
    const tx = makeTx(Array.from({ length: 11 }, (_, i) => ({ circleId: `c${i}` })), 0);
    await expect(assertCoachCapacityAvailable(tx, "coach1", "cnew")).rejects.toBeInstanceOf(CapacityError);
  });
});
