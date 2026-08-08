import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

describe("closed beta invitation provisioning", () => {
  it("signs an email-targeted, short-lived token without plaintext email", () => {
    const invite = read("src/lib/beta/invite.ts");

    expect(invite).toContain('createHmac("sha256"');
    expect(invite).toContain('createHash("sha256"');
    expect(invite).toContain("timingSafeEqual");
    expect(invite).toContain("randomBytes(24)");
    expect(invite).toContain("72 * 60 * 60");
    expect(invite).toContain("emailHash: hashInviteEmail(params.email)");
    expect(invite).not.toContain("email: normalizeInviteEmail(params.email)");
    expect(invite).toContain("secret.length < 32");
  });

  it("requires closed-beta mode and a real active admin before issuing a link", () => {
    const route = read("src/app/api/admin/beta/invite/route.ts");

    expect(route).toContain("isClosedBetaEnabled()");
    expect(route).toContain("isSameOriginRequest(request)");
    expect(route).toContain('role: "ADMIN"');
    expect(route).toContain('status: "ACTIVE"');
    expect(route).toContain("createBetaInviteToken({ email })");
    expect(route).toContain("sendEmail({");
    expect(route).not.toContain("prisma.beta");
  });

  it("verifies the token before any auth account creation", () => {
    const route = read("src/app/api/beta/accept/route.ts");

    const verify = route.indexOf("verifyBetaInviteToken({ token: input.token, email })");
    const create = route.indexOf("admin.auth.admin.createUser");
    expect(verify).toBeGreaterThan(-1);
    expect(create).toBeGreaterThan(verify);
  });

  it("never lets a beta invitation grant a privileged YEMA role", () => {
    const route = read("src/app/api/beta/accept/route.ts");

    expect(route).toContain("reconcileAuthenticatedUser(data.user)");
    expect(route).toContain("setBetaAccess({ supabaseId: data.user.id, enabled: true })");
    expect(route).not.toContain('role: "ADMIN"');
    expect(route).not.toContain('role: "TEACHER"');
    expect(route).not.toContain('role: "CENTER"');
    expect(route).not.toContain("grantRole(");
  });

  it("keeps existing account passwords and roles untouched", () => {
    const route = read("src/app/api/beta/accept/route.ts");
    const existingBranch = route.slice(
      route.indexOf("const existing = await prisma.user.findFirst"),
      route.indexOf("const admin = adminClient()"),
    );

    expect(existingBranch).toContain("setBetaAccess");
    expect(existingBranch).not.toContain("password:");
    expect(existingBranch).not.toContain("grantRole(");
  });

  it("compensates a failed new-account provisioning by deleting the auth user", () => {
    const route = read("src/app/api/beta/accept/route.ts");

    expect(route).toContain("email_confirm: true");
    expect(route).toContain("admin.auth.admin.deleteUser(data.user.id)");
    expect(route).toContain('status: "created"');
  });

  it("uses password login only after server acceptance", () => {
    const page = read("src/app/[locale]/beta/accept/page.tsx");

    const accept = page.indexOf('fetch("/api/beta/accept"');
    const login = page.indexOf("supabase.auth.signInWithPassword");
    expect(accept).toBeGreaterThan(-1);
    expect(login).toBeGreaterThan(accept);
    expect(page).toContain('fetch("/api/auth/sync", { method: "POST" })');
    expect(page).not.toContain("signInWithOAuth");
  });

  it("keeps the admin invitation console admission-only", () => {
    const page = read("src/app/[locale]/admin/beta/page.tsx");

    expect(page).toContain('fetch("/api/admin/beta/invite"');
    expect(page).toContain("navigator.clipboard.writeText");
    expect(page).toContain("72 heures");
    expect(page).not.toContain('value="TEACHER"');
    expect(page).not.toContain('value="CENTER"');
    expect(page).not.toContain('value="ADMIN"');
  });
});
