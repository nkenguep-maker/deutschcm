import { describe, expect, it } from "vitest";
import { runA1ValidationAudit } from "@/lib/course-content/a1Audit";

describe("German A1 complete validation flow", () => {
  it("completes all six units in sequence with the expected XP and no duplicate rewards", () => {
    const audit = runA1ValidationAudit();

    for (const item of audit.checks) {
      expect(item.ok, `${item.name}: ${JSON.stringify(item.details ?? {})}`).toBe(true);
    }

    expect(audit.ok).toBe(true);
    expect(audit.completedUnits).toBe(6);
    expect(audit.totalUnits).toBe(6);
    expect(audit.overallProgress).toBe(100);
    expect(audit.xpAwarded).toBe(audit.expectedXp);
    expect(audit.xpAwarded).toBe(840);
    expect(audit.nextModuleId).toBeNull();
  });
});
