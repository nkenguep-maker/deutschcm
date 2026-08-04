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
