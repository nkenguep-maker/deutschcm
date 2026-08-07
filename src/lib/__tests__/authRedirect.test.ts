import { describe, expect, it } from "vitest";
import { sanitizeInternalNext } from "@/lib/authRedirect";

describe("sanitizeInternalNext", () => {
  it("keeps valid localized and unlocalized internal paths", () => {
    expect(sanitizeInternalNext("/fr/dashboard", "/fallback")).toBe("/fr/dashboard");
    expect(sanitizeInternalNext("/en/learn/course?unit=2#lesson", "/fallback")).toBe("/en/learn/course?unit=2#lesson");
    expect(sanitizeInternalNext("/onboarding/racines", "/fallback")).toBe("/onboarding/racines");
  });

  it("rejects external, protocol-relative and backslash destinations", () => {
    expect(sanitizeInternalNext("https://example.com", "/fallback")).toBe("/fallback");
    expect(sanitizeInternalNext("//example.com/path", "/fallback")).toBe("/fallback");
    expect(sanitizeInternalNext("/\\example.com", "/fallback")).toBe("/fallback");
  });

  it("uses the fallback for empty or malformed values", () => {
    expect(sanitizeInternalNext(null, "/fallback")).toBe("/fallback");
    expect(sanitizeInternalNext("", "/fallback")).toBe("/fallback");
    expect(sanitizeInternalNext("dashboard", "/fallback")).toBe("/fallback");
  });
});
