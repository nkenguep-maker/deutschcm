import "server-only";

import { createClient as createSupabaseAdmin, type User as SupabaseUser } from "@supabase/supabase-js";
import prisma from "@/lib/prisma";
import { isClosedBetaEnabled } from "@/lib/beta/invite";

function adminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/**
 * Admission guard for generic authentication reconciliation.
 *
 * During the closed beta, an authenticated Supabase identity must not be able
 * to create/reconcile a Prisma User merely by calling /api/auth/sync or by
 * completing an OAuth/magic-link callback. Admission is trusted only from the
 * admin-written app_metadata flag. Existing DB admins are the sole bootstrap
 * exception, and only when the exact Supabase identity is already linked.
 *
 * The invitation accept route is a separate trusted provisioning workflow: it
 * grants beta_access first, then reconciles the freshly created identity.
 */
export async function canReconcileClosedBetaIdentity(authUser: SupabaseUser): Promise<boolean> {
  if (!isClosedBetaEnabled()) return true;

  const authz = (authUser.app_metadata ?? {}) as Record<string, unknown>;
  if (authz.beta_access === true) return true;

  const existing = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    select: {
      userRoles: {
        where: { role: "ADMIN", status: "ACTIVE" },
        select: { id: true },
        take: 1,
      },
    },
  });

  return Boolean(existing?.userRoles.length);
}

export async function setBetaAccess(params: {
  supabaseId: string;
  enabled: boolean;
}): Promise<boolean> {
  const admin = adminClient();
  const { data, error: readError } = await admin.auth.admin.getUserById(params.supabaseId);
  if (readError || !data.user) {
    throw new Error("beta_target_not_found");
  }

  const existing = (data.user.app_metadata ?? {}) as Record<string, unknown>;
  const previousEnabled = existing.beta_access === true;
  const { error: updateError } = await admin.auth.admin.updateUserById(params.supabaseId, {
    app_metadata: {
      ...existing,
      beta_access: params.enabled,
      beta_access_updated_at: new Date().toISOString(),
    },
  });
  if (updateError) throw updateError;
  return previousEnabled;
}
