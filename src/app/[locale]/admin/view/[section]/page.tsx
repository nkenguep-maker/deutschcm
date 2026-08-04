import { redirect } from "next/navigation";
import { isYemaDashboardRedesignActive } from "@/lib/flags";
import { AdminDashboard } from "@/features/dashboards/admin";
import { InternalPersonaDashboard } from "@/features/dashboards/internal-test/InternalPersonaDashboard";
import { resolveActiveInternalPersona } from "@/lib/internalPersonaPage";
import { getAdminEnvSummary, getAdminPersonas, getAdminRecentAudit } from "@/lib/admin/consoleData";

export const dynamic = "force-dynamic";

export default async function AdminPersonaSectionPage({ params }: { params: Promise<{ locale: string; section: string }> }) {
  const { locale, section } = await params;
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const internalPersona = await resolveActiveInternalPersona(["super_admin"]);
  if (internalPersona) return <InternalPersonaDashboard persona={internalPersona} locale={loc} activeSectionId={section} />;
  if (!isYemaDashboardRedesignActive()) redirect(`/${locale}/admin`);
  const [personas, audit, env] = await Promise.all([
    Promise.resolve(getAdminPersonas(loc)),
    getAdminRecentAudit(20),
    Promise.resolve(getAdminEnvSummary()),
  ]);
  return <AdminDashboard locale={loc} personas={personas} audit={audit} env={env} activeSectionId={section} />;
}
