import { describe, expect, it } from "vitest";
import { computeMondeAccess } from "@/lib/monde";

describe("technical beta course access", () => {
  it("keeps strict grant behavior by default", () => {
    expect(computeMondeAccess([]).status).toBe("NONE");
  });

  it("opens A1 in memory without creating a grant", () => {
    const access = computeMondeAccess([], { technicalBetaA1: true });
    expect(access).toEqual({
      status: "ACTIVE",
      startsAt: null,
      endsAt: null,
      daysRemaining: null,
      level: "A1",
      source: "TECHNICAL_BETA",
    });
  });

  it("keeps a real active grant authoritative", () => {
    const access = computeMondeAccess([
      {
        startsAt: new Date("2026-01-01T00:00:00.000Z"),
        endsAt: null,
        status: "ACTIVE",
        metadata: { level: "A1" },
      },
    ], { technicalBetaA1: true });

    expect(access.status).toBe("ACTIVE");
    expect(access.source).toBe("GRANT");
  });
});
