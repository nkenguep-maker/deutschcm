import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isYemaDashboardRedesignActive } from "@/lib/flags";

const KEY = "YEMA_DASHBOARD_REDESIGN_ENABLED";

describe("isYemaDashboardRedesignActive", () => {
  let original: string | undefined;

  beforeEach(() => {
    original = process.env[KEY];
    delete process.env[KEY];
  });

  afterEach(() => {
    if (original === undefined) delete process.env[KEY];
    else process.env[KEY] = original;
  });

  it("returns false when env var is absent (safe default)", () => {
    expect(isYemaDashboardRedesignActive()).toBe(false);
  });

  it("returns false when env var is any string other than true/1", () => {
    process.env[KEY] = "false";
    expect(isYemaDashboardRedesignActive()).toBe(false);
    process.env[KEY] = "TRUE";
    expect(isYemaDashboardRedesignActive()).toBe(false);
    process.env[KEY] = "0";
    expect(isYemaDashboardRedesignActive()).toBe(false);
    process.env[KEY] = "";
    expect(isYemaDashboardRedesignActive()).toBe(false);
  });

  it("returns true when env var is 'true'", () => {
    process.env[KEY] = "true";
    expect(isYemaDashboardRedesignActive()).toBe(true);
  });

  it("returns true when env var is '1'", () => {
    process.env[KEY] = "1";
    expect(isYemaDashboardRedesignActive()).toBe(true);
  });
});
