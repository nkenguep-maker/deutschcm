import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const route = readFileSync(resolve(REPO, "src/app/api/apply/center/route.ts"), "utf8");

describe("public center application hardening", () => {
  it("checks browser origin before parsing or writing", () => {
    const origin = route.indexOf("isSameOriginRequest(request)");
    const json = route.indexOf("request.json()");
    const create = route.indexOf("prisma.centerApplication.create");

    expect(origin).toBeGreaterThan(-1);
    expect(json).toBeGreaterThan(origin);
    expect(create).toBeGreaterThan(json);
    expect(route).toContain('error: "forbidden"');
  });

  it("bounds untrusted fields and rejects malformed JSON", () => {
    expect(route).toContain('error: "invalid_json"');
    expect(route).toContain("MAX_CENTER_NAME = 120");
    expect(route).toContain("MAX_CITY = 120");
    expect(route).toContain("MAX_EMAIL = 254");
    expect(route).toContain("MAX_WHATSAPP = 40");
    expect(route).toContain('error: "field_too_long"');
  });

  it("rate limits repeat submissions before creating the application", () => {
    const count = route.indexOf("prisma.centerApplication.count");
    const limit = route.indexOf("MAX_APPLICATIONS_PER_EMAIL_PER_HOUR");
    const create = route.indexOf("prisma.centerApplication.create");

    expect(count).toBeGreaterThan(-1);
    expect(limit).toBeGreaterThan(-1);
    expect(create).toBeGreaterThan(count);
    expect(route).toContain("status: 429");
    expect(route).toContain('"Retry-After": "3600"');
  });

  it("escapes user-controlled values before HTML email rendering", () => {
    expect(route).toContain("function escapeHtml(value: string)");
    expect(route).toContain('.replaceAll("<", "&lt;")');
    expect(route).toContain("const safeCenterName = escapeHtml(centerName)");
    expect(route).toContain("const city = escapeHtml(app.city)");
    expect(route).toContain("const email = escapeHtml(app.email)");
    expect(route).toContain("const whatsapp = escapeHtml(app.whatsapp ?? \"—\")");
  });
});
