// P4.5-A · quotas Racines par ChildProfile · fenêtres UTC + format.

import { describe, it, expect, vi } from "vitest";
import {
  assertRootsAssignmentWeeklyCapacity,
  assertRootsAssignmentMonthlyCapacity,
  assertRootsSubmissionFormat,
  RootsProductionCapacityError,
  RootsProductionFormatError,
  isoWeekBoundsUtc,
  utcMonthBounds,
  countWords,
  MAX_ROOTS_PRODUCTIONS_PER_WEEK,
  MAX_ROOTS_PRODUCTIONS_PER_MONTH,
  MAX_ROOTS_WRITTEN_WORDS,
  MAX_ROOTS_AUDIO_SECONDS,
} from "../capacity/racinesProduction";

function makeTx(circles: { circleId: string }[], assignments: { id: string; targets: { childProfileId: string }[] }[]) {
  return {
    circleMembership: {
      findMany: vi.fn().mockResolvedValue(circles),
    },
    circleAssignment: {
      findMany: vi.fn().mockResolvedValue(assignments),
    },
  } as never;
}

describe("isoWeekBoundsUtc · lundi 00:00 UTC → lundi suivant 00:00 UTC", () => {
  it("wednesday 2026-07-22 → week [Mon 2026-07-20, Mon 2026-07-27)", () => {
    const at = new Date(Date.UTC(2026, 6, 22, 14, 0, 0));
    const { start, end } = isoWeekBoundsUtc(at);
    expect(start.toISOString()).toBe("2026-07-20T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-07-27T00:00:00.000Z");
  });
  it("sunday 2026-07-26 is still in the SAME iso week (ends Mon 27)", () => {
    const at = new Date(Date.UTC(2026, 6, 26, 23, 59, 59));
    const { start, end } = isoWeekBoundsUtc(at);
    expect(start.toISOString()).toBe("2026-07-20T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-07-27T00:00:00.000Z");
  });
  it("monday 2026-07-27 00:00 UTC starts a new week", () => {
    const at = new Date(Date.UTC(2026, 6, 27, 0, 0, 0));
    const { start } = isoWeekBoundsUtc(at);
    expect(start.toISOString()).toBe("2026-07-27T00:00:00.000Z");
  });
});

