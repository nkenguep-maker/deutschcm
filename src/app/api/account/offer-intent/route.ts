import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSameOriginRequest } from "@/lib/security/requestOrigin";
import { resolvePersonaRuntime } from "@/lib/personas/runtime";

function err(code: string, status: number) {
  return NextResponse.json({ error: code }, { status });
}

export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) return err("ORIGIN_MISMATCH", 403);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err("UNAUTHORIZED", 401);

  const raw = await req.json().catch(() => null);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return err("INVALID_JSON", 400);
  const addon = (raw as { addon?: unknown }).addon;
  if (addon !== "roots-solo") return err("ADDON_INVALID", 400);

  const runtime = await resolvePersonaRuntime({
    supabaseId: user.id,
    requestedPersona: user.user_metadata?.requested_persona,
  });
  if (runtime.persona !== "student_monde") return err("MONDE_LEARNER_REQUIRED", 403);

  const currentAddons = Array.isArray(user.user_metadata?.selected_addons)
    ? user.user_metadata.selected_addons.filter((value: unknown): value is string => typeof value === "string")
    : [];
  const selectedAddons = Array.from(new Set([...currentAddons, "roots-solo"]));

  const { error } = await supabase.auth.updateUser({
    data: {
      ...(user.user_metadata ?? {}),
      selected_addons: selectedAddons,
    },
  });
  if (error) return err("PROFILE_UPDATE_FAILED", 500);

  return NextResponse.json({
    ok: true,
    addon: "roots-solo",
    selectedAddons,
    accessGranted: false,
  });
}
