import { describe, expect, it } from "vitest";
import {
  assertSupabaseResult,
  SupabaseOperationError,
} from "@/lib/supabase/assertResult";

describe("assertSupabaseResult", () => {
  it("accepts a successful Supabase result", () => {
    expect(() => assertSupabaseResult({ error: null }, "auth.updateUser")).not.toThrow();
  });

  it("turns returned Supabase errors into a thrown fail-closed error", () => {
    expect(() => assertSupabaseResult(
      { error: { code: "unexpected_failure" } },
      "auth.updateUser.onboardingComplete",
    )).toThrowError(SupabaseOperationError);

    try {
      assertSupabaseResult(
        { error: { code: "unexpected_failure" } },
        "auth.updateUser.onboardingComplete",
      );
    } catch (error) {
      expect(error).toMatchObject({
        code: "unexpected_failure",
        operation: "auth.updateUser.onboardingComplete",
      });
    }
  });

  it("uses a stable non-sensitive fallback code", () => {
    expect(() => assertSupabaseResult(
      { error: {} },
      "auth.admin.updateUserById",
    )).toThrowError("Supabase operation failed: auth.admin.updateUserById");
  });
});