describe("utcMonthBounds · 1er du mois 00:00 UTC → 1er du mois suivant", () => {
  it("2026-07-15 → [2026-07-01, 2026-08-01)", () => {
    const at = new Date(Date.UTC(2026, 6, 15));
    const { start, end } = utcMonthBounds(at);
    expect(start.toISOString()).toBe("2026-07-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-08-01T00:00:00.000Z");
  });
  it("2026-12-31 → [2026-12-01, 2027-01-01)", () => {
    const at = new Date(Date.UTC(2026, 11, 31));
    const { start, end } = utcMonthBounds(at);
    expect(start.toISOString()).toBe("2026-12-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });
});

describe("assertRootsAssignmentWeeklyCapacity · 2 max par semaine par profil", () => {
  const at = new Date(Date.UTC(2026, 6, 22));

  it("accepts when child has 0 planned productions this week", async () => {
    const tx = makeTx([{ circleId: "c1" }], []);
    await expect(
      assertRootsAssignmentWeeklyCapacity(tx, { childProfileId: "child_A", at }),
    ).resolves.toBeUndefined();
  });

  it("accepts when child has 1 planned production this week", async () => {
    // Circle-wide assignment (targets empty) counts for CHILD ACTIVE members.
    const tx = makeTx(
      [{ circleId: "c1" }],
      [{ id: "a1", targets: [] }],
    );
    await expect(
      assertRootsAssignmentWeeklyCapacity(tx, { childProfileId: "child_A", at }),
    ).resolves.toBeUndefined();
  });

  it("refuses when child already has 2 planned productions this week", async () => {
    const tx = makeTx(
      [{ circleId: "c1" }],
      [
        { id: "a1", targets: [] },
        { id: "a2", targets: [{ childProfileId: "child_A" }] },
      ],
    );
    await expect(
      assertRootsAssignmentWeeklyCapacity(tx, { childProfileId: "child_A", at }),
    ).rejects.toMatchObject({
      code: "roots_weekly_production_limit_reached",
      detail: {
        dimension: "weekly",
        limit: MAX_ROOTS_PRODUCTIONS_PER_WEEK,
        attemptedCount: 3,
        childProfileId: "child_A",
      },
    });
  });

  it("does NOT count assignments targeting a different child in the same Circle", async () => {
    const tx = makeTx(
      [{ circleId: "c1" }],
      [
        { id: "a1", targets: [{ childProfileId: "child_B" }] },
        { id: "a2", targets: [{ childProfileId: "child_C" }] },
      ],
    );
    await expect(
      assertRootsAssignmentWeeklyCapacity(tx, { childProfileId: "child_A", at }),
    ).resolves.toBeUndefined();
  });
});

describe("assertRootsAssignmentMonthlyCapacity · 8 max par mois par profil", () => {
  const at = new Date(Date.UTC(2026, 6, 15));

  it("accepts when child has 7 planned productions this month", async () => {
    const assignments = Array.from({ length: 7 }, (_, i) => ({
      id: `a${i}`,
      targets: [],
    }));
    const tx = makeTx([{ circleId: "c1" }], assignments);
    await expect(
      assertRootsAssignmentMonthlyCapacity(tx, { childProfileId: "child_A", at }),
    ).resolves.toBeUndefined();
  });

  it("refuses when child already has 8 planned productions this month", async () => {
    const assignments = Array.from({ length: 8 }, (_, i) => ({
      id: `a${i}`,
      targets: [],
    }));
    const tx = makeTx([{ circleId: "c1" }], assignments);
    await expect(
      assertRootsAssignmentMonthlyCapacity(tx, { childProfileId: "child_A", at }),
    ).rejects.toMatchObject({
      code: "roots_monthly_production_limit_reached",
      detail: {
        dimension: "monthly",
        limit: MAX_ROOTS_PRODUCTIONS_PER_MONTH,
        attemptedCount: 9,
      },
    });
  });

  it("throws RootsProductionCapacityError instance", async () => {
    const assignments = Array.from({ length: 8 }, (_, i) => ({ id: `a${i}`, targets: [] }));
    const tx = makeTx([{ circleId: "c1" }], assignments);
    await expect(
      assertRootsAssignmentMonthlyCapacity(tx, { childProfileId: "child_A", at }),
    ).rejects.toBeInstanceOf(RootsProductionCapacityError);
  });
});

describe("countWords · convention split(/\\s+/) trimmed", () => {
  it.each([
    ["", 0],
    ["   ", 0],
    ["mot", 1],
    ["deux mots", 2],
    ["  espaces   multiples  entre  ", 3],
    ["ligne\navec\nsauts", 3],
  ])("count(%o) = %i", (text, expected) => {
    expect(countWords(text)).toBe(expected);
  });
});

describe("assertRootsSubmissionFormat · WRITTEN/AUDIO/MIXED + limites", () => {
  it("WRITTEN accepts ≤ 250 words", () => {
    const shortText = "un ".repeat(100).trim();
    expect(() => assertRootsSubmissionFormat({
      productionType: "WRITTEN", writtenContent: shortText,
    })).not.toThrow();
  });

  it("WRITTEN refuses 251+ words", () => {
    const longText = "mot ".repeat(MAX_ROOTS_WRITTEN_WORDS + 1).trim();
    expect(() => assertRootsSubmissionFormat({
      productionType: "WRITTEN", writtenContent: longText,
    })).toThrow(RootsProductionFormatError);
  });

  it("WRITTEN requires writtenContent", () => {
    try {
      assertRootsSubmissionFormat({ productionType: "WRITTEN", writtenContent: null });
      throw new Error("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(RootsProductionFormatError);
      expect((e as RootsProductionFormatError).code).toBe("invalid_production_format");
    }
  });

  it("WRITTEN refuses embedded audio duration", () => {
    try {
      assertRootsSubmissionFormat({
        productionType: "WRITTEN", writtenContent: "hello world", audioDurationSeconds: 30,
      });
      throw new Error("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(RootsProductionFormatError);
      expect((e as RootsProductionFormatError).code).toBe("invalid_production_format");
    }
  });

  it("AUDIO accepts ≤ 180 seconds", () => {
    expect(() => assertRootsSubmissionFormat({
      productionType: "AUDIO", audioDurationSeconds: MAX_ROOTS_AUDIO_SECONDS,
    })).not.toThrow();
  });

  it("AUDIO refuses 181 seconds", () => {
    expect(() => assertRootsSubmissionFormat({
      productionType: "AUDIO", audioDurationSeconds: MAX_ROOTS_AUDIO_SECONDS + 1,
    })).toThrow(RootsProductionFormatError);
    try {
      assertRootsSubmissionFormat({
        productionType: "AUDIO", audioDurationSeconds: 181,
      });
    } catch (e) {
      expect((e as RootsProductionFormatError).code).toBe("audio_production_too_long");
    }
  });

  it("AUDIO requires audioDurationSeconds", () => {
    try {
      assertRootsSubmissionFormat({ productionType: "AUDIO", audioDurationSeconds: null });
      throw new Error("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(RootsProductionFormatError);
      expect((e as RootsProductionFormatError).code).toBe("invalid_production_format");
    }
  });

  it("MIXED accepts written + audio both under limits", () => {
    expect(() => assertRootsSubmissionFormat({
      productionType: "MIXED", writtenContent: "hello", audioDurationSeconds: 30,
    })).not.toThrow();
  });

  it("MIXED requires at least one of written/audio", () => {
    try {
      assertRootsSubmissionFormat({
        productionType: "MIXED", writtenContent: null, audioDurationSeconds: null,
      });
      throw new Error("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(RootsProductionFormatError);
      expect((e as RootsProductionFormatError).code).toBe("invalid_production_format");
    }
  });

  it("MIXED still enforces individual limits", () => {
    const longText = "mot ".repeat(300).trim();
    try {
      assertRootsSubmissionFormat({
        productionType: "MIXED", writtenContent: longText, audioDurationSeconds: 30,
      });
      throw new Error("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(RootsProductionFormatError);
      expect((e as RootsProductionFormatError).code).toBe("written_production_too_long");
    }
  });
});
