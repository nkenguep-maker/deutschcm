// P4.3a · Center dashboard · SSR · scope strict centerId.
// Compteurs réels uniquement (teacher/classroom/student/pending). Aucun
// mock. Métriques non calculables affichent "Donnée indisponible".
//
// P4.6 Lot 4B · redesign flag YEMA_DASHBOARD_REDESIGN_ENABLED gate
// la vue rendue quand true. Legacy inchangé quand flag off.

import { redirect } from "next/navigation";
import { isCenterRealDataActive, isYemaDashboardRedesignActive } from "@/lib/flags";
import { resolveCenterActorOrNull } from "@/lib/permissions/center";
import { getCenterDashboard } from "@/lib/center/queries";
import CenterFeaturePlaceholder from "@/components/center/CenterFeaturePlaceholder";
import CenterDashboardView from "@/components/center/CenterDashboardView";
import { CenterDashboard } from "@/features/dashboards/center";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isCenterRealDataActive()) {
    return <CenterFeaturePlaceholder locale={locale} />;
  }
  const actor = await resolveCenterActorOrNull();
  if (!actor) redirect(`/${locale}/login`);

  if (isYemaDashboardRedesignActive()) {
    const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
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
