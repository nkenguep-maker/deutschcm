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
