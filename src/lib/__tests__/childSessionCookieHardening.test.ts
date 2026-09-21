import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const route = readFileSync(resolve(REPO, "src/app/api/child-session/route.ts"), "utf8");

describe("child session cookie hardening", () => {
  it("uses HttpOnly Secure-in-production and SameSite Strict on issue", () => {
    const issue = route.slice(route.indexOf("jar.set(CHILD_SESSION_COOKIE_NAME, cookieValue"), route.indexOf("return NextResponse.json({ active: true"));
    expect(issue).toContain("httpOnly: true");
    expect(issue).toContain('secure: process.env.NODE_ENV === "production"');
    expect(issue).toContain('sameSite: "strict"');
    expect(issue).toContain("maxAge: CHILD_SESSION_TTL_SECONDS");
  });

  it("uses the same strict attributes when clearing the child session", () => {
    const clear = route.slice(route.indexOf('jar.set(CHILD_SESSION_COOKIE_NAME, ""'));
    expect(clear).toContain("httpOnly: true");
    expect(clear).toContain('secure: process.env.NODE_ENV === "production"');
    expect(clear).toContain('sameSite: "strict"');
    expect(clear).toContain("maxAge: 0");
  });
});
