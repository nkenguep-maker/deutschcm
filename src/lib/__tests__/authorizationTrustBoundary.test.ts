import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

describe("authorization trust boundary", () => {
  it("mirrors database roles into admin-only app_metadata", () => {
    const roles = read("src/lib/roles.ts");

    expect(roles).toContain("current?.user?.app_metadata");
    expect(roles).toContain("app_metadata:");
    expect(roles).not.toContain("current?.user?.user_metadata");
    expect(roles).not.toMatch(/updateUserById[\s\S]*user_metadata:/);
  });

  it("proxy authorizes only from signed app_metadata", () => {
    const proxy = read("src/proxy.ts");

    expect(proxy).toContain("const authz = user.app_metadata ?? {}");
    expect(proxy).toContain("authz.roles");
    expect(proxy).toContain("authz.onboarded_map");
    expect(proxy).toContain("authz.active_space");
    expect(proxy).not.toContain("meta.roles");
    expect(proxy).not.toContain("meta.role");
    expect(proxy).not.toContain('request.cookies.get("user_role")');
  });

  it("callback ignores caller-controlled role metadata", () => {
    const callback = read("src/app/auth/callback/route.ts");

    expect(callback).toContain("reconcileAuthenticatedUser(user)");
    expect(callback).not.toContain("ROLE_MAP");
    expect(callback).not.toContain("user.user_metadata?.role");
  });

  it("never grants privileged roles through the legacy self-service endpoint", () => {
    const route = read("src/app/api/fix-role/route.ts");

    expect(route).toContain('if (role !== "STUDENT")');
    expect(route).toContain('code: "ROLE_APPROVAL_REQUIRED"');
    expect(route).not.toContain("grantRole(");
    expect(route).not.toContain('defaultRole: role');
  });

  it("synchronizes trusted authorization after login and immediate signup", () => {
    const login = read("src/app/[locale]/login/page.tsx");
    const register = read("src/app/[locale]/register/page.tsx");

    expect(login).toContain('fetch("/api/auth/sync", { method: "POST" })');
    expect(login).toContain("supabase.auth.refreshSession()");
    expect(register).toContain('fetch("/api/auth/sync", { method: "POST" })');
    expect(register).not.toContain('role: "STUDENT" as const');
  });

  it("preserves the trusted primary DB role for historical multi-role users", () => {
    const reconcile = read("src/lib/auth/reconcileAuthenticatedUser.ts");

    expect(reconcile).toContain("const trustedPrimary = existing?.role");
    expect(reconcile).toContain("primaryIsActive");
    expect(reconcile).toContain("primaryIsActive\n      ? trustedPrimary");
    expect(reconcile).toContain("markRoleOnboarded(result.user.id, activeSpace)");
    expect(reconcile).toContain("existing?.onboardingDone");
  });

  it("protects privileged role mutations with same-origin and DB-admin checks", () => {
    for (const path of ["src/app/api/roles/grant/route.ts", "src/app/api/roles/revoke/route.ts"]) {
      const route = read(path);
      expect(route).toContain("isSameOriginRequest(request)");
      expect(route).toContain('role: "ADMIN"');
      expect(route).toContain('status: "ACTIVE"');
      expect(route).toContain('status: 403');
    }
  });
});
