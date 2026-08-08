import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdmin, type SupabaseClient, type User as SupabaseUser } from "@supabase/supabase-js";
import prisma from "@/lib/prisma";
import {
  BetaInviteError,
  isClosedBetaEnabled,
  normalizeInviteEmail,
  verifyBetaInviteToken,
} from "@/lib/beta/invite";
import {
  claimBetaInvitation,
  finalizeBetaInvitation,
  releaseBetaInvitationClaim,
} from "@/lib/beta/invitationStore";
import { setBetaAccess } from "@/lib/beta/access";
import { reconcileAuthenticatedUser } from "@/lib/auth/reconcileAuthenticatedUser";
import { isSameOriginRequest } from "@/lib/security/requestOrigin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UNIVERSES = new Set(["monde", "racines"]);
const AUTH_PAGE_SIZE = 200;

function adminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

async function findRecoverableBetaOrphan(
  admin: SupabaseClient,
  email: string,
): Promise<SupabaseUser | null> {
  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: AUTH_PAGE_SIZE });
    if (error) throw error;

    const exact = data.users.find((candidate) => normalizeInviteEmail(candidate.email ?? "") === email);
    if (exact) {
      const metadata = (exact.user_metadata ?? {}) as Record<string, unknown>;
      return metadata.beta_invited === true ? exact : null;
    }
    if (data.users.length < AUTH_PAGE_SIZE) return null;
    page += 1;
  }
}

export async function POST(request: NextRequest) {
  if (!isClosedBetaEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const input = body as {
    token?: unknown;
    email?: unknown;
    password?: unknown;
    fullName?: unknown;
    universe?: unknown;
  };
  if (
    typeof input.token !== "string" || input.token.length === 0 || input.token.length > 2048 ||
    typeof input.email !== "string" ||
    (input.password !== undefined && (typeof input.password !== "string" || input.password.length > 128)) ||
    (input.fullName !== undefined && (typeof input.fullName !== "string" || input.fullName.length > 120)) ||
    (input.universe !== undefined && (typeof input.universe !== "string" || !UNIVERSES.has(input.universe)))
  ) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const email = normalizeInviteEmail(input.email);
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    verifyBetaInviteToken({ token: input.token, email });
  } catch (error) {
    if (error instanceof BetaInviteError) {
      const status = error.code === "invite_expired" ? 410 : error.code === "invite_secret_missing" ? 503 : 400;
      return NextResponse.json(
        { error: status === 410 ? "Invitation expired" : "Invalid invitation", code: error.code },
        { status },
      );
    }
    throw error;
  }

  let claim: Awaited<ReturnType<typeof claimBetaInvitation>>;
  try {
    claim = await claimBetaInvitation({ token: input.token, email });
  } catch (error) {
    console.error("[beta/accept] durable claim failed", error);
    return NextResponse.json({ error: "Invitation store unavailable" }, { status: 503 });
  }
  if (!claim) {
    return NextResponse.json(
      { error: "Invitation already used, revoked or unavailable", code: "invite_not_pending" },
      { status: 409 },
    );
  }

  // Existing YEMA accounts keep their password and roles. The invite only
  // grants signed beta admission; no password is required or changed here.
  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true, supabaseId: true },
  });
  if (existing) {
    let previousBetaAccess: boolean | null = null;
    try {
      previousBetaAccess = await setBetaAccess({ supabaseId: existing.supabaseId, enabled: true });
      await finalizeBetaInvitation({ invitationId: claim.id, acceptedByUserId: existing.id });
      return NextResponse.json({ ok: true, status: "existing" });
    } catch (error) {
      console.error("[beta/accept] existing account admission failed", error);
      if (previousBetaAccess !== null) {
        await setBetaAccess({
          supabaseId: existing.supabaseId,
          enabled: previousBetaAccess,
        }).catch(() => undefined);
      }
      await releaseBetaInvitationClaim(claim.id).catch(() => undefined);
      return NextResponse.json({ error: "Unable to activate invitation" }, { status: 409 });
    }
  }

  if (typeof input.password !== "string" || input.password.length < 8) {
    await releaseBetaInvitationClaim(claim.id).catch(() => undefined);
    return NextResponse.json(
      { error: "Password required for new account", code: "password_required" },
      { status: 400 },
    );
  }

  const admin = adminClient();
  const fullName = typeof input.fullName === "string" ? input.fullName.trim().slice(0, 120) : "";
  const universe = typeof input.universe === "string" ? input.universe : undefined;
  const { data, error: createError } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      ...(fullName ? { full_name: fullName } : {}),
      ...(universe ? { universe } : {}),
      beta_invited: true,
    },
  });

  let authUser = data.user;
  let recoveredOrphan = false;
  if (createError || !authUser) {
    // A prior process may have crashed after Auth creation but before Prisma
    // reconciliation. Recover only our own marked beta orphan. Never adopt or
    // modify an arbitrary pre-existing Auth account.
    try {
      const orphan = await findRecoverableBetaOrphan(admin, email);
      if (orphan) {
        const dbOwner = await prisma.user.findUnique({
          where: { supabaseId: orphan.id },
          select: { id: true },
        });
        if (!dbOwner) {
          const { data: recovered, error: recoverError } = await admin.auth.admin.updateUserById(orphan.id, {
            password: input.password,
            email_confirm: true,
            user_metadata: {
              ...(orphan.user_metadata ?? {}),
              ...(fullName ? { full_name: fullName } : {}),
              ...(universe ? { universe } : {}),
              beta_invited: true,
            },
          });
          if (!recoverError && recovered.user) {
            authUser = recovered.user;
            recoveredOrphan = true;
          }
        }
      }
    } catch (recoveryError) {
      console.error("[beta/accept] orphan recovery lookup failed", recoveryError);
    }
  }

  if (!authUser) {
    console.error("[beta/accept] auth creation failed", createError?.message ?? "missing user");
    await releaseBetaInvitationClaim(claim.id).catch(() => undefined);
    return NextResponse.json({ error: "Unable to create invited account" }, { status: 409 });
  }

  try {
    await setBetaAccess({ supabaseId: authUser.id, enabled: true });
    const reconciled = await reconcileAuthenticatedUser(authUser);
    await finalizeBetaInvitation({ invitationId: claim.id, acceptedByUserId: reconciled.user.id });
  } catch (error) {
    console.error("[beta/accept] provisioning failed", error);
    // Both a newly-created Auth account and a recovered marked orphan belong to
    // this beta provisioning attempt and have no pre-existing Prisma owner.
    await admin.auth.admin.deleteUser(authUser.id).catch(() => undefined);
    await prisma.user.deleteMany({ where: { supabaseId: authUser.id } }).catch(() => undefined);
    await releaseBetaInvitationClaim(claim.id).catch(() => undefined);
    return NextResponse.json({ error: "Unable to provision invited account" }, { status: 500 });
  }

  return NextResponse.json(
    { ok: true, status: recoveredOrphan ? "recovered" : "created", universe: universe ?? null },
    { status: recoveredOrphan ? 200 : 201 },
  );
}
