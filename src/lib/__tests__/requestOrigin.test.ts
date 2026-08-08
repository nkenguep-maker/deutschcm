import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { isSameOriginRequest } from "@/lib/security/requestOrigin";

function request(headers?: Record<string, string>) {
  return new NextRequest("https://deutschcm.vercel.app/api/security-test", {
    method: "POST",
    headers,
  });
}

describe("P4.7 · exact same-origin guard", () => {
  it("accepts the exact browser origin", () => {
    expect(isSameOriginRequest(request({ origin: "https://deutschcm.vercel.app" }))).toBe(true);
  });

  it("rejects sibling/suffix hosts", () => {
    expect(isSameOriginRequest(request({ origin: "https://evil-deutschcm.vercel.app" }))).toBe(false);
    expect(isSameOriginRequest(request({ origin: "https://deutschcm.vercel.app.evil.example" }))).toBe(false);
  });

  it("rejects scheme or port mismatches", () => {
    expect(isSameOriginRequest(request({ origin: "http://deutschcm.vercel.app" }))).toBe(false);
    expect(isSameOriginRequest(request({ origin: "https://deutschcm.vercel.app:444" }))).toBe(false);
  });

  it("rejects browser cross-site and same-site fallback signals when Origin is absent", () => {
    expect(isSameOriginRequest(request({ "sec-fetch-site": "cross-site" }))).toBe(false);
    expect(isSameOriginRequest(request({ "sec-fetch-site": "same-site" }))).toBe(false);
    expect(isSameOriginRequest(request({ "sec-fetch-site": "same-origin" }))).toBe(true);
  });

  it("validates Referer when Origin is absent", () => {
    expect(isSameOriginRequest(request({ referer: "https://deutschcm.vercel.app/fr/dashboard" }))).toBe(true);
    expect(isSameOriginRequest(request({ referer: "https://evil.example/attack" }))).toBe(false);
    expect(isSameOriginRequest(request({ referer: "not a url" }))).toBe(false);
  });

  it("allows non-browser/server calls without browser origin signals", () => {
    expect(isSameOriginRequest(request())).toBe(true);
    expect(isSameOriginRequest(request({ "sec-fetch-site": "none" }))).toBe(true);
  });

  it("rejects malformed Origin before considering weaker fallbacks", () => {
    expect(isSameOriginRequest(request({ origin: "not a url", "sec-fetch-site": "same-origin" }))).toBe(false);
  });
});
