import { redirect } from "next/navigation";
import { isCenterRealDataActive, isYemaDashboardRedesignActive } from "@/lib/flags";
import { resolveCenterActorOrNull } from "@/lib/permissions/center";
import CenterFeaturePlaceholder from "@/components/center/CenterFeaturePlaceholder";
import { CenterDashboard } from "@/features/dashboards/center";
import { InternalPersonaDashboard } from "@/features/dashboards/internal-test/InternalPersonaDashboard";
import { resolveActiveInternalPersona } from "@/lib/internalPersonaPage";

export const dynamic = "force-dynamic";

export default async function CenterPersonaSectionPage({ params }: { params: Promise<{ locale: string; section: string }> }) {
  const { locale, section } = await params;
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const internalPersona = await resolveActiveInternalPersona(["center_admin"]);
  if (internalPersona) return <InternalPersonaDashboard persona={internalPersona} locale={loc} activeSectionId={section} />;
  if (!isCenterRealDataActive()) return <CenterFeaturePlaceholder locale={locale} />;
  const actor = await resolveCenterActorOrNull();
  if (!actor) redirect(`/${locale}/login`);
  if (!isYemaDashboardRedesignActive()) redirect(`/${locale}/center`);
  return <CenterDashboard locale={loc} activeSectionId={section} />;
}
