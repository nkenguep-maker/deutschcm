import { afterEach, describe, expect, it, vi } from "vitest";
import { isInternalTestEnvironment } from "@/lib/internalTestEnvironment";
import { isInternalPersonaRuntimeAllowed } from "@/lib/internalPersona";

const P1 = "https://kzzagbojjkivdzzcrmxn.supabase.co";

function expectParity(expected: boolean) {
  expect(isInternalTestEnvironment()).toBe(expected);
  expect(isInternalPersonaRuntimeAllowed()).toBe(expected);
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("internal persona gate parity", () => {
  it("allows exact P-1 in confirmed local and Preview runtimes", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", P1);
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("P1_BASELINE_CONFIRMED_NOT_PRODUCTION", "true");
    expectParity(true);

    vi.stubEnv("VERCEL_ENV", "preview");
    expectParity(true);
  });

  it("refuses unconfirmed local P-1 in both gates", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", P1);
    vi.stubEnv("VERCEL_ENV", "");
    expectParity(false);
  });

  it("refuses Production regardless of the Supabase URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", P1);
    vi.stubEnv("VERCEL_ENV", "production");
    expectParity(false);
  });

  it("refuses non-P1 and lookalike hosts", () => {
    vi.stubEnv("VERCEL_ENV", "preview");

    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://sbjhvlrkbyjckdxujjsk.supabase.co");
    expectParity(false);

    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://kzzagbojjkivdzzcrmxn.supabase.co.evil.example");
    expectParity(false);
  });
});
