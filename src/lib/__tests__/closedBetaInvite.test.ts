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
    expect(invite).toContain("hashInviteToken");
    expect(invite).not.toContain("email: normalizeInviteEmail(params.email)");
    expect(invite).toContain("secret.length < 32");
  });

  it("models a server-only invitation ledger in Prisma", () => {
    const schema = read("prisma/schema.prisma");

    expect(schema).toContain("model BetaInvitation {");
    expect(schema).toContain("tokenHash        String           @unique");
    expect(schema).toContain("emailHash        String");
    expect(schema).toContain("status           InvitationStatus @default(PENDING)");
    expect(schema).toContain('@@map("beta_invitations")');
  });

  it("migrates the ledger deny-by-default with no Data API grants", () => {
    const migration = read("prisma/migrations/20260808000002_closed_beta_invitations/migration.sql");

    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.beta_invitations");
    expect(migration).toContain('"tokenHash" TEXT NOT NULL');
    expect(migration).toContain('"emailHash" TEXT NOT NULL');
    expect(migration).toContain("ALTER TABLE public.beta_invitations ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("REVOKE ALL ON TABLE public.beta_invitations FROM PUBLIC, anon, authenticated");
    expect(migration).not.toMatch(/token\s+TEXT/i);
    expect(migration).not.toMatch(/email\s+TEXT/i);
  });

  it("stores only hashes and claims a pending invitation atomically", () => {
    const store = read("src/lib/beta/invitationStore.ts");

    expect(store).toContain("prisma.betaInvitation.create");
    expect(store).toContain("tokenHash: hashInviteToken(params.token)");
    expect(store).toContain("emailHash: hashInviteEmail(params.email)");
    expect(store).toContain("prisma.betaInvitation.updateMany");
    expect(store).toContain('status: "PENDING"');
    expect(store).toContain('status: "ACCEPTED"');
    expect(store).toContain("claim.count === 1");
    expect(store).not.toContain("token: params.token");
    expect(store).not.toContain("email: params.email");
  });

  it("requires closed-beta mode and a real active admin before issuing a link", () => {
    const route = read("src/app/api/admin/beta/invite/route.ts");

    expect(route).toContain("isClosedBetaEnabled()");
    expect(route).toContain("isSameOriginRequest(request)");
    expect(route).toContain('role: "ADMIN"');
    expect(route).toContain('status: "ACTIVE"');
    expect(route).toContain("createBetaInviteToken({");
    expect(route).toContain("storeBetaInvitation({");
    expect(route).toContain("sendEmail({");
    expect(route).toContain("invitationId: stored.id");
  });

  it("verifies and atomically claims the token before any auth account creation", () => {
    const route = read("src/app/api/beta/accept/route.ts");

    const verify = route.indexOf("verifyBetaInviteToken({ token: input.token, email })");
    const claim = route.indexOf("claimBetaInvitation({ token: input.token, email })");
    const create = route.indexOf("admin.auth.admin.createUser");
    expect(verify).toBeGreaterThan(-1);
    expect(claim).toBeGreaterThan(verify);
    expect(create).toBeGreaterThan(claim);
    expect(route).toContain('code: "invite_not_pending"');
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
      route.indexOf('if (typeof input.password !== "string"'),
    );

    expect(existingBranch).toContain("setBetaAccess");
    expect(existingBranch).toContain("finalizeBetaInvitation");
    expect(existingBranch).not.toContain("password:");
    expect(existingBranch).not.toContain("grantRole(");
  });

  it("requires a password only for a genuinely new account", () => {
    const route = read("src/app/api/beta/accept/route.ts");
    const existingLookup = route.indexOf("const existing = await prisma.user.findFirst");
    const passwordGuard = route.indexOf('if (typeof input.password !== "string" || input.password.length < 8)');
    const create = route.indexOf("admin.auth.admin.createUser");

    expect(existingLookup).toBeGreaterThan(-1);
    expect(passwordGuard).toBeGreaterThan(existingLookup);
    expect(create).toBeGreaterThan(passwordGuard);
  });

  it("compensates failed new-account provisioning and releases the claim", () => {
    const route = read("src/app/api/beta/accept/route.ts");

    expect(route).toContain("email_confirm: true");
    expect(route).toContain("admin.auth.admin.deleteUser(data.user.id)");
    expect(route).toContain("prisma.user.deleteMany({ where: { supabaseId: data.user.id } })");
    expect(route).toContain("releaseBetaInvitationClaim(claim.id)");
    expect(route).toContain('status: "created"');
  });

  it("lets an active DB admin revoke only an unused link", () => {
    const route = read("src/app/api/admin/beta/invite/revoke/route.ts");
    const store = read("src/lib/beta/invitationStore.ts");

    expect(route).toContain("isSameOriginRequest(request)");
    expect(route).toContain('role: "ADMIN"');
    expect(route).toContain('status: "ACTIVE"');
    expect(route).toContain("revokeBetaInvitation({ invitationId })");
    expect(store).toContain('status: "REVOKED"');
    expect(store).toContain('status: "PENDING"');
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

  it("keeps the admin invitation console admission-only and revocable", () => {
    const page = read("src/app/[locale]/admin/beta/page.tsx");

    expect(page).toContain('fetch("/api/admin/beta/invite"');
    expect(page).toContain('fetch("/api/admin/beta/invite/revoke"');
    expect(page).toContain("navigator.clipboard.writeText");
    expect(page).toContain("utilisable une seule fois");
    expect(page).toContain("Révoquer ce lien");
    expect(page).not.toContain('value="TEACHER"');
    expect(page).not.toContain('value="CENTER"');
    expect(page).not.toContain('value="ADMIN"');
  });
});
