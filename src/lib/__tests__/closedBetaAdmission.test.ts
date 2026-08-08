import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

describe("closed beta admission", () => {
  it("is disabled by default and uses a server-only environment flag", () => {
    const proxy = read("src/proxy.ts");

    expect(proxy).toContain('process.env.YEMA_CLOSED_BETA_ENABLED === "true"');
    expect(proxy).not.toContain("NEXT_PUBLIC_YEMA_CLOSED_BETA");
  });

  it("closes public registration while the beta flag is enabled", () => {
    const proxy = read("src/proxy.ts");

    expect(proxy).toContain('closedBeta && canonicalPath === "/register"');
    expect(proxy).toContain('NextResponse.redirect(new URL(`/${locale}/beta`, request.url))');
    expect(proxy).toContain('"/beta"');
  });

  it("requires signed beta_access for authenticated page and API access", () => {
    const proxy = read("src/proxy.ts");

    expect(proxy).toContain("params.authz.beta_access === true");
    expect(proxy).toContain('params.roles.includes("ADMIN")');
    expect(proxy).toContain("Boolean(params.internalPersona)");
    expect(proxy).toContain('error: "Closed beta access required"');
    expect(proxy).toContain("status: 403");
  });

  it("keeps only exact auth/beta bootstrap APIs plus QA outside the admission wall", () => {
    const proxy = read("src/proxy.ts");

    expect(proxy).toContain('"/api/auth/sync"');
    expect(proxy).toContain('"/api/beta/accept"');
    expect(proxy).toContain('pathname.startsWith("/api/qa/")');
    expect(proxy).not.toContain('"/api/auth/",');
    expect(proxy).not.toContain('"/api/beta/",');
    expect(proxy).not.toContain('"/api/admin/"');
    expect(proxy).toContain("isClosedBetaApiBypass(pathname)");
  });

  it("preserves beta_access when role metadata is synchronized", () => {
    const roles = read("src/lib/roles.ts");
    const betaAccess = read("src/lib/beta/access.ts");

    expect(roles).toContain("...existing");
    expect(betaAccess).toContain("data.user.app_metadata");
    expect(betaAccess).toContain("beta_access: params.enabled");
    expect(betaAccess).toContain("app_metadata:");
    expect(betaAccess).not.toContain("user_metadata:");
  });

  it("allows only a real active DB admin to grant or revoke admission", () => {
    const route = read("src/app/api/admin/beta/access/route.ts");

    expect(route).toContain("isSameOriginRequest(request)");
    expect(route).toContain('role: "ADMIN"');
    expect(route).toContain('status: "ACTIVE"');
    expect(route).toContain("setBetaAccess");
    expect(route).toContain('typeof enabled !== "boolean"');
  });

  it("ships a neutral closed-beta page without commercial promises", () => {
    const page = read("src/app/[locale]/beta/page.tsx");

    expect(page).toContain("Bêta fermée");
    expect(page).toContain("Closed beta");
    expect(page).toContain("testeurs invités");
    expect(page).not.toMatch(/99\s*€|149\s*€|Mobile Money|remboursement/i);
  });
});
