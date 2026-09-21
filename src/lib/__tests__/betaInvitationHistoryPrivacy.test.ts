import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

describe("closed beta invitation history", () => {
  it("is admin-only and never exposes token or email material", () => {
    const route = read("src/app/api/admin/beta/invitations/route.ts");
    const panel = read("src/features/beta/BetaInvitationHistory.tsx");

    expect(route).toContain("isClosedBetaEnabled()");
    expect(route).toContain('role: "ADMIN"');
    expect(route).toContain('status: "ACTIVE"');
    expect(route).toContain('take: 50');
    expect(route).toContain('"Cache-Control": "private, no-store, max-age=0"');
    expect(route).not.toContain("tokenHash:");
    expect(route).not.toContain("emailHash:");
    expect(route).not.toContain("email:");
    expect(panel).toContain("no email address");
    expect(panel).toContain("aucune adresse e-mail");
  });
});
