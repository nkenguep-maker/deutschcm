// P4.4 · Dashboard Coach Racines · SSR.

import { redirect } from "next/navigation";
import { isRootsCoachWorkspaceActive, isYemaDashboardRedesignActive } from "@/lib/flags";
import { resolveRootsCoachActorOrNull } from "@/lib/permissions/rootsCoach";
import { getRootsCoachDashboard } from "@/lib/rootsCoach/queries";
import RootsCoachFeaturePlaceholder from "@/components/rootsCoach/RootsCoachFeaturePlaceholder";
import RootsCoachDashboardView from "@/components/rootsCoach/RootsCoachDashboardView";
import { CoachRacinesDashboard } from "@/features/dashboards/coach-racines";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isRootsCoachWorkspaceActive()) {
    return <RootsCoachFeaturePlaceholder locale={locale} />;
  }
  const actor = await resolveRootsCoachActorOrNull();
  if (!actor) redirect(`/${locale}/login`);

  // P4.6 · redesign flag. Legacy gate reste autoritaire ; redesign remplace
  // uniquement la vue rendue quand flag=true.
  if (isYemaDashboardRedesignActive()) {
    const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
    return <CoachRacinesDashboard locale={loc} />;
  }

  const stats = await getRootsCoachDashboard(actor.userId);
  return <RootsCoachDashboardView locale={locale} stats={stats} />;
}
