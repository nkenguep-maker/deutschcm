// P4.6 Lot 4A · Dashboard Famille YEMA (redesign) · route locale-aware.

import { redirect } from "next/navigation";
import { resolveFamilyGuardianActorOrNull } from "@/lib/family/actor";
import { FamilyDashboard } from "@/features/dashboards/family";
import { InternalPersonaDashboard } from "@/features/dashboards/internal-test/InternalPersonaDashboard";
import { resolveActiveInternalPersona } from "@/lib/internalPersonaPage";
import { createClient } from "@/lib/supabase/server";
import { resolvePersonaRuntime } from "@/lib/personas/runtime";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";

  const internalPersona = await resolveActiveInternalPersona(["family"]);
  if (internalPersona) {
    return <InternalPersonaDashboard persona={internalPersona} locale={loc} />;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const runtime = await resolvePersonaRuntime({
    supabaseId: user.id,
    requestedPersona: user.user_metadata?.requested_persona,
  });
  if (runtime.persona && runtime.persona !== "family") {
    redirect(`/${locale}${runtime.onboarded ? runtime.homeRoute : runtime.onboardingRoute}`);
  }
  if (runtime.persona === "family" && !runtime.onboarded) {
    redirect(`/${locale}${runtime.onboardingRoute}`);
  }

  const actor = await resolveFamilyGuardianActorOrNull();
  if (!actor) redirect(`/${locale}/login`);
  return <FamilyDashboard locale={loc} />;
}
