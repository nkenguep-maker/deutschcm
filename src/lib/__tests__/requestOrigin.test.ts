import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { isSameOriginRequest } from "@/lib/security/requestOrigin";

function request(origin?: string) {
  return new NextRequest("https://deutschcm.vercel.app/api/security-test", {
    method: "POST",
    headers: origin ? { origin } : undefined,
  });
}

describe("P4.7 · exact same-origin guard", () => {
  it("accepts the exact browser origin", () => {
    expect(isSameOriginRequest(request("https://deutschcm.vercel.app"))).toBe(true);
  });

  it("rejects sibling/suffix hosts", () => {
    expect(isSameOriginRequest(request("https://evil-deutschcm.vercel.app"))).toBe(false);
    expect(isSameOriginRequest(request("https://deutschcm.vercel.app.evil.example"))).toBe(false);
  });

  it("rejects scheme or port mismatches", () => {
    expect(isSameOriginRequest(request("http://deutschcm.vercel.app"))).toBe(false);
    expect(isSameOriginRequest(request("https://deutschcm.vercel.app:444"))).toBe(false);
  });

  it("allows non-browser/server calls without Origin and rejects malformed Origin", () => {
    expect(isSameOriginRequest(request())).toBe(true);
    expect(isSameOriginRequest(request("not a url"))).toBe(false);
  });
});
