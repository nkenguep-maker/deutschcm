import "server-only";

import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

function adminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export async function setBetaAccess(params: {
  supabaseId: string;
  enabled: boolean;
}): Promise<void> {
  const admin = adminClient();
  const { data, error: readError } = await admin.auth.admin.getUserById(params.supabaseId);
  if (readError || !data.user) {
    throw new Error("beta_target_not_found");
  }

  const existing = (data.user.app_metadata ?? {}) as Record<string, unknown>;
  const { error: updateError } = await admin.auth.admin.updateUserById(params.supabaseId, {
    app_metadata: {
      ...existing,
      beta_access: params.enabled,
      beta_access_updated_at: new Date().toISOString(),
    },
  });
  if (updateError) throw updateError;
}
