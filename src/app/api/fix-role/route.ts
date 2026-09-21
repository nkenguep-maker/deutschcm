import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncUserMetadata } from "@/lib/roles";
import { reconcileDbUser, ReconcileError } from "@/lib/reconcileDbUser";
import { isSameOriginRequest } from "@/lib/security/requestOrigin";

// Legacy role repair endpoint. Self-service may only restore the base learner
// role. TEACHER/CENTER/ADMIN must be granted by a trusted server workflow.

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const role = body && typeof body === "object" && !Array.isArray(body)
    ? (body as { role?: unknown }).role
    : null;

  if (role !== "STUDENT") {
    return NextResponse.json(
      { error: "Privileged roles require approval", code: "ROLE_APPROVAL_REQUIRED" },
      { status: 403 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    await reconcileDbUser({
      authUser: user,
      defaultRole: "STUDENT",
    });
  } catch (e) {
    if (e instanceof ReconcileError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: 400 });
    }
    throw e;
  }

  await syncUserMetadata({ supabaseId: user.id, activeSpace: "STUDENT" });
  return NextResponse.json({ ok: true, role: "STUDENT" });
}
