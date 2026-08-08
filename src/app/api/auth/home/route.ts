import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolvePersonaRuntime } from "@/lib/personas/runtime";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const runtime = await resolvePersonaRuntime({
    supabaseId: user.id,
    requestedPersona: user.user_metadata?.requested_persona,
  });

  return NextResponse.json({
    persona: runtime.persona,
    destination: runtime.onboarded ? runtime.homeRoute : runtime.onboardingRoute,
    homeRoute: runtime.homeRoute,
    onboardingRoute: runtime.onboardingRoute,
    onboarded: runtime.onboarded,
    universe: runtime.universe,
  });
}
