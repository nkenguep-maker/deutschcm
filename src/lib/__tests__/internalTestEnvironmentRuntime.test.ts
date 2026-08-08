import { afterEach, describe, expect, it, vi } from "vitest";
import { isInternalTestEnvironment } from "@/lib/internalTestEnvironment";

const P1 = "https://kzzagbojjkivdzzcrmxn.supabase.co";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("internal persona runtime gate", () => {
  it("allows the exact P-1 URL in a local runner without extra shell flags", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", P1);
    vi.stubEnv("VERCEL_ENV", "");
    expect(isInternalTestEnvironment()).toBe(true);
  });

  it("allows the exact P-1 URL on Vercel Preview", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", P1);
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(isInternalTestEnvironment()).toBe(true);
  });

  it("always refuses Vercel Production even if the URL points to P-1", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", P1);
    vi.stubEnv("VERCEL_ENV", "production");
    expect(isInternalTestEnvironment()).toBe(false);
  });

  it("refuses Production, legacy and lookalike Supabase hosts", () => {
    vi.stubEnv("VERCEL_ENV", "preview");

    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://sbjhvlrkbyjckdxujjsk.supabase.co");
    expect(isInternalTestEnvironment()).toBe(false);

    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://qggwvonfumuimjfsgpdz.supabase.co");
    expect(isInternalTestEnvironment()).toBe(false);

    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://kzzagbojjkivdzzcrmxn.supabase.co.evil.example");
    expect(isInternalTestEnvironment()).toBe(false);
  });

  it("refuses malformed and non-HTTPS P-1 URLs", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "not-a-url");
    expect(isInternalTestEnvironment()).toBe(false);

    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://kzzagbojjkivdzzcrmxn.supabase.co");
    expect(isInternalTestEnvironment()).toBe(false);
  });
});
