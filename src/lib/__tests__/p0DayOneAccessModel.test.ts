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
