// P4.4 · Dashboard Coach Racines · SSR.

import { redirect } from "next/navigation";
import { isRootsCoachWorkspaceActive, isYemaDashboardRedesignActive } from "@/lib/flags";
import { resolveRootsCoachActorOrNull } from "@/lib/permissions/rootsCoach";
import { getRootsCoachDashboard } from "@/lib/rootsCoach/queries";
import RootsCoachFeaturePlaceholder from "@/components/rootsCoach/RootsCoachFeaturePlaceholder";
import RootsCoachDashboardView from "@/components/rootsCoach/RootsCoachDashboardView";
import { CoachRacinesDashboard } from "@/features/dashboards/coach-racines";
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

  const internalPersona = await resolveActiveInternalPersona(["coach"]);
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
  if (runtime.persona && runtime.persona !== "coach") {
    redirect(`/${locale}${runtime.onboarded ? runtime.homeRoute : runtime.onboardingRoute}`);
  }
  if (runtime.persona === "coach" && !runtime.onboarded) {
    redirect(`/${locale}${runtime.onboardingRoute}`);
  }

  if (!isRootsCoachWorkspaceActive()) {
    return <RootsCoachFeaturePlaceholder locale={locale} />;
  }
  const actor = await resolveRootsCoachActorOrNull();
  if (!actor) redirect(`/${locale}/login`);

  if (isYemaDashboardRedesignActive()) {
    return <CoachRacinesDashboard locale={loc} />;
  }

  const stats = await getRootsCoachDashboard(actor.userId);
  return <RootsCoachDashboardView locale={locale} stats={stats} />;
}
