import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

describe("closed beta provisioning boundary", () => {
  it("admits reconciliation only from beta_access or an exactly linked active admin", () => {
    const access = read("src/lib/beta/access.ts");

    expect(access).toContain("canReconcileClosedBetaIdentity");
    expect(access).toContain("if (!isClosedBetaEnabled()) return true");
    expect(access).toContain("authz.beta_access === true");
    expect(access).toContain("where: { supabaseId: authUser.id }");
    expect(access).toContain('where: { role: "ADMIN", status: "ACTIVE" }');
    expect(access).not.toContain("email: { equals:");
  });

  it("guards /api/auth/sync before any Prisma reconciliation", () => {
    const route = read("src/app/api/auth/sync/route.ts");
    const guard = route.indexOf("canReconcileClosedBetaIdentity(user)");
    const reconcile = route.indexOf("reconcileAuthenticatedUser(user)");

    expect(guard).toBeGreaterThan(-1);
    expect(reconcile).toBeGreaterThan(guard);
    expect(route).toContain('code: "beta_access_required"');
    expect(route).toContain("status: 403");
  });

  it("guards auth callbacks before reconciliation and destroys denied sessions", () => {
    const route = read("src/app/auth/callback/route.ts");
    const guard = route.indexOf("canReconcileClosedBetaIdentity(user)");
    const reconcile = route.indexOf("reconcileAuthenticatedUser(user)");
    const denied = route.indexOf("if (!admitted)");
    const signOut = route.indexOf("supabase.auth.signOut()", denied);
    const betaRedirect = route.indexOf("betaPathFor(next)", denied);

    expect(guard).toBeGreaterThan(-1);
    expect(reconcile).toBeGreaterThan(guard);
    expect(denied).toBeGreaterThan(guard);
    expect(signOut).toBeGreaterThan(denied);
    expect(betaRedirect).toBeGreaterThan(signOut);
  });

  it("keeps trusted invitation provisioning separate from generic auth sync", () => {
    const accept = read("src/app/api/beta/accept/route.ts");
    const grant = accept.indexOf("setBetaAccess({ supabaseId: authUser.id, enabled: true })");
    const reconcile = accept.indexOf("reconcileAuthenticatedUser(authUser)");

    expect(grant).toBeGreaterThan(-1);
    expect(reconcile).toBeGreaterThan(grant);
  });
});
