import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  DAY_ONE_ACCESS_MODEL,
  isFreeDiscoveryCourseResource,
} from "@/lib/release/dayOneAccess";

describe("P0.16 · day-one access model", () => {
  it("makes the commercial rule explicit", () => {
    expect(DAY_ONE_ACCESS_MODEL).toBe("FREE_DISCOVERY_PAID_FULL_ACCESS");
  });

  it("opens only the first Monde discovery lesson for free", () => {
    expect(isFreeDiscoveryCourseResource("MONDE", "de-a1-u1-l1")).toBe(true);
    expect(isFreeDiscoveryCourseResource("MONDE", "de-a1-u1-l2")).toBe(false);
    expect(isFreeDiscoveryCourseResource("MONDE", undefined)).toBe(false);
  });

  it("opens only the first reviewed Racines discovery lesson ids for free", () => {
    expect(isFreeDiscoveryCourseResource("RACINES", "byv-e1-u1-l1")).toBe(true);
    expect(isFreeDiscoveryCourseResource("RACINES", "ln-e1-u1-l1")).toBe(true);
    expect(isFreeDiscoveryCourseResource("RACINES", "byv-e1-u1-l2")).toBe(false);
  });
});


describe("P0.16 · canonical entitlement scope", () => {
  const source = readFileSync(
    resolve(__dirname, "../entitlements/index.ts"),
    "utf8",
  );

  it("never treats generic COURSE_ACCESS as a free capability", () => {
    expect(source).toContain('const FREE_MONDE_CAPS: Capability[] = []');
    expect(source).toContain('const FREE_RACINES_CAPS: Capability[] = ["VEILLEE_CONTENT"]');
    expect(source).not.toContain('FREE_MONDE_CAPS: Capability[] = ["COURSE_ACCESS"]');
    expect(source).not.toContain('FREE_RACINES_CAPS: Capability[] = ["COURSE_ACCESS"');
  });

  it("requires resourceId allowlisting for free course access", () => {
    expect(source).toContain('capability === "COURSE_ACCESS"');
    expect(source).toContain('isFreeDiscoveryCourseResource("MONDE", resourceId)');
    expect(source).toContain('isFreeDiscoveryCourseResource("RACINES", resourceId)');
  });
});
