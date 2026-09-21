// P4.3a · Center dashboard · SSR · scope strict centerId.

import { redirect } from "next/navigation";
import { isCenterRealDataActive, isYemaDashboardRedesignActive } from "@/lib/flags";
import { resolveCenterActorOrNull } from "@/lib/permissions/center";
import { getCenterDashboard } from "@/lib/center/queries";
import CenterFeaturePlaceholder from "@/components/center/CenterFeaturePlaceholder";
import CenterDashboardView from "@/components/center/CenterDashboardView";
import { CenterDashboard } from "@/features/dashboards/center";
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

  const internalPersona = await resolveActiveInternalPersona(["center_admin"]);
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
  if (runtime.persona && runtime.persona !== "center_admin") {
    redirect(`/${locale}${runtime.onboarded ? runtime.homeRoute : runtime.onboardingRoute}`);
  }
  if (runtime.persona === "center_admin" && !runtime.onboarded) {
    redirect(`/${locale}${runtime.onboardingRoute}`);
  }

  if (!isCenterRealDataActive()) {
    return <CenterFeaturePlaceholder locale={locale} />;
  }
  const actor = await resolveCenterActorOrNull();
  if (!actor) redirect(`/${locale}/login`);

  if (isYemaDashboardRedesignActive()) {
    return <CenterDashboard locale={loc} />;
  }

  const stats = await getCenterDashboard(actor.centerId);
  return (
    <CenterDashboardView
      locale={locale}
      center={actor.center}
      stats={stats}
    />
  );
}
