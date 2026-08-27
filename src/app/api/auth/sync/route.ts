import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { reconcileAuthenticatedUser } from "@/lib/auth/reconcileAuthenticatedUser";
import { ReconcileError } from "@/lib/reconcileDbUser";
import { canReconcileClosedBetaIdentity } from "@/lib/beta/access";
import { isSameOriginRequest } from "@/lib/security/requestOrigin";

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (!(await canReconcileClosedBetaIdentity(user))) {
      return NextResponse.json(
        { error: "Closed beta access required", code: "beta_access_required" },
        { status: 403 },
      );
    }

    const result = await reconcileAuthenticatedUser(user);
    return NextResponse.json({ ok: true, activeSpace: result.activeSpace });
  } catch (error) {
    if (error instanceof ReconcileError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
    }
    console.error("[api/auth/sync] failed", error);
    return NextResponse.json({ error: "Unable to synchronize authorization" }, { status: 500 });
  }
}
