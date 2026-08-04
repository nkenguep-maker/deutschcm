import { redirect } from "next/navigation";
import { isRootsCoachWorkspaceActive, isYemaDashboardRedesignActive } from "@/lib/flags";
import { resolveRootsCoachActorOrNull } from "@/lib/permissions/rootsCoach";
import RootsCoachFeaturePlaceholder from "@/components/rootsCoach/RootsCoachFeaturePlaceholder";
import { CoachRacinesDashboard } from "@/features/dashboards/coach-racines";
import { InternalPersonaDashboard } from "@/features/dashboards/internal-test/InternalPersonaDashboard";
import { resolveActiveInternalPersona } from "@/lib/internalPersonaPage";

export const dynamic = "force-dynamic";

export default async function CoachPersonaSectionPage({ params }: { params: Promise<{ locale: string; section: string }> }) {
  const { locale, section } = await params;
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const internalPersona = await resolveActiveInternalPersona(["coach"]);
  if (internalPersona) return <InternalPersonaDashboard persona={internalPersona} locale={loc} activeSectionId={section} />;
  if (!isRootsCoachWorkspaceActive()) return <RootsCoachFeaturePlaceholder locale={locale} />;
  const actor = await resolveRootsCoachActorOrNull();
  if (!actor) redirect(`/${locale}/login`);
  if (!isYemaDashboardRedesignActive()) redirect(`/${locale}/coach/racines`);
  return <CoachRacinesDashboard locale={loc} activeSectionId={section} />;
}
