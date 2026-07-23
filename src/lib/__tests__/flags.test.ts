// P4.1 · Feature flags · doivent être false par défaut.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getFlag, assertFlagEnabled, listAllFlags } from "../flags";

const SNAPSHOT_KEYS = [
  "YEMA_CIRCLE_ENABLED",
  "YEMA_CENTER_REAL_DATA_ENABLED",
  "YEMA_TEACHER_WORKSPACE_ENABLED",
  "YEMA_COACH_WORKSPACE_ENABLED",
  "YEMA_ASSIGNMENTS_ENABLED",
  "YEMA_AUDIO_FEEDBACK_ENABLED",
  "YEMA_CLOSED_MESSAGING_ENABLED",
  "YEMA_NOTIFICATIONS_ENABLED",
  "YEMA_RACINES_COACH_OPERATIONAL",
] as const;

describe("Feature flags · P4.1", () => {
  let saved: Record<string, string | undefined>;
  beforeEach(() => {
    saved = Object.fromEntries(SNAPSHOT_KEYS.map((k) => [k, process.env[k]]));
    for (const k of SNAPSHOT_KEYS) delete process.env[k];
  });
  afterEach(() => {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  it("all flags default to false when env var absent", () => {
    const all = listAllFlags();
    for (const [name, value] of Object.entries(all)) {
      expect(value, `flag ${name} must default to false`).toBe(false);
    }
  });

  it("empty string is treated as false", () => {
    process.env.YEMA_CIRCLE_ENABLED = "";
    expect(getFlag("CIRCLE_ENABLED")).toBe(false);
  });

  it("other truthy strings are NOT enabled (strict)", () => {
    for (const v of ["yes", "on", "TRUE", "True"]) {
      process.env.YEMA_CIRCLE_ENABLED = v;
      expect(getFlag("CIRCLE_ENABLED"), `value ${v} must not enable`).toBe(false);
    }
  });

  it("only 'true' or '1' enables the flag", () => {
    process.env.YEMA_CIRCLE_ENABLED = "true";
    expect(getFlag("CIRCLE_ENABLED")).toBe(true);
    process.env.YEMA_CIRCLE_ENABLED = "1";
    expect(getFlag("CIRCLE_ENABLED")).toBe(true);
  });

  it("assertFlagEnabled throws with code FEATURE_FLAG_DISABLED when off", () => {
    let thrown: unknown;
    try {
      assertFlagEnabled("CIRCLE_ENABLED");
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(Error);
    expect((thrown as { code?: string }).code).toBe("FEATURE_FLAG_DISABLED");
    expect((thrown as Error).message).toContain("CIRCLE_ENABLED");
  });

  it("flags never leak via NEXT_PUBLIC prefix", () => {
    // Aucun flag ne doit être exposé côté client.
    for (const k of SNAPSHOT_KEYS) {
      expect(k.startsWith("NEXT_PUBLIC_")).toBe(false);
    }
  });
});
